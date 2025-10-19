// Dashboard Controller - Add to existing controllers module
angular.module('faceLogin.controllers')
.controller('DashboardController', ['$scope', '$location', 'AuthService', 
function($scope, $location, AuthService) {
    const vm = this;
    
    vm.currentUser = AuthService.getCurrentUser();

    // Logout user
    vm.logout = function() {
        AuthService.logout()
            .then(function() {
                $location.path('/login');
            })
            .catch(function(error) {
                console.error('Logout error:', error);
                $location.path('/login');
            });
    };

    // Redirect if no user
    if (!vm.currentUser) {
        $location.path('/login');
    }
}]);