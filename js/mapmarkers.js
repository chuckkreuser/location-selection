var g_Markers= {};

function DisplayMap(divID, mapInfo, fOnSuccess) //fOnSuccess(mapInfo, objMap)
{        
    var $div= $("div#" + divID);
    $div.css('width', mapInfo.Width + 'px');
    $div.css('height', mapInfo.Height + 'px');
        
    var myOptions = {
        center: new google.maps.LatLng(mapInfo.CenterX,mapInfo.CenterY),
        zoom: parseInt(mapInfo.Zoom,10),
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var objMap = new google.maps.Map(document.getElementById(divID), myOptions);
    
    if (mapInfo.Places.length == 0)
    {
        if (fOnSuccess)
            fOnSuccess([], objMap);
        
        return;
    }
        
    g_Markers[divID]= []; 
    
    for (var i=0; i < mapInfo.Places.length; i++)
    {  
        var marker= new WeddingMarker(objMap, mapInfo.Places[i], divID, mapInfo.Height, mapInfo.Width);
        g_Markers[divID].push(marker);
        mapInfo.Places[i].Location.marker= marker;
    }
            
    if (fOnSuccess)
        fOnSuccess(mapInfo,objMap);
}

function SelectMarker(divID,placeID)
{
    for (var i=0; i < g_Markers[divID].length; i++)
    {
        var m= g_Markers[divID][i];
        
        if (m.GetPlaceID() == placeID)
            m.Select();
        else if (m.IsWindowOpen())
            m.CloseWindow();            
    }
    
    return false;
}

function WeddingMarker(objMap, place, divID, mapHeight, mapWidth)
{  
    var pos= new google.maps.LatLng(place.XCoordinate,place.YCoordinate);
    var placeID= place.ID;
    var title= place.Name;

    var bWindowOpen= false;
    
    this.GetPlaceID= function() { return placeID; };
    this.IsWindowOpen= function() { return bWindowOpen; };
    this.CloseWindow= function() { if (bWindowOpen) { infowindow.close(); bWindowOpen= false; } };
    this.Select= function() 
                 { 
                    objMap.setCenter(pos);
                    
                    if (!bWindowOpen)
                    {
                        infowindow.open(objMap,marker);
                        bWindowOpen= true;
                    }
                 }
                 
    this.SetIcon= function(bSelected) {
      marker.setMap(null);
      marker.icon= (bSelected) ? 'http://www.google.com/mapfiles/marker.png' : 'http://www.google.com/mapfiles/marker_grey.png';
      marker.setMap(objMap);
    }
      
    var marker = new google.maps.Marker({
        position: pos,
        map: objMap,
        icon: (place.Location.selected) ? 'http://www.google.com/mapfiles/marker.png' : 'http://www.google.com/mapfiles/marker_grey.png',
        title: title
      });
        
    var infowindow = new InfoBubble(
      { content: GetWindowHtml(place),
        borderRadius: 10,
        disableAnimation: true,
        //size: new google.maps.Size(50,50)
      });
      
    infowindow.setMaxHeight(mapHeight-75); 
    infowindow.setMaxWidth(mapWidth-75);
    
    google.maps.event.addListener(marker, 'click', OnMarkerClick);
    google.maps.event.addListener(infowindow, 'closeclick', function() { bWindowOpen= false; });
    
    function OnMarkerClick()
    {
        if (bWindowOpen)
        {
            infowindow.close();
            bWindowOpen= false;
        }
        else
        {
            for (var i=0; i < g_Markers[divID].length; i++)
            {
                var m= g_Markers[divID][i];
                
                if (m.GetPlaceID() != placeID && m.IsWindowOpen())
                    m.CloseWindow();
            }
        
            infowindow.open(objMap,marker);
            bWindowOpen= true;
        }
    }
    
    function GetWindowHtml(place)
    {
        var html= '<div style="padding: 10px;"><b>' + place.Name + '</b>';     
        
        if (place.MapDescription.length > 0)
            html+= '<br><br>' + place.MapDescription;
        
        html+= '</div>';
        return html;
    }
}
