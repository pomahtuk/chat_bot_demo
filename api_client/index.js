/* jslint browser: true */
/* global B */

(function (B) {
    'use strict';
    
    if (B.env.b_action !== 'explorer') {
        return;
    }
   
    //  Full API documentation:
    //  https://api-docs.izi.travel/    


    // before start - delete all '.dev' occurencies, used for testing
    // 'Access-Control-Allow-Origin' error on regular links still present
    B.explorer.define('audioguides-explorer', ['jQuery'], function ($) {
        
        var guides,
            mapInstance,
            max_errors = 5,
            fetching = false,
            timeout = 15,
            errors = 0,
            // reasonable amount for full object format
            // otherwise response size from server will be really big
            limit = 5,
            radius = 5000, // in meters
            // get one real before experimentation
            apiKey = '05010cf4-3151-475d-a7ae-5d8ba057424f',
            mediaBase = 'https://media.dev.izi.travel',
            apiUrl = 'https://api.dev.izi.travel/mtg/objects/search',
            // determine response type
            useCompactForm = true;
    
        /* Building image url:

        {MEDIA_BASE_URL}/{CONTENT_PROVIDER_UUID}/{IMAGE_UUID}_{IMAGE_SIZE}.jpg

        Image size in "WIDTHxHEIGHT" format. E.g., "800x600".

        Available image sizes are:

        high quality:
        800 х 600
        240 х 180

        low quality:
        480 х 360
        120 х 90

        Media files access URL: http://media.dev.izi.travel/
        */
        function buildImageUrl (guide) {
            var image = guide.content.images[0],
                result;
            
            result = mediaBase + '/' + guide.content_provider.uuid + '/' + image.uuid + '_240x180.jpg';
            
            return result;
        }
        
        function buildPathArray (route) {
            var i = 0,
                pair,
                pairArr = [],
                result = [];

            if (route) {
                pairArr = route.split(';');

                while (i < pairArr.length - 1) {
                    pair = pairArr[i];
                    result.push(pair.split(','));
                    i += 1;
                }
            }

            return result;
        }

        function rad (x) {
          return x * Math.PI / 180;
        }

        function getDistance (p1, p2) {
          var R = 6378137, // Earth’s mean radius in meter
            dLat = rad(p2.lat - p1.lat),
            dLong = rad(p2.lng - p1.lng),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            distance = R * c;
          return distance; // returns the distance in meter
        }

        function transformResponse (guides) {
            var resultObject, guide,
                location, route, distance,
                distanceKM, distanceMI, walkingTime,
                distanceText, hotelDistanceTemplateText,
                i = guides.length - 1,
                currentHotel = mapInstance.data.hotel,
                // constants
                mileConstant = 1.609344,
                // could be adjusted, used for time calculation
                minutesPerKilometer = 12.5,
                result = [];

            while (i >= 0) {
                
                guide = guides[i];

                // checking if response came in full form or compact form
                if (guide.content) {
                    // normalize, we need only first element in array
                    guide.content = guide.content[0];

                    route = guide.map.route;

                    // make sure child has a location
                    if (guide.content.children && guide.content.children[0] && guide.content.children[0].location) {
                        location = guide.content.children[0].location;
                    } else {
                        location = guide.location;
                    }
                } else {
                    location = guide.location;
                    route = guide.route;
                    guide.content = {
                        title: guide.title,
                        images: guide.images
                    };
                }

                distance = getDistance({
                    lat: Number(location.latitude),
                    lng: Number(location.longitude)
                }, {
                    lat: Number(currentHotel.b_latitude),
                    lng: Number(currentHotel.b_longitude)
                });

                // converting meters in distance to KM with 1 didit percission
                distanceKM = Math.ceil(distance / 100) / 10;
                // same for miles, using mile constant
                distanceMI = Math.ceil((distance / mileConstant) / 100) / 10;
                // calculating walking time
                walkingTime = Math.ceil(distanceKM * minutesPerKilometer);
                // prepare this for tempalte using clienside translations
                // as ajax came late, rather calculate propper text here
                distanceText = B.explorer.useMiles ? distanceMI + ' mi' : distanceKM + ' km',
                hotelDistanceTemplateText = B.jstmpl.translations('explorer_landmark_distance_away_from_hotel', '', { localised_distance: distanceText });

                // remove!!!!
                // window.map = mapInstance;
                
                resultObject = {
                    b_icon_type: 'audioguide',
                    b_id: guide.uuid,
                    b_latitude: location.latitude,
                    b_longitude: location.longitude,
                    b_name: guide.content.title,
                    b_type: 'audioguide',
                    b_hotel_distance_template_text: hotelDistanceTemplateText,
                    // translation neded!
                    b_subtitle: 'Free audioguide',
                    b_url: 'http://izi.travel/browse/' + guide.uuid + '?lang=' + B.env.b_lang + '&locale=' + B.env.b_lang,
                    b_url_pretty: 'izi.travel',
                    b_duration: Math.ceil(guide.duration / 60),
                    b_route: buildPathArray(route),
                    photoSize: {
                        width: 176,
                        height: 132
                    },
                    photo: buildImageUrl(guide)
                };

                if (guide.distance > 0) {
                    resultObject.b_distance = (guide.distance / 1000).toFixed(1);
                }
                mapInstance.data.guides[guide.uuid] = resultObject;
                result.push(resultObject);
                i -= 1;
            }
            
            return result;
        }
        
        function finalizeMarkers () {
            mapInstance.sendMarkersToMap(guides);
        }
        
        function getMarkers () {

            if (fetching) {
                return;
            }

            fetching = true;

            var center = mapInstance.map.getCenter();

            $.ajax({
                url: apiUrl,
                mathod: 'GET',
                timeout: timeout * 1000,
                xhr: function () {
                    // Get new xhr object using default factory
                    var xhr = jQuery.ajaxSettings.xhr();
                    // Copy the browser's native setRequestHeader method
                    var setRequestHeader = xhr.setRequestHeader;
                    // Replace with a wrapper
                    xhr.setRequestHeader = function (name, value) {
                        // wiping out all booking-specific headers
                        if (name == 'X-Booking-Language-Code') return;
                        if (name == 'X-Booking-CSRF') return;
                        if (name == 'X-Booking-AID') return;
                        if (name == 'X-Booking-Info') return;
                        if (name == 'X-Partner-Channel-Id') return;
                        if (name == 'X-Booking-Pageview-Id') return;
                        if (name == 'X-Booking-SiteType-Id') return;
                        if (name == 'X-Booking-Session-Id') return;
                        // this is required for DEV kvms with plack debugger enabled to work
                        if (name == 'X-Plack-Debugger-Parent-Request-UID') return;
                        // Otherwise call the native setRequestHeader method
                        // Note: setRequestHeader requires its 'this' to be the xhr object,
                        // which is what 'this' is here when executed.
                        setRequestHeader.call(this, name, value);
                    };
                    // pass it on to jQuery
                    return xhr;
                },
                data: {
                    languages: [B.env.b_lang],
                    type: 'tour',
                    cost: 'free',
                    limit: limit,
                    radius: radius,
                    api_key: apiKey,
                    // form could be compact, this will reduce a response size
                    // but will produce inaccurate positioning of audioguide markers
                    // and no sure way to calculate distance from hotel to closes point
                    // also when switching pay attention on response format! They are not equal!
                    // form: 'full',
                    form: useCompactForm ? 'compact' : 'full',
                    lat_lon: center.join(','),
                    // stripping all extra data
                    except: ['publisher', 'map', 'hash', 'placement', 'children_count']
                },
                success: function (retrievedData, xhr) {
                    fetching = false;
                    if (xhr === 'success') {
                        // track that the user has recovered from an error
                        if (getMarkers.hadError) {
                            B.explorer.track('AJAX audioguides status', 'User has recovered');
                            getMarkers.hadError = false;
                        }
                        guides = transformResponse(retrievedData);
                        finalizeMarkers();
                    } else {
                        B.explorer.track('Error', 'AJAX audioguides loading error: invalid data! (data length: ' +
                            (retrievedData && (retrievedData.length || 0)) + ')');
                    }
                },
                error: function (xhr, error, text) {
                    fetching = false;

                    // (temporary): track if it's the first error in a category designed for this
                    if (!getMarkers.hadError) {
                        B.explorer.track('AJAX audioguides status', 'User had at least an error');
                        getMarkers.hadError = true;
                    }

                    if (xhr.status === 0) {
                        text = 'disconnected';
                    } else {
                        text = xhr.status + ' ' + (text || '');
                    }

                    B.explorer.track('Error', 'AJAX audioguides loading error: ' + error + ' (' + text + ')');
                    
                    errors += 1;
                    
                    // Try re-fetching
                    if (errors >= max_errors) {
                        B.explorer.track('Error', 'AJAX audioguides loading error: max_errors reached (' + max_errors + ')');
                    } else {
                        getMarkers();
                    }
                }
            });
        }
      
        function init (mapModule) {
            mapInstance = mapModule;
            mapInstance.data.guides = {};
            getMarkers();
        }
      
        return {
            init: init
        };
      
    });
}(B));