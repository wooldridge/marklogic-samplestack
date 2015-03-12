var qb = require('marklogic').queryBuilder;
var vb = require('marklogic').valuesBuilder;
var moment = require('moment-timezone');
var parseSearchQuery = libRequire('./db-client/parseSearchQuery');

/**
 * Perform a Samplestack search based on user-submitted query text and
 * facet, sort, and paging selections. The search involves the following:
 *
 * 1. Parse structured JSON query from browser.
 * 2. Set up variables for pagination, sorting, and facet retrieval.
 * 3. Build search clause with submitted qtext and defined constraints.
 * 4. Perform a values.read() to get min and max last-activity dates
 *    from the results.
 * 5. Build the bucket constraints based on the min and max dates.
 * 6. Perform a documents.query() to get the search results.
 *
 * @param {Object} req Request object
 * @return {Object}
 */

 module.exports = function (req) {

  var self = this;

  // parse query JSON from browser
  var parsedQuery = parseSearchQuery(req.body);

  // pagination
  var resultsPerPage = 10; // TODO get from options?
  var start = parsedQuery.start;

  // sorting
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
  }

  // facets
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

  // search clause used in both values query and search query
  // see: http://docs.marklogic.com/jsdoc/queryBuilder.html#parsedFrom
  var parsedFrom = qb.parsedFrom(
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
  );

  // construct values query with ValuesBuilder
  // see: http://docs.marklogic.com/jsdoc/valuesBuilder.html
  var valuesQuery = vb.fromIndexes(
    // get values from lastActivityDate prop
    vb.range('lastActivityDate')
  )
  .where(
    parsedFrom,
    qb.directory('/questions/'), // limit to qna docs
    qb.and(lastActivityGE, lastActivityLT, tagsQueries)
  )
  // get min and max aggregates
  .aggregates('min', 'max').
  // don't return the values, only aggregates
  slice(0);

  return this.values.read(valuesQuery).result(function(response) {

    // from values call, get min and max dates, adjusting for timezone
    var min = moment(
      response['values-response']['aggregate-result'][0]['_value']
    ).tz(parsedQuery.timezone);
    var max = moment(
      response['values-response']['aggregate-result'][1]['_value']
    ).tz(parsedQuery.timezone);
    // adjust to start and end of months
    var minDate = min.clone().startOf('month');
    var maxDate = max.clone().endOf('month');
    // create date buckets for facet
    // see: http://docs.marklogic.com/jsdoc/queryBuilder.html#bucket
    var dateBuckets = [];
    var currDate = minDate.clone();
    while (currDate < maxDate) {
      var nextDate = currDate.clone().add(1, 'month');
      var label = currDate.format('YYYY-MM-DD');
      dateBuckets.push(
        qb.bucket(
          currDate.format(),
          currDate.format(),
          '<',
          nextDate.format()
        )
      );
      currDate = nextDate;
    }
    // add params for qb.facet.apply() below
    dateBuckets.unshift('date', 'lastActivityDate')

    // construct search query with QueryBuilder
    // see: http://docs.marklogic.com/jsdoc/queryBuilder.html
    var searchQuery = qb.where(
      parsedFrom,
      qb.directory('/questions/'), // limit to qna docs
      qb.and(lastActivityGE, lastActivityLT, tagsQueries)
    )
    // apply sort
    .orderBy(sort)
    // return tag and date facets in results
    .calculate(
      qb.facet('tag', "tags", qb.facetOptions(
        'frequency-order', 'descending', "limit=10"
      )),
      // variable num of buckets, so use apply()
      qb.facet.apply(this, dateBuckets)
    )
    // handle paging and turn on snippets
    .slice(start, resultsPerPage, qb.snippet())
    // miscellaneous settings for testing
    // TODO remove after testing
    .withOptions({
      queryPlan: true,
      metrics: false,
      debug: true
    });

    return self.documents.query(searchQuery).result();

  });

};
