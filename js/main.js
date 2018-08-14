let map;
let markers = [];
const apiUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&radius=0.003048';
const flickrKey = 'f49f28d355392ecf3d26976a59482299';
const locations = [{
        title: 'Washington Park Arboretum',
        location: {
            lat: 47.6398,
            lng: -122.2945
        },
        id: 0
    },
    {
        title: 'Starbucks',
        location: {
            lat: 47.6100898,
            lng: -122.3424699
        },
        id: 1
    },
    {
        title: 'Olympic Sculpture Park',
        location: {
            lat: 47.616347,
            lng: -122.35385
        },
        id: 2
    },
    {
        title: 'Space Needle',
        location: {
            lat: 47.620495,
            lng: -122.3493
        },
        id: 3
    },
    {
        title: 'Gas Works Park',
        location: {
            lat: 47.6456,
            lng: -122.3344
        },
        id: 4
    },
    {
        title: 'Volunteer Park',
        location: {
            lat: 47.6300,
            lng: -122.3150
        },
        id: 5
    }
];


/**
 * @description render Google maps with supplied markers
 */
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13
    });
    const largeInfowindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    // The following group uses the location array to create an array of markers on initialize.
    for (let i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        const position = locations[i].location;
        const title = locations[i].title;
        const id = locations[i].id

        // Create a marker per location, and put into markers array.
        let marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: id
        });
        // Push the marker to our array of markers.
        markers.push(marker);

        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            toggleBounce(this);
            populateInfoWindow(this, largeInfowindow);
        });
        bounds.extend(markers[i].position);
    }

    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);
}


/**
 * @description animate the marker with bounce effect on click
 * @param {object} marker contains details about a location
 */
function toggleBounce(marker) {
    for (let i = 0; i < markers.length; i++) {
        if (marker != markers[i]) {
            // stop animation for other markers
            markers[i].setAnimation(null);
        } else {
            // animate (bounce) the selected marker
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }
}


/**
 * @description show all location markers
 */
function showAll() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setVisible(true);
    }
}


/**
 * @description populate info window with data from Flickr
 * @param {object} marker - object containing location details
 * @param {object} infowindow - object containing popup details
 */
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // call 3rd party api to get details about location
        const $promise = callApi(marker);
        $promise.done(function(data) {
            if (data.stat === 'ok' && data.photos.photo.length > 0) {
                infowindow.marker = marker;
                const photoId = data.photos.photo[0].id;
                const photoSecret = data.photos.photo[0].secret;
                const photoServer = data.photos.photo[0].server;
                const photoFarm = data.photos.photo[0].farm;
                const imagePath = 'https://farm' + photoFarm +
                    '.staticflickr.com/' + photoServer +
                    '/' + photoId + '_' +
                    photoSecret + '.jpg';
                const container = '<div><div class="my-2">' + marker.title + '</div>' +
                    '<img class="img-fluid" width="150" height="150" src=' + imagePath + ' />' +
                    '<div class="my-2">Powered by <a target="_blank" href="https://www.flickr.com/">Flickr</a></div>' +
                    '</div>';
                infowindow.setContent(container);
                infowindow.open(map, marker);
                // Make sure the marker property is cleared if the infowindow is closed.
                infowindow.addListener('closeclick', function() {
                    infowindow.setMarker = null;
                });
            } else {
                if (data.stat !== 'ok') {
                    alert('Error fetching photo for ' +
                        marker.title + '. Code: ' +
                        data.code + ', Message: ' + data.message);
                } else {
                    alert('No photos found at coordinates for ' + marker.title);
                }
            }
        }).fail(function(xhr) {
            alert('Error fetching photo for ' + marker.title);
        });
    }
}


/**
 * create the ajax call for getting Flickr photos
 * @param {object} selectedMarker - the current marker selected
 */
function callApi(selectedMarker) {
    const limit = 1;
    const lat = selectedMarker.position.lat();
    const lng = selectedMarker.position.lng();
    const url = apiUrl + '&lat=' +
        lat + '&lon=' +
        lng + '&per_page=' +
        limit + '&api_key=' + flickrKey;

    return $.ajax({
        url: url,
        method: 'GET'
    });
}


/**
 * @description represents a location marker
 * @param {Object} location - object containing coordinates
 */
class Marker {
    constructor(location) {
        this.title = ko.observable(location.title);
        this.lat = ko.observable(location.location.lat);
        this.lng = ko.observable(location.location.lng);
        this.id = ko.observable(location.id);
    }
}


/**
 * @description help bind data to the view
 */
const ViewModel = function() {
    let self = this;

    self.allLocations = [];

    // initialize the filter locations and make them observable
    self.locationList = ko.observableArray([]);

    // initialize the search input as an observable
    self.search = ko.observableArray('');

    locations.forEach(function(location) {
        self.locationList.push(new Marker(location));
    });

    // backup all locations for filtering
    self.allLocations = self.locationList;

    // click event for selecting a location in list
    self.locationSelect = function(location) {
        google.maps.event.trigger(markers[this.id()], 'click');
    }

    // bind change event to search input
    self.locationList = ko.dependentObservable(function() {
        if (self.search().length > 0) {
            // filter by given search filter
            const filter = self.search().toLowerCase();
            return ko.utils.arrayFilter(self.allLocations(), function(l) {
                if (l.title().toLowerCase().indexOf(filter) > -1) {
                    markers[l.id()].setVisible(true);
                    return true;
                } else {
                    markers[l.id()].setVisible(false);
                    return false;
                }
            });
        } else {
            // no search filter, display all and set markers to visible
            showAll();
            return self.allLocations();
        }
    }, self);
}

ko.applyBindings(new ViewModel());