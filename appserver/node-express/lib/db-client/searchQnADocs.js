var qb = require('marklogic').queryBuilder;
var parseSearchQuery = libRequire('./db-client/parseSearchQuery');

/**
 * Perform a Samplestack search based on user-submitted query text and
 * facet, sort, and paging selections.
 *
 * @param {Object} req Request object
 * @return {Object}
 */

 module.exports = function (req) {

  // parse query JSON from browser
  var parsedQuery = parseSearchQuery(req.body);

  // get pagination values
  var resultsPerPage = 10;
  var start = req.body.search.start;

  // get sort
  var sort;
  switch(parsedQuery.sort) {
    case 'sort:active':
      sort = qb.sort('lastActivityDate', 'descending');
      break;
    case 'sort:votes':
      sort = qb.sort('voteCount', 'descending');
      break;
    default:
      sort = qb.score(); // default relevance
      // sort.item = 'relevance';
      // sort.direction = 'descending';
  }

  // build facet constraints
  var user = qb.value('user', parsedQuery.user);
  var resolved = qb.value('resolved', parsedQuery.resolved);
  var lastActivityGE = qb.range('lastActivityDate', '>=', parsedQuery.lastActivityGE);
  var lastActivityLT = qb.range('lastActivityDate', '<', parsedQuery.lastActivityLT);
  var tagsQueries = [];
  if (parsedQuery.tags) {
    for (i = 0; i < parsedQuery.tags.length; ++i) {
      tagsQueries.push(qb.range("tags", parsedQuery.tags[i]));
    }
  }

  // construct query with QueryBuilder
  var query = qb.where(
    qb.parsedFrom(
      // query text from search box
      parsedQuery.qtext,
      // define constraints allowed in query text (e.g., "askedBy:joeUser")
      qb.parseBindings(
        qb.range(qb.pathIndex('/owner/displayName'), qb.bind('askedBy')),
        qb.range(qb.pathIndex('/answers/owner/displayName'), qb.bind('answeredBy')),
        qb.range(qb.pathIndex('//comments/owner/displayName'), qb.bind('commentedBy')),
        qb.value('displayName', qb.bind('user')),
        qb.range('id', qb.bind('id')),
        qb.word('title', qb.bind('title')),
        qb.word('accepted', qb.bind('resolved')),
        qb.range('lastActivityDate', qb.bind('lastActivity')),
        qb.range('voteCount', qb.bind('votes')),
        qb.range('answerCount', qb.bind('answers'))
      )
    ),
    // limit search to qna docs directory
    qb.directory('/questions/'),
    // AND together facet constraints
    // TODO add user, resolved
    qb.and(lastActivityGE, lastActivityLT, tagsQueries)
  )
  // apply sort
  .orderBy(sort)
  // return tag facets in results
  .calculate(
    qb.facet('tag', "tags", qb.facetOptions(
      'frequency-order', 'descending', "limit=10"
    ))
  )
  // handle paging and turn on snippets
  .slice(start, resultsPerPage, qb.snippet())
  // miscellaneous settings for testing (TODO remove)
  .withOptions({
    queryPlan: true,
    metrics: false,
    debug: true
  });

  return this.documents.query(query).result();
};
