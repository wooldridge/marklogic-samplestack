var mlrest = require('marklogic/lib/mlrest');
var origStartRequest = mlrest.startRequest;
var util = require('util');

mlrest.startRequest = function (operation) {
  if (
    operation.options.path === '/v1/search?format=json&category=content' &&
    operation.requestBody && operation.requestBody.search &&
    operation.requestBody.search.forTag
  ) {
    operation.options.path = '/v1/values/tags?' +
        'pageLength=10000&options=tags&start=1&aggregate=count';
    operation.options.headers.accept = 'application/json';
  } else if (
    operation.options.path === '/v1/search?format=json&category=content' &&
    operation.requestBody && operation.requestBody.search &&
    operation.requestBody.search.relatedTo
  ) {
    operation.options.path = '/v1/resources/relatedTags?rs:tag=' +
      operation.requestBody.search.relatedTo;
    operation.options.headers.accept = 'application/json';
    console.log('relatedTo!!!!');
  }
  return origStartRequest(operation);
};
