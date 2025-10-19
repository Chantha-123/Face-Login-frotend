angular.module('faceLogin.controllers')
.controller('RegisterController', ['$scope', '$location', '$timeout', 'AuthService', 'CameraService', 
function($scope, $location, $timeout, AuthService, CameraService) {
    const vm = this;

    vm.userData = { username: '', email: '' };
    vm.capturedImage = null;
    vm.faceImage = null;
    vm.showCameraDialog = false;
    vm.videoElement = null;
    vm.videoStream = null;
    vm.message = '';
    vm.isSuccess = false;
    vm.loading = false;

    // Open camera
    vm.openCameraDialog = function() {
        vm.showCameraDialog = true;

        $timeout(() => {
            const video = document.getElementById('cameraVideo');
            if (!video) return;

            vm.videoElement = video;

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    vm.videoStream = stream;
                    video.srcObject = stream;
                    video.play();
                    vm.message = "Camera opened! ✅";
                    vm.isSuccess = true;
                    $scope.$apply();
                })
                .catch(err => {
                    console.error(err);
                    vm.message = "Cannot access camera. Check permissions or HTTPS.";
                    vm.isSuccess = false;
                    vm.showCameraDialog = false;
                    $scope.$apply();
                });
        }, 100);
    };

    // Capture image
    vm.captureFromDialog = function() {
        if (!vm.videoElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = vm.videoElement.videoWidth;
        canvas.height = vm.videoElement.videoHeight;
        canvas.getContext('2d').drawImage(vm.videoElement, 0, 0);

        vm.capturedImage = canvas.toDataURL('image/png');
        vm.faceImage = vm.dataURLtoBlob(vm.capturedImage);

        // Stop camera
        vm.closeCameraDialog();
        $scope.$apply();
    };

    // Convert DataURL to Blob
    vm.dataURLtoBlob = function(dataURL) {
        const parts = dataURL.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uInt8Array[i] = raw.charCodeAt(i);
        return new Blob([uInt8Array], { type: contentType });
    };

    // Retake
    vm.retakeImage = function() {
        vm.capturedImage = null;
        vm.faceImage = null;
        vm.message = '';
        vm.openCameraDialog();
    };

    // Close camera
    vm.closeCameraDialog = function() {
        if (vm.videoStream) vm.videoStream.getTracks().forEach(track => track.stop());
        vm.showCameraDialog = false;
    };

    // File select
    vm.onFileSelect = function(file) {
        if (!file || !file.type.startsWith('image/')) {
            vm.message = "Please select a valid image file.";
            vm.isSuccess = false;
            return;
        }
        vm.faceImage = file;
        vm.capturedImage = null;
        vm.message = "Image ready for registration.";
        vm.isSuccess = true;
        vm.closeCameraDialog();
    };

    // Register
    vm.register = function() {
        if (!vm.faceImage) {
            vm.message = "Please capture your face or upload an image.";
            vm.isSuccess = false;
            return;
        }
        if (!vm.userData.username || !vm.userData.email) {
            vm.message = "Please fill all required fields.";
            vm.isSuccess = false;
            return;
        }

        vm.loading = true;
        vm.message = "Registering...";

        AuthService.register(vm.userData, vm.faceImage)
            .then(res => {
                vm.loading = false;
                vm.isSuccess = res.success;
                vm.message = res.success ? "✅ Registration successful!" : "❌ Registration failed.";
                if (res.success) $timeout(() => $location.path('/login'), 1500);
            })
            .catch(err => {
                vm.loading = false;
                vm.isSuccess = false;
                vm.message = err.message || "❌ Registration failed. Try again.";
            });
    };

    // Go to login
    vm.goToLogin = function() {
        vm.closeCameraDialog();
        $location.path('/login');
    };
}]);
