var _ = require('lodash');
var Promise = require('bluebird');
var mlclient = require('marklogic');

var db = {
  host:     '127.0.0.1',
  port:     '8006',
  authType: 'DIGEST'
};

var contributor = {
  user: 'samplestack-contributor',
  password: 'sc-pass'
};

var visitor = {
  user: 'samplestack-guest',
  password: 'sa-pass'
};

var db = mlclient.createDatabaseClient(
  // contributor or visitor
  _.merge(db, contributor)
);

function getQuestion(id) {
  var uri = '/questions/' + id + '.json';
  return new Promise(function (resolve, reject) {
    db.documents.read(uri).result(
      function (response) {
        console.log(JSON.stringify(response[0].content, null, ' '));
      },
      reject
    );
  });
}

// Take id from command line
getQuestion(process.argv[2]);
