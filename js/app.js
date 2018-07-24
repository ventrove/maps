var map;
// Create a new blank array for all the listing markers.
var markers = [];

//array of locations to place on map on startup
var locations = [
  {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}, id: 0},
  {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}, id: 1},
  {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}, id: 2},
  {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}, id: 3},
  {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}, id: 4},
  {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}, id: 5}
];

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13
  });
  // These are the real estate listings that will be shown to the user.
  // Normally we'd have these in a database instead.
  // var locations = [
  //   {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
  //   {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
  //   {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
  //   {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
  //   {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
  //   {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
  // ];
  var largeInfowindow = new google.maps.InfoWindow();
  var bounds = new google.maps.LatLngBounds();
  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    var id = locations[i].id
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
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

// This function animates selected marker
function toggleBounce(marker) {
  for(var i = 0; i < markers.length; i++){
    if(marker != markers[i]){
      //stop animation for other markers
      markers[i].setAnimation(null);
    }else{
      //animate (bounce) the selected marker
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  }
}

// This function shows all 
// location markers
function showAll(){
  for(var i = 0; i < markers.length; i++){
    markers[i].setVisible(true);
  }
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick',function(){
      infowindow.setMarker = null;
    });
  }
}

/** Applying Knockout JS logic */
var Marker = function(location){
  this.title = ko.observable(location.title);
  this.lat = ko.observable(location.location.lat);
  this.lng = ko.observable(location.location.lng);
  this.id = ko.observable(location.id);
  //this.nicknames = ko.observableArray(data.nicknames);

  // this.level = ko.computed(function() {
  //     if(this.clickCount() > 200) {
  //         return 'Adult';
  //     }
  //     else if(this.clickCount() > 100) {
  //         return 'Teen';
  //     }
  //     else if (this.clickCount() > 50) {
  //         return 'Child';
  //     }
  //     else if(this.clickCount() > 20) {
  //         return 'Infant';
  //     }
  //     else return 'Newborn';

  // }, this);
}

//init the view model
var ViewModel = function(){
  var self = this;
  
  self.allLocations = [];

  //initialize the filter locations and make them observable
  self.locationList = ko.observableArray([]);
  
  //initialize the search input as an observable
  self.search = ko.observableArray('');

  locations.forEach(function(location){
    self.locationList.push(new Marker(location));
  });

  //backup all locations for filtering
  self.allLocations = self.locationList;
  
  //click event for selecting a location in list
  self.locationSelect = function(location){
    google.maps.event.trigger(markers[this.id()], 'click');
  }

  //bind change event to search input
  self.locationList = ko.dependentObservable(function() {
    if(self.search().length > 0){
      //filter by given search filter
      var filter = self.search().toLowerCase();
      return ko.utils.arrayFilter(self.allLocations(), function(l) {
        if(l.title().toLowerCase().indexOf(filter) > -1){
          markers[l.id()].setVisible(true);
          return true;
        }else{
          markers[l.id()].setVisible(false);
          return false;
        }
      });
    }else{
      //no search filter, display all and set markers to visible
      showAll();
      return self.allLocations();
    }
  }, self);

}

ko.applyBindings(new ViewModel());