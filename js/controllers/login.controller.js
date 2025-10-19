angular.module('faceLogin.controllers', [])
.controller('LoginController', ['$scope', '$location', '$timeout', 'AuthService', 'CameraService',
function($scope, $location, $timeout, AuthService, CameraService) {
    const vm = this;

    // -------------------
    // State
    // -------------------
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

    // -------------------
    // Initialization
    // -------------------
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

    // -------------------
    // Camera Controls
    // -------------------
    vm.openCamera = function() {
        if (!vm.cameraAvailable || vm.cameraError) {
            vm.message = 'Camera not available. Please use file upload.';
            return;
        }

        vm.isCameraActive = true;
        vm.loading = true;
        vm.message = 'Initializing camera...';

        $timeout(async function() {
            vm.videoElement = document.getElementById('loginVideo');
            if (!vm.videoElement) {
                vm.loading = false;
                vm.message = 'Camera view not found in page.';
                return;
            }

            try {
                await CameraService.initializeCamera(vm.videoElement);
                vm.loading = false;
                vm.message = 'Camera ready. Align your face in the frame.';
                vm.isSuccess = true;

                // Auto-capture after fixed delay
                vm.startAutoCapture();
            } catch(err) {
                vm.loading = false;
                vm.cameraError = true;
                vm.message = err.message || 'Failed to access camera.';
            }
        }, 500);
    };

    // -------------------
    // Auto-capture after fixed time
    // -------------------
    vm.startAutoCapture = function() {
        // Capture automatically after 3 seconds
        $timeout(() => {
            if (vm.isCameraActive && !vm.capturedImage) {
                vm.captureImage();
            }
        }, 3000); // 3 seconds delay
    };

    // -------------------
    // Capture Image
    // -------------------
    vm.captureImage = function() {
        if (!vm.videoElement || vm.capturedImage) return;

        vm.loading = true;
        vm.message = 'Capturing face automatically...';

        CameraService.captureImage(vm.videoElement)
            .then(result => {
                vm.capturedImage = result.imageUrl;
                vm.faceImage = result.file;
                vm.isCameraActive = false;
                vm.message = '✅ Face captured successfully! Logging in...';
                CameraService.stopCamera();
                $scope.$applyAsync();

                // Auto-login
                vm.login();
            })
            .catch(err => {
                vm.message = 'Capture failed: ' + err.message;
                vm.loading = false;
            });
    };

    // -------------------
    // Retake / Close Camera
    // -------------------
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

    // -------------------
    // File Upload
    // -------------------
    vm.onFileSelect = function(file) {
        if (!file) return;
        vm.faceImage = file;
        vm.capturedImage = null;
        vm.message = '📁 Image selected. Ready to login.';
        vm.isSuccess = true;
    };

    // -------------------
    // Login
    // -------------------
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

    // -------------------
    // Navigation
    // -------------------
    vm.goToRegister = function() {
        CameraService.stopCamera();
        $location.path('/register');
    };

    $scope.$on('$destroy', function() {
        CameraService.stopCamera();
    });

    // -------------------
    // Start
    // -------------------
    vm.initialize();
}]);
