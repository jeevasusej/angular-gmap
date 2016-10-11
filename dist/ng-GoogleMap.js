angular.module("ng-GoogleMap", [])
    .factory('ng-GoogleMapServices', ['$injector', function ($injector) {
        var appServices = {};
        appServices.getObject = function (lists, propertyKey, propertyValue) {
            var _property = {}; _property[propertyKey] = propertyValue;
            var _obj = cFilter('filter')(lists, _property, true);

            if (_obj && _obj[0] && angular.isObject(_obj[0]) && !angular.isArray(_obj[0]))
                return _obj[0];

            return null;
        }
        return appServices;
    }])
    .directive("ngGoogleMap", ['ng-GoogleMapServices'
        , '$injector'
        , '$timeout'
    , function (appServices
        , $injector
        , $timeout) {
        return {
            restrict: "A",
            scope: {
                googleMapModel: '=googleMapModel'
            },
            link: function ($scope, $element, $attributes) {
                debugger
                var googleMapModel = null,
                    mapElement = null,
                    inputBox = null,
                        _drawingManager = null,
                            previousMarker = null,
                            coloredPolygon = null,
                            _$timeout = null,
                                $ngGoogleMap = null,
                                inputBox = null, searchBox = null;

                if (!$element || ($element && !$element[0])) {
                    console.error('No valid elements found');
                    return;
                }
                else
                    mapElement = $element[0];

                function mapInit() {
                    try {
                        $ngGoogleMap = new google.maps.Map(mapElement, {
                            zoom: 12,
                            center: { lat: 62.3713, lng: 15.4825 },
                            mapTypeId: google.maps.MapTypeId.HYBRID
                        });

                        if (googleMapModel.enableInput) inputSearchInit();
                    }
                    catch (error) {
                        alert(error);
                        return;
                    }
                }

                function createMap() {
                    if (googleMapModel && googleMapModel.mapData && googleMapModel.mapData.length > 0) {
                        clearMap();
                        closeInfoWindow();

                        var bounds = new google.maps.LatLngBounds();
                        var _item = null, j = 0, _coOrdinates = [], _polygonGuid;
                        for (var i = 0; i < googleMapModel.mapData.length; i++) {
                            _item = googleMapModel.mapData[i];
                            if (_item && _item.values && _item.values.length > 0) {
                                _coOrdinates = [];
                                for (j = 0; j < _item.values.length; j++) {
                                    _coOrdinates.push(new google.maps.LatLng(
                                      _item.values[j][0] * 1,
                                      _item.values[j][1] * 1
                                ));
                                }
                                if (_coOrdinates.length > 0)
                                    bounds.extend(_coOrdinates[_coOrdinates.length - 1]);
                            }
                            createPolygon(_coOrdinates, _item)
                        }
                    }
                }

                function createPolygon(coordinates, userData) {
                    var _polygonGuid = guid();
                    if (!userData)
                        userData = {};
                    userData.guid = _polygonGuid;

                    googleMapModel.polygons.push(new google.maps.Polygon({
                        id: _polygonGuid,
                        paths: coordinates,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.35,
                        userData: userData
                    }));

                    googleMapModel.polygons[googleMapModel.polygons.length - 1].setMap($ngGoogleMap);
                    //addImageInPolygon(arr, map, polygons[polygons.length - 1], _fields[i]);
                    //polygons[polygons.length - 1].addListener('click', showArrays);

                    return _polygonGuid;
                }

                function updateExistingPolygon(data) {

                }

                function updatePolygonColor(data) {

                }

                function removePolygon(data) {

                }

                function triggerMapResize(data) {

                }

                function initPolygonGetBounds() {
                    try {
                        google.maps.Polygon.prototype.my_getBounds = function () {
                            var bounds = new google.maps.LatLngBounds()
                            this.getPath().forEach(function (element, index) { bounds.extend(element) })
                            return bounds
                        }
                    }
                    catch (error) {
                        alert(error);
                        return;
                    }

                }

                function guid() {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000)
                          .toString(16)
                          .substring(1);
                    }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                      s4() + '-' + s4() + s4() + s4();
                }

                function inputSearchInit() {
                    inputBox = document.createElement("input");
                    inputBox.type = "text";
                    inputBox.placeholder = "";
                    inputBox.className = "ng-google-map-input-control"; // set the CSS class

                    searchBox = new google.maps.places.SearchBox(inputBox);
                    $ngGoogleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(inputBox);
                    bindInputSearchEvent();
                }

                function bindInputSearchEvent() {
                    // Bias the SearchBox results towards current map's viewport.
                    $ngGoogleMap.addListener('bounds_changed', function () {
                        searchBox.setBounds($ngGoogleMap.getBounds());
                    });

                    var searchBoxMarkers = [];
                    // Listen for the event fired when the user selects a prediction and retrieve
                    // more details for that place.
                    angular.element(inputBox).bind('keyup', function (e) {
                        if (e.keyCode == 13) {
                            google.maps.event.trigger(inputBox, 'focus')
                            google.maps.event.trigger(inputBox, 'keydown', {
                                keyCode: 13
                            });
                        }
                    });
                    //angular.element(inputBox).keyup();
                    searchBox.addListener('places_changed', function () {
                        var places = searchBox.getPlaces();
                        if (places.length == 0) {
                            return;
                        }
                        // Clear out the old markers.
                        searchBoxMarkers.forEach(function (m) {
                            m.setMap(null);
                        });
                        searchBoxMarkers = [];

                        // For each place, get the icon, name and location.
                        var inputSearchbounds = new google.maps.LatLngBounds();
                        places.forEach(function (place) {
                            if (!place.geometry) {
                                console.error("Returned place contains no geometry");
                                return;
                            }

                            if (place.geometry.viewport) {
                                inputSearchbounds.union(place.geometry.viewport);
                            } else {
                                inputSearchbounds.extend(place.geometry.location);
                            }
                        });
                        $ngGoogleMap.fitBounds(inputSearchbounds);
                    });
                }

                /*
                 * close info window
                 */
                function closeInfoWindow() {

                    if (!googleMapModel.infoWindow)
                        return false;

                    googleMapModel.infoWindow.close();
                    googleMapModel.infoWindow = new google.maps.InfoWindow;
                }

                /*
                 * clear existing map
                 */
                function clearMap() {
                    // clearMarker();
                    if (googleMapModel.polygons)
                        if (googleMapModel.polygons && googleMapModel.polygons.length > 0) {
                            for (var i = 0; i < googleMapModel.polygons.length; i++) {
                                googleMapModel.polygons[i].setMap(null);
                            }
                            googleMapModel.polygons = [];
                        }
                }
                /*
                 * drawPolygon for some data.
                 * This can be identified as we have drawn for the specific values.
                 */
                function drawPolygon(data) {
                    if (_drawingManager)
                        _drawingManager.setMap(null);

                    _drawingManager = new google.maps.drawing.DrawingManager({
                        //drawingMode: google.maps.drawing.OverlayType.POLYGON,
                        drawingControl: true,
                        polylineOptions: {
                            editable: false
                        },
                        drawingControlOptions: {
                            position: google.maps.ControlPosition.TOP_CENTER,
                            drawingModes: [
                              google.maps.drawing.OverlayType.POLYGON,
                            ]
                        },
                        userData: data
                    });

                    _drawingManager.setMap($ngGoogleMap);

                    google.maps.event.addListener(_drawingManager, 'overlaycomplete', function (event) {
                        debugger
                        var $this = this, $event = event, val = [], polygonsArray = [], coordinates = [];
                        var area = google.maps.geometry.spherical.computeArea($event.overlay.getPath());
                        for (var i = 0; i < $event.overlay.getPath().length; i++) {
                            val = $event.overlay.getPath().getAt(i).toUrlValue(5).split(',');
                            if (!isNaN(val[0] * 1) && !isNaN(val[1] * 1)) {
                                polygonsArray.push(new google.maps.LatLng(val[0] * 1, val[1] * 1));
                            }
                            coordinates.push(val);
                        }
                        _drawingManager.setMap(null);
                        clearDrawingManagerSelection($event);
                        var _polygonGuid = createPolygon(polygonsArray, $this.userData);
                        var _polygonData = {
                            area: area,
                            polygonsArray: polygonsArray,
                            guid: _polygonGuid
                        }
                        returnPolygonCoordinates(_polygonData, $this.userData);
                    });
                }

                function returnPolygonCoordinates(polygonData, userData) {
                    var result = {};
                    result.polygonData = polygonData, result.userData = userData;
                    googleMapModel.callBack.polygonDrawnCallback(result);
                }
                function clearDrawingManagerSelection(selectedShape) {
                    if (selectedShape) {
                        selectedShape.overlay.setMap(null);
                    }
                }
                function loadModelDefaultValues() {
                    googleMapModel = {
                        mapData: [],
                        enableInput: true,
                        defaultAddress: 'Sweden',
                        userDefaultAddress: null,
                        infoWindow:null,
                        polygons: [],
                        callBack: {
                            /*
                             * Will be triggerred after polygon draw
                             */
                            polygonDrawnCallback: null
                        },
                        mapFunctions: {
                            /*
                            * Data will consits
                            * id, coordinates and area
                            */
                            updateExistingPolygon: updateExistingPolygon,
                            /*
                             * Data will consists
                             * Id and color
                             */
                            updatePolygonColor: updatePolygonColor,
                            /*
                             * Data will consists
                             * Id
                             */
                            removePolygon: removePolygon,
                            triggerMapResize: triggerMapResize,
                            /*
                             * 
                             */
                            drawPolygon: drawPolygon
                        }
                    };
                    debugger
                    /*
                     * Load users' data
                     */
                    if ($scope.googleMapModel) {
                        googleMapModel.mapData = $scope.googleMapModel.mapData ? angular.extend($scope.googleMapModel.mapData) : $scope.googleMapModel.mapData
                        , googleMapModel.enableInput =
                            (angular.isDefined($scope.googleMapModel.enableInput) && $scope.googleMapModel.enableInput === undefined) ? googleMapModel.enableInput : $scope.googleMapModel.enableInput
                        , googleMapModel.callBack.polygonDrawnCallback = ($scope.googleMapModel.callBack && $scope.googleMapModel.callBack.polygonDrawnCallback) ? $scope.googleMapModel.callBack.polygonDrawnCallback : null
                        , googleMapModel.userDefaultAddress =
                            (!angular.isDefined($scope.googleMapModel.userDefaultAddress) || $scope.googleMapModel.userDefaultAddress != undefined) ? $scope.googleMapModel.userDefaultAddress : googleMapModel.userDefaultAddress;
                    }

                    /*
                     * Extend directive functions
                     */
                    if (!$scope.googleMapModel)
                        $scope.googleMapModel = {};
                    $scope.googleMapModel.mapData = googleMapModel.mapData;
                    $scope.googleMapModel.enableInput = googleMapModel.enableInput;
                    $scope.googleMapModel.callBack = googleMapModel.callBack;
                    $scope.googleMapModel.mapFunctions = googleMapModel.mapFunctions;
                    $scope.googleMapModel.userDefaultAddress = googleMapModel.userDefaultAddress;
                }
                /*
                 * Initial calls
                 */
                loadModelDefaultValues();
                mapInit();
                initPolygonGetBounds();
                createMap();
            }
        }
    }]);