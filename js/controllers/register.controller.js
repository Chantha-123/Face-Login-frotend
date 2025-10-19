angular.module('faceLogin.controllers')
.controller('RegisterController', ['$scope', '$location', '$timeout', 'AuthService', 'CameraService', 
function($scope, $location, $timeout, AuthService, CameraService) {
    const vm = this;

    // Variables
    vm.loading = false;
    vm.message = '';
    vm.isSuccess = false;
    vm.cameraAvailable = false;
    vm.cameraError = false;
    vm.capturedImage = null;
    vm.faceImage = null;
    vm.videoStream = null;
    vm.showCameraDialog = false;
    vm.userData = { username: '', email: '' };
    vm.checkingCamera = true;

    // Initialize controller
    vm.initialize = function() {
        vm.checkCameraAvailability();
    };

    // Open camera dialog
    vm.openCameraDialog = function () {
        vm.showCameraDialog = true;

        $timeout(function () {
            const video = document.getElementById('cameraVideo');
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    vm.videoStream = stream;
                    video.srcObject = stream;
                    video.play();
                })
                .catch(() => {
                    alert('Unable to access the camera.');
                    vm.closeCameraDialog();
                    $scope.$apply();
                });
        }, 100);
    };

    // Capture image from camera dialog
    vm.captureFromDialog = function () {
        const video = document.getElementById('cameraVideo');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Save Base64 for preview
        vm.capturedImage = canvas.toDataURL('image/png');

        // Convert to Blob/File for registration
        const blob = vm.dataURLtoBlob(vm.capturedImage);
        vm.faceImage = new File([blob], 'face.png', { type: 'image/png' });

        vm.message = '✅ Face captured successfully!';
        vm.isSuccess = true;

        vm.closeCameraDialog();
        $scope.$apply();
    };

    // Retake image
    vm.retakeImage = function () {
        vm.capturedImage = null;
        vm.faceImage = null;
        vm.message = '';
        vm.openCameraDialog();
    };

    // Close camera dialog
    vm.closeCameraDialog = function () {
        if (vm.videoStream) {
            vm.videoStream.getTracks().forEach(track => track.stop());
            vm.videoStream = null;
        }
        vm.showCameraDialog = false;
    };

    // Convert Base64 to Blob
    vm.dataURLtoBlob = function(dataURL) {
        const parts = dataURL.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uInt8Array[i] = raw.charCodeAt(i);
        return new Blob([uInt8Array], { type: contentType });
    };

    // Handle file upload
    vm.onFileSelect = function(file) {
        if (!file || !file.type.startsWith('image/')) {
            vm.message = 'Please select a valid image file.';
            vm.isSuccess = false;
            return;
        }
        vm.faceImage = file;
        if (vm.capturedImage) URL.revokeObjectURL(vm.capturedImage);
        vm.capturedImage = null;
        vm.stopCamera();
        vm.message = '📁 Image selected! Ready to register.';
        vm.isSuccess = true;
    };

    // Stop camera
    vm.stopCamera = function() {
        if (vm.videoStream) {
            vm.videoStream.getTracks().forEach(track => track.stop());
            vm.videoStream = null;
        }
    };

    // Check camera availability
    vm.checkCameraAvailability = function() {
        vm.checkingCamera = true;
        vm.cameraAvailable = CameraService.isCameraAvailable();

        if (!vm.cameraAvailable) {
            vm.cameraError = true;
            vm.message = 'Camera not supported in this browser/environment.';
            vm.checkingCamera = false;
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
            });
    };

    // Register
    vm.register = function() {
        if (!vm.faceImage) {
            vm.message = 'Please capture your face or upload an image.';
            vm.isSuccess = false;
            return;
        }
        if (!vm.userData.username || !vm.userData.email) {
            vm.message = 'Please fill in all required fields.';
            vm.isSuccess = false;
            return;
        }

        vm.loading = true;
        vm.message = 'Creating your account...';

        AuthService.register(vm.userData, vm.faceImage)
            .then(function(response) {
                vm.loading = false;
                vm.isSuccess = response.success;
                vm.message = response.success
                    ? '✅ Registration successful! Redirecting to login...'
                    : response.message || '❌ Registration failed.';

                if (response.success) {
                    setTimeout(function() {
                        vm.userData = { username: '', email: '' };
                        vm.faceImage = null;
                        if (vm.capturedImage) URL.revokeObjectURL(vm.capturedImage);
                        vm.capturedImage = null;
                        $location.path('/login');
                        $scope.$apply();
                    }, 2000);
                }
            })
            .catch(function(error) {
                vm.loading = false;
                vm.message = error.message || '❌ Registration failed. Please try again.';
                vm.isSuccess = false;
            });
    };

    // Go to login
    vm.goToLogin = function() {
        vm.stopCamera();
        if (vm.capturedImage) URL.revokeObjectURL(vm.capturedImage);
        $location.path('/login');
    };

    // Init
    vm.initialize();

    // Cleanup
    $scope.$on('$destroy', function() {
        vm.stopCamera();
        if (vm.capturedImage) URL.revokeObjectURL(vm.capturedImage);
    });
}]);
