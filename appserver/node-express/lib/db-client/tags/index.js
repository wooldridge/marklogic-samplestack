var hookStartRequest = require('./hookStartRequest');

var funcs = {};

var filterResponse = function (response, forTag, start, pageLength) {
  var vals = response['values-response'];
  if (vals) {
    var distinct = vals['distinct-value'];
    var zeroIndexStart = start - 1;
    if (distinct) {
      var newVals = [];
      var ignored = 0;
      _.each(distinct, function (distinctVal) {
        if (!forTag || distinctVal._value.indexOf(forTag) >= 0) {
          if (zeroIndexStart - 1 <= ignored) {
            newVals.push(distinctVal);
            if (newVals.length === pageLength) {
              return false;
            }
          }
          else {
            ignored++;
          }
        }
      });

      vals['distinct-value'] = newVals;
    }
  }
  return response;
};

// TODO In 8.0-1, CANNOT include parse* information with Node Client values
// call, thus we can't get tags constrained to current search qtext/facets
// or typeahead text.
// Fixed in 8.0-2: https://github.com/marklogic/node-client-api/issues/155
//.DO NOT TRY THE BELOW TECHNIQUE AT HONME.
// The use of the hookStartRequest is not recommended. It is a temporary workaround
// for Samplestack 1.1.0, to be used only as long as compatibility with Node
// Client version 1.0.1 is required.
funcs.getTags = function (spec) {
  spec.search.qtext.push('tagword:"*' + spec.search.forTag + '*"');
  var start = spec.search.start;
  delete spec.search.start;
  var pageLength = spec.search.pageLength;
  delete spec.search.pageLength;

  spec.search.options = {
    values: {
      range: {
        type: 'xs:string',
        'json-property': 'tags'
      },
      name: 'tags',
      'values-option': 'item-order'
    }
  };
  var result = this.documents.query(spec).result();

  return result.then(function (response) {
    return filterResponse(response, spec.search.forTag, start, pageLength);
  })
  .catch(function (err) {
    throw err;
  });
};

funcs.getRelatedTags = function (spec) {
  var self = this;
  var start = spec.search.start;
  delete spec.search.start;
  var pageLength = spec.search.pageLength;
  delete spec.search.pageLength;
  var sort = spec.search.sort;
  delete spec.search.sort;

  // First call to resources endpoint, get related tags
  return self.resources.get({
    name: 'relatedTags',
    params: {
      'tag':spec.search.relatedTo
    }
  }).result().then(function (response) {

    spec.search.options = {
      values: {
        range: {
          type: 'xs:string',
          'json-property': 'tags'
        },
        name: 'tags',
        'values-option': 'frequency-order'
      }
    };

    // Add ORed tags to qtext
    var orString = "tag:" + response[0].content.reltags.join(" OR tag:");
    spec.search.qtext.push(orString);

    // Second call to tags endpoint (via hookStartRequest)
    return self.documents.query(spec)
    .result().then(function (response2) {

      // Only return tag values that exist in first results set
      var newDistVals = [];
      if (response2['values-response']['distinct-value']) {
        _.each(response2['values-response']['distinct-value'], function (item) {
          if (_.contains(response[0].content.reltags, item._value)) {
            newDistVals.push(item)
          }
        });
      }

      response2['values-response']['distinct-value'] = newDistVals;

      return response2;
    })
  })
  .catch(function (err) {
    throw err;
  });
};


module.exports = function (connection) {
  // create an object with the funcs all bound to the given connection
  var self = {};
  _.each(funcs, function (func, name) {
    self[name] = func.bind(connection);
  });
  return self;
};
