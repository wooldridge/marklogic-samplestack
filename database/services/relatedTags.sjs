/*
 * relatedTags.sjs
 *
 * Finds tags related to a given tag
 * by way of executing a SPARQL query against
 * dbpedia data.
 *
 * also spins off a lexicon call for each tag
 * to get the total document count for a given tag.
 */
var sem = require("/MarkLogic/semantics.xqy");

function get(context, params) {
    var tag = params.tag;  // required
    var structuredQuery = params.structuredQuery;  // required
    var queryResults = sem.sparql(
        'prefix dbr: <http://dbpedia.org/resource/>              '+
        'prefix dbc: <http://dbpedia.org/resource/Category:>     '+
        'prefix dc: <http://purl.org/dc/terms/>                  '+
        'prefix dbo: <http://dbpedia.org/ontology/>              '+
        'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>    '+
                                                                ''+
        'select distinct (lcase(?label2) as ?relatedTag)         '+
        'where                                                   '+
        '{                                                       '+
           '?r rdfs:label ?label ;                               '+
               'dc:subject ?sub .                                '+
           '?r2 dc:subject ?sub ;                                '+
               'rdfs:label ?label2 .                             '+
           'filter (?r != ?r2)                                   '+
           'filter (lcase(?label) = $tag)                        '+
        '}                                                       '+
        'order by ?label2 limit 5000', {tag: tag});
    var resultObject = {};
    var queryStrings = [];
    for (var result of queryResults) {
        queryStrings.push(result.relatedTag);
        var relatedTag = result.relatedTag;
        var estimate = cts.estimate(cts.jsonPropertyValueQuery("tags", relatedTag));
        xdmp.log("Found related tag " + relatedTag + " with est. " + estimate);
        if (estimate > 0) resultObject[relatedTag] = estimate;
    };
    var queryString = "tag:" + queryStrings.join(" OR tag:");
    context.outputTypes = ["application/json"];
    resultObject.qtext = queryString;
    return resultObject;
};

exports.GET = get;
