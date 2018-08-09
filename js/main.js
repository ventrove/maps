var map;
// Create a new blank array for all the listing markers.
var markers = [];
var apiUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&radius=0.003048';
var flickrId = 'db342fcc51e83f58d847f2ab157293cd';
var flickrKey = 'dc3af15923894264';

// store json to save on rate limit. To be removed.


//array of locations to place on map on startup
var locations = [
  {title: 'Washington Park Arboretum', location: {lat: 47.6398, lng: -122.2945}, id: 0},
  {title: 'Starbucks', location: {lat: 47.6100898, lng: -122.3424699}, id: 1},
  {title: 'Olympic Sculpture Park', location: {lat: 47.616347, lng: -122.35385}, id: 2},
  {title: 'Space Needle', location: {lat: 47.620495, lng: -122.3493}, id: 3},
  {title: 'Gas Works Park', location: {lat: 47.6456, lng: -122.3344}, id: 4},
  {title: 'Volunteer Park', location: {lat: 47.6300, lng: -122.3150}, id: 5},
  {title: 'Test No Photos', location: {lat: 47.66, lng: -122.39}, id: 6}
];

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13
  });
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
    //call 3rd party api to get details about location
    var $promise = callApi(marker);
    $promise.done(function(data){
        if(data.stat === 'ok' && data.photos.photo.length > 0){
          infowindow.marker = marker;
          var photoId = data.photos.photo[0].id;
          var photoSecret = data.photos.photo[0].secret;
          var photoServer = data.photos.photo[0].server;
          var photoFarm = data.photos.photo[0].farm;
          var imagePath = 'https://farm' + photoFarm + '.staticflickr.com/' + photoServer + '/' + photoId + '_' + photoSecret + '.jpg';
          var container = '<div>' 
          + '<div class="my-2">' + marker.title + '</div>'
          + '<img class="img-fluid" width="150" height="150" src=' + imagePath + ' />'
          + '<div class="my-2">Powered by <a target="_blank" href="https://www.flickr.com/">Flickr</a></div>' 
          + '</div>'
          infowindow.setContent(container);
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick',function(){
            infowindow.setMarker = null;
          });
        }else{
          if(data.stat !== 'ok'){
            alert('Error fetching photo for ' + marker.title + '. Code: ' + data.code +  ', Message: ' + data.message);
          }else{
            alert('No photos found for ' + marker.title);
          }
        }
      }).fail(function(xhr){
        alert('Error fetching photo for ' + marker.title);
      });
  }
}

//call 3rd party api
function callApi(selectedMarker){
  var limit = 1;
  var lat = selectedMarker.position.lat();
  var lng = selectedMarker.position.lng();
  var url = apiUrl
  + '&lat=' + lat
  + '&lon=' + lng
  + '&per_page=' + limit
  + '&api_key=' + flickrId;

  return $.ajax({
    url: url,
    method: 'GET'
  });
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
      // ALT: return self.allLocations().filter((l) => {
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