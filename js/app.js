var map;
var bounds;
// Create a new blank array for all the listing markers.
var markers = [];
var apiUrl = 'https://api.foursquare.com/v2/venues/search?v=20180323';
var foursquare_client_id = 'OK4YLHSCC2ZRASFY5DSTQQZ4MMSCPV1CXCH5NM3NFYHB4PB3';
var foursquare_client_secret = 'A4T5DZV0JNNZEN4WRYY4XVU33LTIPNPZOC0B4VKTKJTLBL5C';
const bounceTimeout = 1000;

function createGoogleMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13
    });
    bounds = new google.maps.LatLngBounds();
}

// This function animates selected marker
function toggleBounce(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, bounceTimeout);
}

/**
 * @description alert user if an error occured using Google Maps API
 */
function googleMapsApiError() {
    alert('Error while intitializing Google Maps API.');
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    if(infowindow.marker){
        infowindow.open(map, marker);
    }else{
        // Check to make sure the infowindow is not already opened on this marker.
        var limit = 1;
        var lat = marker.position.lat();
        var lng = marker.position.lng();
        var url = apiUrl + '&ll=' + lat + ',' + lng +
            '&limit=' + limit +
            '&client_id=' +
            foursquare_client_id +
            '&client_secret=' + foursquare_client_secret;
            $.getJSON(url, function(result){
                if (result.meta.code === 200) {
                    var locationDetails = result.response.venues[0];
                    const category = locationDetails.categories[0].name;
                    const checkins = locationDetails.stats.checkinsCount;
                    const street = locationDetails.location.address;
                    const city = locationDetails.location.city;
                    const state = locationDetails.location.state;
                    const postalCode = locationDetails.location.postalCode;
                    var container = '<div>' + '<div>' + marker.title + '</div>' +
                        '<div>Address: ' + street + ' ' + city + ', ' + state + ' ' + postalCode + '</div>' +
                        '<div>Category: ' + category + '</div>' +
                        '<div>Check-Ins: ' + checkins + '</div>' + '</div>';
                    infowindow.marker = marker;
                    infowindow.setContent(container);
                    infowindow.open(map, marker);
                    // Make sure the marker property is cleared if the infowindow is closed.
                    infowindow.addListener('closeclick', function() {
                        infowindow.setMarker = null;
                    });
                    marker.hasSucceeded = true;
                } else {
                    alert('Unable to retrieve location data: HTTP ' + result.meta.code);
                }
            }).fail(function(xhr) {
                alert('exception while calling api for ' + marker.title + ': ', xhr);
            });
    }
}

/** Applying Knockout JS logic */
class Pin {
    constructor(place) {
        this.title = place.title;
        this.lat = place.lat;
        this.lng = place.lng;
        this.pin = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: {lat: this.lat, lng: this.lng},
            title: this.title,
            hasSucceeded: false,
            infoWindow: new google.maps.InfoWindow()
        });
        this.pin.addListener('click', function() {
            toggleBounce(this);
            populateInfoWindow(this, this.infoWindow);
        });
        bounds.extend(this.pin.position);
    }  
}

//init the view model
var ViewModel = function() {
    var self = this;
    // initialize Google Maps
    createGoogleMap();

    // input box to filter place list
    self.searchInput = ko.observableArray('');

    // create list of places that data binds to UI
    self.listOfPlaces = ko.observableArray([]);
    self.backupPlaces = [];
    // populate the list so that users can filter
    places.forEach(function(place) {
        self.listOfPlaces.push(new Pin(place));
    });
    self.backupPlaces = self.listOfPlaces;
    
    //click event for selecting a location in list
    self.clickPlace = function(place) {
        google.maps.event.trigger(place.pin, 'click');
    }

    // fit the map around the pins
    map.fitBounds(bounds);
    
    // apply live search filtering to input box and place list
    self.listOfPlaces = ko.dependentObservable(function() {
        if (self.searchInput().length > 0) {
            //filter by given search filter
            var filter = self.searchInput().toLowerCase();
            self.listOfPlaces = self.backupPlaces;
            return self.listOfPlaces().filter((l) => {
                if (l.title.toLowerCase().indexOf(filter) > -1) {
                    l.pin.setVisible(true);
                    return true;
                } else {
                    l.pin.setVisible(false);
                    return false;
                }                
            })
        } else {
            //no search filter, display all and set markers to visible
            self.listOfPlaces().forEach(function(place) {
                place.pin.setVisible(true);
            });
            return self.listOfPlaces();
        }
    }, self);
}

function init(){
    ko.applyBindings(new ViewModel());
};