var qb = require('marklogic').queryBuilder;
var vb = require('marklogic').valuesBuilder;
var parseSearchQuery = require('./parseSearchQuery');

var funcs = {};

// For typeahead (filtered) and ask tags (not filtered)
funcs.getTags = function (spec) {

  var parsedQuery = parseSearchQuery(spec);

  // facet constraints
  var facets = [];
  if (parsedQuery.user) {
    facets.push(qb.value('displayName', parsedQuery.user));
  }
  if (parsedQuery.resolved) {
    facets.push(qb.value('accepted', parsedQuery.resolved));
  }
  if (parsedQuery.lastActivityGE) {
    facets.push(qb.range('lastActivityDate', '>=', parsedQuery.lastActivityGE));
  }
  if (parsedQuery.lastActivityLT) {
    facets.push(qb.range('lastActivityDate', '>=', parsedQuery.lastActivityLT));
  }
  if (parsedQuery.tags) {
    for (i = 0; i < parsedQuery.tags.length; ++i) {
      facets.push(qb.range("tags", parsedQuery.tags[i]));
    }
  }

  var forTag = spec.forTag;

  var valuesQuery = vb.fromIndexes(
    vb.range('tags')
  )
  .where(qb.and.apply(this, facets))
  .aggregates('count')
  .withOptions({values: ["frequency-order", "descending", "limit=10"]});

  console.log(JSON.stringify(valuesQuery, null, ' '));

  // TODO In 8.0-1, CANNOT include parse* information with Node Client values
  // call, thus we can't get tags constrained to current search qtext/facets
  // or typeahead text.
  // Fixed in 8.0-2: https://github.com/marklogic/node-client-api/issues/155

  return this.values.read(valuesQuery).result()
  .then(function (response) {
    // Rearrange response so it looks like the Java tier's
    // TODO Temporary, we want to avoid this
    var distVals = [];
    var item;
    for (var i = 0; i < response['values-response']['tuple'].length; i++) {
      item = response['values-response']['tuple'][i];
      distVals.push({
        'frequency': item['frequency'],
        '_value': item['distinct-value'][0]
      });
    }
    response['values-response']['distinct-value'] = distVals;
    delete response['values-response']['tuple'];
    return response;
  });

};

// For related tags
// TODO in progress
funcs.getRelatedTags = function (spec) {

  var relatedTo = spec.relatedTo;

  var valuesQuery = vb.fromIndexes(
    vb.range('tags')
  );

  return this.resources.get(
    {name:'relatedTags', params:{tag:relatedTo}}
  ).result();

};

module.exports = function (connection) {
  // create an object with the funcs all bound to the given connection
  var self = {};
  _.each(funcs, function (func, name) {
    self[name] = func.bind(connection);
  });
  return self;
};
