var _ = require('lodash');
var Promise = require('bluebird');
var mlclient = require('marklogic');
var fs = require('fs')

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

function postQuestion(filename, content) {
  var uri = '/questions/' + filename;
  var data = {uri: uri, content: content};
  return new Promise(function (resolve, reject) {
    db.documents.write(data).result(
      function (response) {
        console.log(JSON.stringify(response, null, ' '));
      },
      reject
    );
  });
}

// Take filename from command line
var filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, content) {
  if (err) throw err;
  postQuestion(filename, content);
});

