let map;
let bounds;

/**
 * @description initialize the view model and start the app
 */
function init() {
    ko.applyBindings(new ViewModel());
};

/**
 * @description Knockout view model
 */
const ViewModel = function() {
    let self = this;
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
    // trigger info window event listener when clicking on a place in list
    self.clickPlace = function(place) {
            google.maps.event.trigger(place.pin, 'click');
        }
        // fit the map around the pins
    map.fitBounds(bounds);
    // apply live search filtering to input box and place list
    self.listOfPlaces = ko.dependentObservable(function() {
        if (self.searchInput().length > 0) {
            const filter = self.searchInput().toLowerCase();
            // refill the list so that it can filter all places
            self.listOfPlaces = self.backupPlaces;
            return self.listOfPlaces().filter((place) => {
                if (place.title.toLowerCase().indexOf(filter) > -1) {
                    // show places that match search criteria
                    place.pin.setVisible(true);
                    return true;
                } else {
                    // hide places that do not match search criteria
                    place.pin.setVisible(false);
                    return false;
                }
            })
        } else {
            // set all pins to be visible and refill the list
            self.listOfPlaces().forEach(function(place) {
                place.pin.setVisible(true);
            });
            return self.listOfPlaces();
        }
    }, self);
}

/**
 * @description generate Google map view
 */
function createGoogleMap() {
    // render Google Map and center the view
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13
    });
    bounds = new google.maps.LatLngBounds();
}

/**
 * @description alert user if an error occured using Google Maps API
 */
function googleMapsApiError() {
    alert('Error while intitializing Google Maps API.');
}

/**
 * animate bounce animation for a pin
 * @param {Pin} pin object containing place data a marker on Google Maps
 */
function animateBounce(pin) {
    const bounceTimeout = 1000;
    pin.setAnimation(google.maps.Animation.BOUNCE);
    // stop bouncing after 1s
    setTimeout(function() {
        pin.setAnimation();
    }, bounceTimeout);
}

/**
 * @description Fetch data from foursquare about a place and populate the info window
 * @param {Pin} pin object containing place data a marker on Google Maps
 * @param {InfoWindow} infoWindow object to display info window about a place when clicked
 */
function populateInfoWindow(pin, infoWindow) {
    if (infoWindow.pin) {
        // info window already select and populated. Show it again
        infoWindow.open(map, pin);
    } else {
        // info window has not been selected before. Fetch place data from Foursquare API
        const apiUrl = 'https://api.foursquare.com/v2/venues/search?v=20180323&radious=10';
        const foursquare_client_id = 'OK4YLHSCC2ZRASFY5DSTQQZ4MMSCPV1CXCH5NM3NFYHB4PB3';
        const foursquare_client_secret = 'A4T5DZV0JNNZEN4WRYY4XVU33LTIPNPZOC0B4VKTKJTLBL5C';
        const limit = 1;
        const lat = pin.position.lat();
        const lng = pin.position.lng();
        const url = apiUrl + '&ll=' +
            lat + ',' + lng +
            '&limit=' + limit +
            '&client_id=' +
            foursquare_client_id +
            '&client_secret=' + foursquare_client_secret;
        $.getJSON(url, function(result) {
            if (result.meta.code === 200) {
                const locationDetails = result.response.venues[0];
                const category = locationDetails.categories[0].name;
                const street = locationDetails.location.address;
                const city = locationDetails.location.city;
                const state = locationDetails.location.state;
                const postalCode = locationDetails.location.postalCode;
                const address = street + ' ' + city + ', ' + state + ' ' + postalCode;
                const container = '<section>' +
                    '<p class="font-weight-bold" >' + pin.title + '</p>' +
                    '<p>Address: ' + address + '</p>' +
                    '<p>Category: ' + category + '</p>' +
                    '</section>';
                infoWindow.pin = pin;
                infoWindow.setContent(container);
                infoWindow.open(map, pin);
            } else {
                alert('Unable to retrieve data about the place: ' + result.meta.code);
            }
        }).fail(function(e) {
            alert('Exception while calling API');
        });
    }
}

/**
 * @description Class that stores map details of a place
 */
class Pin {
    constructor(place) {
        this.title = place.title;
        this.lat = place.lat;
        this.lng = place.lng;
        this.pin = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: {
                lat: this.lat,
                lng: this.lng
            },
            title: this.title,
            infoWindow: new google.maps.InfoWindow()
        });
        // event listener for opening info window
        this.pin.addListener('click', function() {
            animateBounce(this);
            populateInfoWindow(this, this.infoWindow);
        });
        bounds.extend(this.pin.position);
    }
}