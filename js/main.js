var MyApp = (function(){        // Avoid polluting global scope
    "use strict";

    var map, bounds, infoWindow,
        markersOnMap = [],
        markersArray = [
        {
            markerTitle : 'Google',
            markerPos   : { lat: 37.4038824, lng: -122.0905992 }, 
            logoUrl: 'http://b.fastcompany.net/multisite_files/fastcompany/imagecache/inline-small/inline/2015/09/3050613-inline-i-2-googles-new-logo-copy.png'
        },
        {
            markerTitle : "Facebook",
            markerPos   : { lat: 37.3860156, lng: -122.156958 },
            logoUrl: 'https://www.facebook.com/images/fb_icon_325x325.png' 
        },
        {
            markerTitle : "Khan Academy",
            markerPos   : { lat: 37.4213253, lng: -122.090883 },
            logoUrl: 'https://fastly.kastatic.org/images/khan-logo-vertical-transparent.png' 
        },
        {
            markerTitle : "Udacity",
            markerPos   : { lat: 37.3992606, lng: -122.1082809 },
            logoUrl: 'http://1onjea25cyhx3uvxgs4vu325.wpengine.netdna-cdn.com/wp-content/uploads/2016/02/U_360x360px.jpg' 
        },
        {
            markerTitle : "Twitter",
            markerPos   : { lat: 37.3818959, lng: -122.0341802 },
            logoUrl: 'http://www.adweek.com/socialtimes/files/2014/07/alltwitter-twitter-bird-logo-white-on-blue.png' 
        } 
    ];

    function centerAndAnimateMarker(position, selectedMarker) {
        /*
            Animate the marker associated with object
        */
        map.panTo(position);
        markersOnMap.forEach(function(marker){
            if (marker === selectedMarker) {
                selectedMarker.setAnimation(null);
                // start animation with and timeout to stop
                selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
                var numBounces = 2;
                setTimeout(function(){ selectedMarker.setAnimation(null); }, 700*numBounces);
            } else {
                // turn off animation for other markers
                marker.setAnimation(null);
            }
        });
    }

    function wikiAPIRequest(query) {
        /* Fetches small description of the organization
              --> returns a string with html tags such as <b>
        */
        var wikiAPIUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=' + query;
        return $.ajax({
            url: wikiAPIUrl,
            dataType: 'jsonp'
        });
    }

    function initMap() {
        var mapDiv = document.getElementById('map');
        bounds = new google.maps.LatLngBounds();
        map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(37.402993, -122.181),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: 8
        });

        // initialize the infoWindow
        infoWindow = new google.maps.InfoWindow();

        // Add markers to the map
        markersArray.forEach(function(marker){
            var newMarker = new google.maps.Marker({
                map:        map,
                position:   marker.markerPos,
                title:      marker.markerTitle
            });
            newMarker.addListener('click', function() {
                var position = new google.maps.LatLng(newMarker.position.lat(), newMarker.position.lng());
                centerAndAnimateMarker(position, newMarker);

                var query = newMarker.title;
                // calling the wiki API, parses one paragraph and updates the view
                infoWindow.open(map, newMarker);
                infoWindow.setContent('<div class="preloader-wrapper active"> ' +
                                      '<div class="spinner-layer spinner-red-only">' + 
                                      '<div class="circle-clipper left">' + 
                                      '<div class="circle"></div></div><div class="gap-patch">' +
                                      '<div class="circle"></div></div><div class="circle-clipper right">' + 
                                      '<div class="circle"></div></div></div></div>');
                wikiAPIRequest(query).done(function(data){
                    var responseArticleText = data.query.pages[Object.keys(data.query.pages)[0]].extract;
                    var responseArticle = responseArticleText.split('</p>')[0];
                    infoWindow.setContent(responseArticle);
                }).fail(function() {
                    alert('Error with wiki API');
                });
            });
            markersOnMap.push(newMarker);
        
            // extend the map
            var newBound = new google.maps.LatLng(marker.markerPos.lat, marker.markerPos.lng);
            bounds.extend(newBound);
        });

        // fit map to all bounds
        map.fitBounds(bounds);
    }

        // Knockout.js bindings to act as Controller
    var AppViewModel = function(){
        this.windowContent = ko.observable('');
        this.query = ko.observable('');
        this.markers = ko.computed(function() {
            var searchVal = this.query().toLowerCase();
            return ko.utils.arrayFilter(markersArray, function(marker){
                return marker.markerTitle.toLowerCase().indexOf(searchVal) >= 0;
            });
        }, this, {deferEvaluation: true});

        // filter markers when search query is entered
        this.updateMarkers = function() {
            for (var i = 0; i < markersOnMap.length; i++) {
                var foundInResults = false;
                for (var j = 0; j < this.markers().length; j++) {
                    if ( markersOnMap[i].title.indexOf(this.markers()[j].markerTitle) >= 0 ) {
                        foundInResults = true;
                    }
                }
                if (foundInResults) {
                    markersOnMap[i].setVisible(true);
                } else {
                    markersOnMap[i].setVisible(false);
                }
            }
        };

        this.renderDetailed = function(selectedMarker) {
            var query = selectedMarker.markerTitle;
            var position = new google.maps.LatLng(selectedMarker.markerPos.lat, selectedMarker.markerPos.lng);
            markersOnMap.forEach(function(marker){
                if (marker.title === query) {
                    centerAndAnimateMarker(position, marker);
                    google.maps.event.trigger(marker, 'click');
                } 
            });
        };
    };

    var mainApp = new AppViewModel();
    ko.applyBindings(mainApp);

    // responsive zooming onresize
    window.onresize = function() {
        map.fitBounds(bounds);
    };

    function handleMapError() {
        alert('Error has occurred with the Google Maps API');
    }

    return {
        initMap: initMap,
        handleMapError: handleMapError
    };
})();