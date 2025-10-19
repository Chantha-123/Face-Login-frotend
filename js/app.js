// Main App Module Definition
angular.module('faceLoginApp', [
    'ngRoute',
    'faceLogin.controllers',
    'faceLogin.services',
    'faceLogin.directives'
])

// Configuration
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    
    // Enable HTML5 mode for clean URLs (remove #)
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');
    
    // Route configuration
    $routeProvider
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginController',
            controllerAs: 'loginCtrl'
        })
        .when('/register', {
            templateUrl: 'views/register.html',
            controller: 'RegisterController',
            controllerAs: 'registerCtrl'
        })
        .when('/dashboard', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardController',
            controllerAs: 'dashboardCtrl',
            resolve: {
                auth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isLoggedIn()) {
                        $location.path('/login');
                    }
                }]
            }
        })
        .otherwise({
            redirectTo: '/login'
        });
}])

// Run block for initialization
.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
    // Global event listeners
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        // Add any global route protection logic here
    });
    
    // Global error handler
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
        console.error('Route change error:', rejection);
    });
}])

// Main Controller for navigation - ADD THIS
.controller('MainController', ['$location', 'AuthService', '$rootScope', 
function($location, AuthService, $rootScope) {
    const vm = this;
    
    vm.currentUser = AuthService.getCurrentUser();
    vm.loading = false;
    
    // Check if navigation should be shown
    vm.showNavigation = function() {
        const path = $location.path();
        return path !== '/login' && path !== '/register' && vm.currentUser;
    };
    
    // Logout function
    vm.logout = function() {
        vm.loading = true;
        AuthService.logout().then(function() {
            vm.currentUser = null;
            vm.loading = false;
            $location.path('/login');
        }).catch(function(error) {
            console.error('Logout error:', error);
            vm.loading = false;
            $location.path('/login');
        });
    };
    
    // Listen for authentication state changes using $rootScope
    $rootScope.$on('userLoggedIn', function(event, user) {
        vm.currentUser = user;
    });
    
    $rootScope.$on('userLoggedOut', function() {
        vm.currentUser = null;
    });
    
    // Initialize user state
    vm.initialize = function() {
        vm.currentUser = AuthService.getCurrentUser();
    };
    
    // Initialize controller
    vm.initialize();
}]);