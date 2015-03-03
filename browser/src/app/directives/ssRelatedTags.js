define([
  'app/module'
], function (module) {
  /* jshint ignore:start */

  /**
   * @ngdoc directive
   * @name ssRelatedTags
   * @restrict E
   * @param {undefined} ssRelatedTags
   *
   * @description
   * Display a related-tags popup box
   *
   * ## `scope` properties/methods:
   *
   * | Variable  | Type | Details |
   * |--|--|--|
   * | `foo`  | {@type function}  | Description of foo. |
   */

  /* jshint ignore:end */

  module.directive('ssRelatedTags', [
    'ssTagsSearch',
    'mlUtil',
    function (
      ssTagsSearch,
      mlUtil
    ) {
    return {
      restrict: 'E',
      templateUrl: '/app/directives/ssRelatedTags.html',
      scope: {
        criteria: '=',       // Tags in the selection criteria
        tag: '=',
        show: '='
      },
      link: function (scope, element, attrs) {

        scope.relatedTags = null;
        scope.loading = true;

       /**
        * Populate and show related-tag popup. Uses ssTagsSearch to
        * retrieve tag data.
        */
        scope.show = function () {
          var tagsSearch = ssTagsSearch.create({
            criteria: {
              tagsQuery: {
                start: 1,
                pageLength: 100,
                relatedTo: scope.tag.name,
                sort: 'frequency'
              }
            }
          });
          tagsSearch.post().$ml.waiting.then(function () {
            scope.relatedTags = tagsSearch.results.items;
            scope.loading = false;
          });
        };

       /**
        * Set clicked tag as only tag in criteria then initiate new search.
        * @param {object} selTag Selected tag object.
        */
        scope.selectRelated = function (selTag) {
          scope.criteria.values = [selTag.name];
          scope.$emit('criteriaChange');
        };

      }
    };
  }]);
});
