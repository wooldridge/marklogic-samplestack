define(['app/module'], function (module) {

  module.controller('errorCtlr', [

    '$scope', '$window', 'appRouting',
    function ($scope, $window, appRouting) {
      $scope.goBack = function () {
        $window.history.back();
      };
      // reason for error
      $scope.reason = appRouting.params.reason;
    }

  ]);

});
