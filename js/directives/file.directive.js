// Define the directives module
angular.module('faceLogin.directives', [])

// File Model Directive
.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            const model = $parse(attrs.fileModel);
            const modelSetter = model.assign;
            const onChangeHandler = $parse(attrs.onFileSelect);

            element.bind('change', function() {
                scope.$apply(function() {
                    const file = element[0].files[0];
                    modelSetter(scope, file);
                    if (onChangeHandler) {
                        onChangeHandler(scope, { file: file });
                    }
                });
            });
        }
    };
}])

// Camera Directive
.directive('cameraView', function() {
    return {
        restrict: 'E',
        template: `
            <div class="camera-container">
                <div class="video-wrapper">
                    <video ng-attr-id="{{videoId}}" autoplay muted playsinline></video>
                    <div class="capture-overlay" ng-show="!capturedImage"></div>
                </div>
                <div class="camera-controls" ng-show="!capturedImage">
                    <button class="btn btn-capture" ng-click="capture()" ng-disabled="cameraError">
                        📸 Capture Face
                    </button>
                </div>
            </div>
        `,
        scope: {
            videoId: '@',
            capturedImage: '=',
            cameraError: '=',
            onCapture: '&'
        },
        link: function(scope, element, attrs) {
            scope.capture = function() {
                scope.onCapture();
            };
        }
    };
});