define(['app/module'], function (module) {

  /**
   * @ngdoc directive
   * @name ssSearchResults
   * @restrict E
   *
   * @description
   * Directive for displaying a set of search results.
   *
   * The view binds to various properties of the `$scope.results` property
   * and assigns the `item` property in an ngRepeater
   * for use by the {@link ssSearchResult} directive.
   *
   */
  module.directive('ssSearchResults', [
    '$parse',
    function ($parse) {
      return {
        restrict: 'E',
        templateUrl: '/app/directives/ssSearchResults.html',
        scope: {
          search: '='
        },
        link: function (scope, element, attrs) {
          scope.$watch('search.results', function () {

            scope.sorts = [
              {
                label: 'Relevance',
                value: ['relevance'],
                active: scope.searchMode()
              },
              {
                label: 'Newest',
                value: ['active'],
                active: true
              },
              {
                label: 'Votes',
                value: ['votes'],
                active: true
              }
            ];

            scope.getSelectedSort = function () {
              if (!scope.search.criteria.sort) {
                if (scope.search.criteria.q &&
                  scope.search.criteria.q.length
                ) {
                  return 'relevance';
                }
                else {
                  return 'active';
                }
              }
              else {
                return scope.search.criteria.sort[0];
              }
            };

            scope.setSort = function (sort) {
              scope.search.criteria.sort = sort;
              scope.$emit('criteriaChange');
            };

            scope.incrementPage = function (increment) {
              if (scope.search.incrementPage(increment)) {
                scope.$emit('criteriaChange');
              }
            };

            scope.setCurrentPage = function (pageNum) {
              if (scope.search.setCurrentPage(pageNum)) {
                scope.$emit('criteriaChange');
              }
            };

          });

          scope.searchMode = function () {
            return scope.search.criteria.q;
          };
        }
      };
    }
  ]);
});
