var mlrest = require('marklogic/lib/mlrest');
var origStartRequest = mlrest.startRequest;
var util = require('util');

mlrest.startRequest = function (operation) {
  // Handle forTag call
  if (
    operation.options.path === '/v1/search?format=json&category=content' &&
    operation.requestBody && operation.requestBody.search &&
    operation.requestBody.search.forTag
  ) {
    operation.options.path = '/v1/values/tags?' +
        'pageLength=10000&options=tags&start=1&aggregate=count';
    operation.options.headers.accept = 'application/json';
  }
  // Handle FIRST relatedTag call
  else if (
    operation.options.path === '/v1/search?format=json&category=content' &&
    operation.requestBody && operation.requestBody.search &&
    operation.requestBody.search.relatedTo &&
    operation.requestBody.search.qtext.length === 1
  ) {
    operation.options.path = '/v1/resources/relatedTags?rs:tag=' +
      operation.requestBody.search.relatedTo;
    operation.options.method = 'GET';
    operation.options.headers.accept = 'application/json';
    console.log('FIRST relatedTo!!!!');

  }
  // Handle SECOND relatedTag call
  else if (
    operation.options.path === '/v1/search?format=json&category=content' &&
    operation.requestBody && operation.requestBody.search &&
    operation.requestBody.search.relatedTo &&
    operation.requestBody.search.qtext.length === 2
  ) {
    operation.options.path = '/v1/values/tags?' +
        'pageLength=100&options=tags&start=1&aggregate=count';
    operation.options.headers.accept = 'application/json';
    console.log('SECOND relatedTo!!!!');
  }
  return origStartRequest(operation);
};
