var queryOptions = libRequire('../../../database/options/questions.json');

module.exports = function (req) {

  var query = req.body;
  delete query.search.start; // remove start prop, it breaks things

  console.log(JSON.stringify(query, null, 2));

  _.merge(query.search, _.clone(queryOptions));

  return this.documents.query(query).result();
};
