var map;
// Create a new blank array for all the listing markers.
var markers = [];
var apiUrl = 'https://api.foursquare.com/v2/venues/search?v=20180323';
var foursquare_client_id = 'OK4YLHSCC2ZRASFY5DSTQQZ4MMSCPV1CXCH5NM3NFYHB4PB3';
var foursquare_client_secret = 'A4T5DZV0JNNZEN4WRYY4XVU33LTIPNPZOC0B4VKTKJTLBL5C';

// store json to save on rate limit. To be removed.
var dumbydata = {
  "meta": {
      "code": 200,
      "requestId": "5b6107dbf594df2686ab9fc5"
  },
  "response": {
      "venues": [
          {
              "id": "4a6e24f6f964a52007d41fe3",
              "name": "Pike Place Chowder",
              "contact": {},
              "location": {
                  "address": "1530 Post Aly",
                  "crossStreet": "btwn Pike Pl & Pine St",
                  "lat": 47.609424244253056,
                  "lng": -122.34115260010435,
                  "labeledLatLngs": [
                      {
                          "label": "display",
                          "lat": 47.609424244253056,
                          "lng": -122.34115260010435
                      }
                  ],
                  "distance": 7,
                  "postalCode": "98101",
                  "cc": "US",
                  "city": "Seattle",
                  "state": "WA",
                  "country": "United States",
                  "formattedAddress": [
                      "1530 Post Aly (btwn Pike Pl & Pine St)",
                      "Seattle, WA 98101",
                      "United States"
                  ]
              },
              "categories": [
                  {
                      "id": "4bf58dd8d48988d1ce941735",
                      "name": "Seafood Restaurant",
                      "pluralName": "Seafood Restaurants",
                      "shortName": "Seafood",
                      "icon": {
                          "prefix": "https://ss3.4sqi.net/img/categories_v2/food/seafood_",
                          "suffix": ".png"
                      },
                      "primary": true
                  }
              ],
              "verified": false,
              "stats": {
                  "tipCount": 0,
                  "usersCount": 0,
                  "checkinsCount": 0,
                  "visitsCount": 0
              },
              "beenHere": {
                  "count": 0,
                  "lastCheckinExpiredAt": 0,
                  "marked": false,
                  "unconfirmedCount": 0
              },
              "hereNow": {
                  "count": 0,
                  "summary": "Nobody here",
                  "groups": []
              },
              "referralId": "v-1533085659",
              "venueChains": [],
              "hasPerk": false
          }
      ],
      "confident": true
  }
};

//array of locations to place on map on startup
var locations = [
  {title: 'Pike Place Chowder', location: {lat: 47.60941, lng: -122.341245}, id: 0},
  {title: 'The Pink Door', location: {lat: 47.61028, lng: -122.3425}, id: 1},
  {title: 'Toulouse Petit Kitchen & Lounge', location: {lat: 47.624851, lng: -122.357127}, id: 2},
  {title: 'Piroshky Piroshky', location: {lat: 47.60991, lng: -122.34231}, id: 3},
  {title: 'Tilikum Place Cafe', location: {lat: 47.61787, lng: -122.34751}, id: 4},
  {title: 'Dandylion', location: {lat: 47.624257093027, lng: -122.356551513076}, id: 5}
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
        if(data.meta.code === 200){
          infowindow.marker = marker;
          var locationDetails = data.response.venues[0];
          var container = '<div>' 
          + '<div>' + marker.title + '</div>'
          + '<div>Category: ' + locationDetails.categories[0].name + '</div>'
          + '<div>Check-Ins: ' + locationDetails.stats.checkinsCount + '</div>'
          + '</div>'
          infowindow.setContent(container);
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick',function(){
            infowindow.setMarker = null;
          });
        }else{
          alert('Unable to retrieve location data: HTTP ' + data.meta.code);
        }
      }).fail(function(xhr){
        alert('exception while calling api for ' + marker.title + ': ', xhr);
      });
  }
}

//call 3rd party api
function callApi(selectedMarker){
  var limit = 1;
  var lat = selectedMarker.position.lat();
  var lng = selectedMarker.position.lng();
  var url = apiUrl + '&ll=' + lat + ',' + lng
  + '&limit=' + limit
  + '&client_id='
  + foursquare_client_id 
  + '&client_secret=' + foursquare_client_secret;

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