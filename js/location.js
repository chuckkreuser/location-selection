
var myApp = angular.module('mainapp',[]);

myApp.controller('LocationController', ['$scope', function($scope) {
  var states= [];
  $scope.selectTotal= 0;
  $scope.detailsVisible= false;
  $scope.statesDisplayed= true;
  $scope.searchQuery= '';
  
  getStates(function(arr) {
    states= arr;
    setSelectTotal();
    
    setMap();
    
    $scope.$apply(function () {
      $scope.states= states;
    });
  });
  
  //on search, filter the displayed results
  $scope.onSearch= function() { 
    var q= $.trim($scope.searchQuery).toLowerCase();
    var stateCount= 0;
    
    $.each(states, function(i,state) {
      var displayCount= 0;
      
      $.each(state.locations, function(j,loc) {
        loc.displayed= isLocationInSearch(loc, q);
        if (loc.displayed) displayCount++;
      });
      
      state.displayed= (displayCount > 0);
      if (state.displayed) stateCount++;
    });
    
    $scope.statesDisplayed= (stateCount > 0);
  }
  
  // show/hide location details in menu
  $scope.onShowDetails= function(bShow,e) {
    var $this= $(e.currentTarget);
    if ($this.is('.inactive')) return;
    
    $scope.detailsVisible= bShow;
    $('.details-toggle').removeClass('inactive');
    $(e.currentTarget).addClass('inactive');
  }
  
  // on location select, select marker and update total
  $scope.onLocationSelect= function(loc) {
    loc.selected= !loc.selected;
    loc.marker.SetIcon(loc.selected);
    setSelectTotal();
  }
  
  // on state select, select all displayed in state
  $scope.onStateSelect= function(state) {
    setStateSelect(state,true);
  }
  
  // select/unselect all displayed locations
  $scope.setAllSelect= function(bSelect) {
    $.each(states, function(i,state) {
      setStateSelect(state,bSelect);
    });
    
    if (bSelect) setSelectTotal();
    else         $scope.selectTotal= 0;  
  }
  
  // helper: select/unselect displayed locations in state
  function setStateSelect(state,bSelect) {
    $.each(state.locations, function(i,loc) {
      if (loc.displayed) { //don't edit hidden ones
        loc.selected= bSelect;
        loc.marker.SetIcon(bSelect);
      }
    });
    setSelectTotal();
  }
  
  // set selected total from data
  function setSelectTotal() {
    var count= 0;
    
    $.each(states, function(i,state) {
      $.each(state.locations, function(j,loc) {
        if (loc.selected) count++;
      });
    });
    
    $scope.selectTotal= count;
  }
  
  // does a location match a search?
  function isLocationInSearch(loc,q) {
    if (q.length == 0) return true;
    
    //match anywhere
    if (loc.address.toLowerCase().indexOf(q) >= 0) return true;
    if (loc.name.toLowerCase().indexOf(q) >= 0) return true;
    
    //match from start
    if (loc.city.toLowerCase().indexOf(q) == 0) return true;
    if (loc.country.toLowerCase().indexOf(q) == 0) return true;
    if ((loc.id + '').indexOf(q) == 0) return true;
    if (loc.state.toLowerCase().indexOf(q) == 0) return true;
    if (loc.zip_code.toLowerCase().indexOf(q) == 0) return true;
    if (loc.full_state.toLowerCase().indexOf(q) == 0) return true;
    
    return false;
  }
  
  // set map with default values
  function setMap() {
    var mapArgs= { Width: 500, Height: 450, CenterX: 41.9377386, CenterY: -87.7661447, Zoom: 11, Places: [] };
    
    $.each(states, function(i,state) {
      $.each(state.locations, function(j,loc) {
        mapArgs.Places.push({ PlaceId: i + '_' + j, Name: loc.name, MapDescription: loc.address,
                              XCoordinate: loc.latitude, YCoordinate: loc.longitude, Location: loc });
      });
    });
    
    DisplayMap('gmap', mapArgs, function(mapInfo,objMap) { });
  }
}]);

function getStates(onSuccess) {
  var states;
  var locations;
  
  getConfig('states.json', function(arr) {          // get states
    states= arr;
    
    getConfig('locations.json', function(arr2) {   // get locations
      locations= arr2;
      addLocationsToStates();                     // add locations to states
      removeEmptyStates();                        // remove empty states
      
      $.each(states, function(i,state) {
        state.locations.sort(sortLocations);      //sort locations
      });
      
      onSuccess(states);                          // return states
    });
  });
  
  // sort locations by address
  function sortLocations(a,b) {
    return a.address.localeCompare(b.address);
  }
  
  // associated locations to their states
  function addLocationsToStates() {
    $.each(locations, function(i,loc) {
      var state= getState(loc.state);
      if (!state) return;
      
      loc.full_state= state.name;
      loc.displayed= true;
      loc.selected= false;
      
      if (state.locations) state.locations.push(loc);
      else                 state.locations= [ loc ];
    });
  }
  
  // don't bother with states without locations
  function removeEmptyStates() {
    var stateCount= states.length;
    
    for (var i=0; i < stateCount; i++) {
      var index= stateCount - i - 1;
      if (states[index].locations)  states[index].displayed= true;
      else                          states.splice(index,1);
    }
  }

  // helper, get state from abbr
  function getState(abbr) {
    for (var i=0; i < states.length; i++)
      if (states[i].abbr == abbr)
        return states[i];
    return null;
  }
}

function getConfig(url, onSuccess) {
  $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      success: onSuccess,
      error: displayLoadError
    });
  
  function displayLoadError() {
    console.log('There was an error retrieving: ' + url);  // if error loading data
  }
}