// Define the controllers module first
angular.module('faceLogin.controllers', [])

// Login Controller
.controller('LoginController', ['$scope', '$location', 'AuthService', 'CameraService', 
function($scope, $location, AuthService, CameraService) {
    const vm = this;
    
    // Initialize variables
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

    // Initialize controller
    vm.initialize = function() {
        vm.checkCameraAvailability();
    };

    // Check camera availability properly
    vm.checkCameraAvailability = function() {
        vm.checkingCamera = true;
        vm.cameraAvailable = CameraService.isCameraAvailable();
        
        if (!vm.cameraAvailable) {
            vm.checkingCamera = false;
            vm.cameraError = true;
            vm.message = 'Camera not supported in this browser/environment.';
            return;
        }

        CameraService.checkCameraAvailability()
            .then(function(available) {
                vm.cameraAvailable = available;
                if (!available) {
                    vm.cameraError = true;
                    vm.message = 'Camera not available. Please use file upload.';
                } else {
                    vm.message = 'Camera is available! Click to open.';
                    vm.isSuccess = true;
                }
            })
            .catch(function() {
                vm.cameraAvailable = false;
                vm.cameraError = true;
                vm.message = 'Camera check failed. Please use file upload.';
            })
            .finally(function() {
                vm.checkingCamera = false;
                $scope.$apply();
            });
    };

    // Initialize camera when user clicks to open
    vm.openCamera = function() {
        if (!vm.cameraAvailable || vm.cameraError) {
            vm.message = 'Camera not available. Please use file upload.';
            vm.isSuccess = false;
            return;
        }

        vm.loading = true;
        vm.message = 'Initializing camera...';

        setTimeout(function() {
            vm.videoElement = document.getElementById('loginVideo');
            if (vm.videoElement) {
                CameraService.initializeCamera(vm.videoElement)
                    .then(function() {
                        vm.cameraError = false;
                        vm.isCameraActive = true;
                        vm.message = 'Camera ready! Position your face in the frame.';
                        vm.isSuccess = true;
                        $scope.$apply();
                    })
                    .catch(function(error) {
                        console.error('Camera error:', error);
                        vm.cameraError = true;
                        vm.isCameraActive = false;
                        vm.message = error.message || 'Camera not available. Please use file upload.';
                        vm.isSuccess = false;
                        $scope.$apply();
                    })
                    .finally(function() {
                        vm.loading = false;
                        $scope.$apply();
                    });
            } else {
                vm.loading = false;
                vm.message = 'Video element not found.';
                vm.isSuccess = false;
                $scope.$apply();
            }
        }, 100);
    };

    // Capture image from camera
    vm.captureImage = function() {
        if (!vm.videoElement || vm.cameraError || !vm.isCameraActive) {
            vm.message = 'Camera is not available or not activated.';
            vm.isSuccess = false;
            return;
        }

        vm.loading = true;
        vm.message = 'Capturing image...';

        CameraService.captureImage(vm.videoElement)
            .then(function(result) {
                vm.capturedImage = result.imageUrl;
                vm.faceImage = result.file;
                vm.message = '✅ Face captured successfully!';
                vm.isSuccess = true;
                vm.isCameraActive = false;
                CameraService.stopCamera();
                $scope.$apply();
            })
            .catch(function(error) {
                vm.message = 'Failed to capture image: ' + error.message;
                vm.isSuccess = false;
                $scope.$apply();
            })
            .finally(function() {
                vm.loading = false;
                $scope.$apply();
            });
    };

    // Retake image
    vm.retakeImage = function() {
        if (vm.capturedImage) {
            URL.revokeObjectURL(vm.capturedImage);
        }
        vm.capturedImage = null;
        vm.faceImage = null;
        vm.message = '';
        vm.openCamera();
    };

    // Close camera without capturing
    vm.closeCamera = function() {
        CameraService.stopCamera();
        vm.isCameraActive = false;
        vm.message = 'Camera closed.';
    };

    // Handle file upload
    vm.onFileSelect = function(file) {
        if (!file) {
            vm.message = 'No file selected.';
            vm.isSuccess = false;
            return;
        }

        if (!file.type.startsWith('image/')) {
            vm.message = 'Please select an image file.';
            vm.isSuccess = false;
            return;
        }

        vm.faceImage = file;
        if (vm.capturedImage) {
            URL.revokeObjectURL(vm.capturedImage);
            vm.capturedImage = null;
        }
        vm.closeCamera();
        vm.message = '📁 Image selected! Ready to login.';
        vm.isSuccess = true;
    };

    // Login user
    vm.login = function() {
        if (!vm.faceImage) {
            vm.message = 'Please capture your face or upload an image.';
            vm.isSuccess = false;
            return;
        }

        vm.loading = true;
        vm.message = '🔐 Verifying your face...';

        AuthService.login(vm.faceImage)
            .then(function(response) {
                vm.loading = false;
                vm.message = response.message;
                vm.isSuccess = response.success;
                
                if (response.success) {
                    vm.message = '✅ Login successful! Redirecting...';
                    setTimeout(function() {
                        $location.path('/dashboard');
                        $scope.$apply();
                    }, 1500);
                }
            })
            .catch(function(error) {
                vm.loading = false;
                vm.message = error.message || '❌ Login failed. Please try again.';
                vm.isSuccess = false;
            });
    };

    // Navigate to register page
    vm.goToRegister = function() {
        CameraService.stopCamera();
        if (vm.capturedImage) {
            URL.revokeObjectURL(vm.capturedImage);
        }
        $location.path('/register');
    };

    // Initialize the controller
    vm.initialize();

    // Clean up when controller is destroyed
    $scope.$on('$destroy', function() {
        CameraService.stopCamera();
        if (vm.capturedImage) {
            URL.revokeObjectURL(vm.capturedImage);
        }
    });
}]);