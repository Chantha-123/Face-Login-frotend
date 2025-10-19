// Define the services module
angular.module('faceLogin.services', [])

// Auth Service
.factory('AuthService', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
    const API_BASE = 'http://localhost:8081/api/auth';
    let currentUser = null;

    const service = {
        isLoggedIn: function() {
            return currentUser !== null;
        },

        getCurrentUser: function() {
            return currentUser;
        },

        register: function(userData, faceImage) {
            const deferred = $q.defer();
            const formData = new FormData();
            
            formData.append('username', userData.username);
            formData.append('email', userData.email);
            formData.append('faceImage', faceImage);

            $http.post(API_BASE + '/register', formData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .then(function(response) {
                deferred.resolve(response.data);
            })
            .catch(function(error) {
                deferred.reject(error.data || {message: 'Registration failed'});
            });

            return deferred.promise;
        },

        login: function(faceImage) {
            const deferred = $q.defer();
            const formData = new FormData();
            
            formData.append('faceImage', faceImage);

            $http.post(API_BASE + '/login', formData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .then(function(response) {
                if (response.data.success) {
                    currentUser = response.data.user;
                    $rootScope.$broadcast('userLoggedIn', currentUser);
                }
                deferred.resolve(response.data);
            })
            .catch(function(error) {
                deferred.reject(error.data || {message: 'Login failed'});
            });

            return deferred.promise;
        },

        logout: function() {
            currentUser = null;
            $rootScope.$broadcast('userLoggedOut');
            return $q.resolve();
        },

        testConnection: function() {
            return $http.get(API_BASE + '/test');
        }
    };

    return service;
}])

// Camera Service
.factory('CameraService', ['$q', '$rootScope', function($q, $rootScope) {
    let currentStream = null;
    let cameraAvailable = null;

    const service = {
        isCameraAvailable: function() {
            if (cameraAvailable !== null) {
                return cameraAvailable;
            }
            
            const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            
            if (!hasMediaDevices) {
                cameraAvailable = false;
                return false;
            }
            
            const isSecureContext = window.isSecureContext;
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';
            
            cameraAvailable = isSecureContext || isLocalhost;
            return cameraAvailable;
        },

        checkCameraAvailability: function() {
            const deferred = $q.defer();
            
            if (!service.isCameraAvailable()) {
                deferred.resolve(false);
                return deferred.promise;
            }

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    stream.getTracks().forEach(track => track.stop());
                    deferred.resolve(true);
                })
                .catch(function(error) {
                    console.warn('Camera test failed:', error);
                    cameraAvailable = false;
                    deferred.resolve(false);
                });

            return deferred.promise;
        },

        initializeCamera: function(videoElement) {
            const deferred = $q.defer();

            if (!service.isCameraAvailable()) {
                deferred.reject(new Error('Camera not available in this environment'));
                return deferred.promise;
            }

            const constraints = { 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(stream) {
                    currentStream = stream;
                    if (videoElement) {
                        videoElement.srcObject = stream;
                        videoElement.onloadedmetadata = function() {
                            deferred.resolve(stream);
                        };
                        videoElement.onerror = function() {
                            deferred.reject(new Error('Video element failed to load'));
                        };
                    } else {
                        deferred.resolve(stream);
                    }
                })
                .catch(function(error) {
                    let errorMessage = 'Camera access denied';
                    
                    if (error.name === 'NotAllowedError') {
                        errorMessage = 'Camera permission denied. Please allow camera access.';
                    } else if (error.name === 'NotFoundError') {
                        errorMessage = 'No camera found on this device.';
                    } else if (error.name === 'NotSupportedError') {
                        errorMessage = 'Camera not supported in this browser.';
                    } else if (error.name === 'NotReadableError') {
                        errorMessage = 'Camera is already in use by another application.';
                    }
                    
                    deferred.reject(new Error(errorMessage));
                });

            return deferred.promise;
        },

        stopCamera: function() {
            if (currentStream) {
                currentStream.getTracks().forEach(track => {
                    track.stop();
                });
                currentStream = null;
            }
        },

        captureImage: function(videoElement) {
            const deferred = $q.defer();

            if (!videoElement || !videoElement.srcObject) {
                deferred.reject(new Error('Video stream not available'));
                return deferred.promise;
            }

            if (videoElement.readyState !== 4) {
                deferred.reject(new Error('Video not ready for capture'));
                return deferred.promise;
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            
            try {
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        deferred.reject(new Error('Failed to create image blob'));
                        return;
                    }
                    
                    const fileName = 'face_capture_' + Date.now() + '.jpg';
                    const file = new File([blob], fileName, { type: 'image/jpeg' });
                    const imageUrl = URL.createObjectURL(blob);
                    
                    deferred.resolve({
                        file: file,
                        imageUrl: imageUrl
                    });
                }, 'image/jpeg', 0.8);
            } catch (error) {
                deferred.reject(new Error('Failed to capture image: ' + error.message));
            }

            return deferred.promise;
        },

        getCameraStatus: function() {
            return {
                available: service.isCameraAvailable(),
                active: currentStream !== null
            };
        }
    };

    return service;
}]);