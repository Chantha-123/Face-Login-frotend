angular.module('yourApp').controller('PreviewDialogController', 
  ['$mdDialog', 'imageDataUrl', 
  function($mdDialog, imageDataUrl) {
    var vm = this;
    
    vm.imageDataUrl = imageDataUrl;
    
    vm.confirm = function() {
        $mdDialog.hide(true);
    };
    
    vm.cancel = function() {
        $mdDialog.cancel();
    };
    
    vm.retake = function() {
        $mdDialog.cancel('retake');
    };
}]);