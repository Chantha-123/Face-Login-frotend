angular.module('faceLogin.controllers', [])
.controller('LoginController', ['$scope', '$location', '$timeout', 'AuthService', 'CameraService',
function($scope, $location, $timeout, AuthService, CameraService) {
    const vm = this;

    // State
    vm.loading = false;
    vm.message = '';
    vm.isSuccess = false;
    vm.cameraAvailable = false;
    vm.cameraError = false;
    vm.capturedImage = null;
    vm.faceImage = null;
    vm.videoElement = null;
    vm.isCameraActive = false;
    vm.checkingCamera = true;

    // Initialize
    vm.initialize = function() {
        vm.checkCameraAvailability();
    };

    vm.checkCameraAvailability = function() {
        vm.checkingCamera = true;
        CameraService.checkCameraAvailability()
            .then(() => {
                vm.cameraAvailable = true;
                vm.message = 'Camera is available. Click to start.';
            })
            .catch(() => {
                vm.cameraAvailable = false;
                vm.cameraError = true;
                vm.message = 'Camera not available. Please use file upload.';
            })
            .finally(() => {
                vm.checkingCamera = false;
                $scope.$applyAsync();
            });
    };

    vm.openCamera = function() {
        if (!vm.cameraAvailable || vm.cameraError) {
            vm.message = 'Camera not available. Please use file upload.';
            return;
        }

        vm.isCameraActive = true;
        vm.loading = true;
        vm.message = 'Initializing camera...';

        // Wait for DOM to render before getting video element
        $timeout(function() {
            vm.videoElement = document.getElementById('loginVideo');
            if (!vm.videoElement) {
                vm.loading = false;
                vm.message = 'Camera view not found in page.';
                return;
            }

            CameraService.initializeCamera(vm.videoElement)
                .then(() => {
                    vm.loading = false;
                    vm.message = 'Camera ready. Position your face in the frame.';
                    vm.isSuccess = true;
                })
                .catch((err) => {
                    vm.loading = false;
                    vm.cameraError = true;
                    vm.message = err.message || 'Failed to access camera.';
                });
        }, 500);
    };

    vm.captureImage = function() {
        if (!vm.videoElement) {
            vm.message = 'Camera not ready.';
            return;
        }

        vm.loading = true;
        vm.message = 'Capturing face...';

        CameraService.captureImage(vm.videoElement)
            .then(result => {
                vm.capturedImage = result.imageUrl;
                vm.faceImage = result.file;
                vm.isCameraActive = false;
                vm.message = '✅ Face captured successfully!';
                CameraService.stopCamera();
                $scope.$applyAsync();
            })
            .catch(err => {
                vm.message = 'Capture failed: ' + err.message;
            })
            .finally(() => {
                vm.loading = false;
            });
    };

    vm.retakeImage = function() {
        vm.capturedImage = null;
        vm.faceImage = null;
        vm.openCamera();
    };

    vm.closeCamera = function() {
        CameraService.stopCamera();
        vm.isCameraActive = false;
        vm.message = 'Camera closed.';
    };

    vm.onFileSelect = function(file) {
        if (!file) return;
        vm.faceImage = file;
        vm.capturedImage = null;
        vm.message = '📁 Image selected. Ready to login.';
        vm.isSuccess = true;
    };

    vm.login = function() {
        if (!vm.faceImage) {
            vm.message = 'Please capture or upload your face.';
            return;
        }

        vm.loading = true;
        vm.message = '🔐 Verifying your face...';

        AuthService.login(vm.faceImage)
            .then(response => {
                vm.loading = false;
                vm.message = response.message;
                vm.isSuccess = response.success;
                if (response.success) {
                    vm.message = '✅ Login successful! Redirecting...';
                    $timeout(() => $location.path('/dashboard'), 1500);
                }
            })
            .catch(err => {
                vm.loading = false;
                vm.message = err.message || '❌ Login failed. Please try again.';
                vm.isSuccess = false;
            });
    };

    vm.goToRegister = function() {
        CameraService.stopCamera();
        $location.path('/register');
    };

    $scope.$on('$destroy', function() {
        CameraService.stopCamera();
    });

    vm.initialize();
}]);
