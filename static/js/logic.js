// Create our map, giving it the streetmap and earthquakes layers to display on load
var currentYear=0;      // hold the current year being displayed
var oldYear=0;          // holds the previous year being displayed
window.plotLayer;   // previous leaflet layer that holds storm tracks
window.plotLayer2;  // previous leaflet layer that hold single storm track
window.trackLayer;  // leaflet layer that hold retired storm track
var mapTitle;           // title on leaflet map
var currentStorms;      // array of objects that holds all storms being displayed for the chosen year
var currentStorm;       // object that holds the current storm track being displayed 
var hoverLayer;         // leaflet layer that highlights the storm when you hover over the storm list
var maxStrength = new Object();  // stores the max stregths for the current list of storms

//var www_addr = "http://127.0.0.1:5000/"
var www_addr = "https://demo-hurricanes-app.herokuapp.com/"


function retiredStorms() {
//  plot retired storm track and storm observations  
  var name = d3.select(this).property('value')  // get the requested storm fromthe select box
  
//  d3.select(`#stormform${oldYear}`).remove()
//  d3.select(`#stormform${currentYear}`).remove()
//  d3.selectAll("#stormlabel").remove()
  d3.selectAll(".labels").remove()  // remove list of storms from the storm list box
  

//  get storm data from flask server
 d3.json(`${www_addr}${name}`).then(function(data) {
   plotStorm(data,name,2)  // plot storm track... this functio also will plot the storm observations

  })
}

//  use this as a check point if things not working correctly
//retiredstorms()




function updatePlots(){
//  delete plot that is in div stats
  Plotly.deleteTraces('stats',0)
}

function plotSingle() {
//  plot a single storm track on map

  var name = d3.select(this).property('value')  // get name of storm requsted
  var storm = currentStorms.filter(obj => {  //  get storm object from the array of objects for the selected year
    return obj.name === name
  })

  plotStorm(storm,name,1)  // plot plot storm and storm observations
}


function plotStorm(storm,name,type) {
//  plots the storm track for a single storm.  retired storms and regular
// storms are handled slightly differently, so type indicates which type of 
// storm is being plotted
//
// storm = object that contains the data for the storm
// name  = storm name
// type = type of storm:  1 = normal storm;  2 = retired storm
//


  year = storm[0].year  // year of the storm
  currentYear = storm[0].year  // set currentYear 
  currentStorm = storm  // set currentStorm
  var locs = []  // array of arrays to hold lat,lon pairs for storm track
 // var map = createMap()
 var dots = []       // array of all the dots plotted for the treack
 var lats = []       // array that holds just the lats ... used for adjusting the center map location
 var lons = []       // array that holds just the lons.... used for adjusting the central map location
 var dates = []      // array that holds all the dates for the storm
 var windspeed = []  //  array that holds all the wind speeds for the storm .. used for x-y plot of hte observations
 var pressure = []   //  array that holds all the pressures for the storm ... used for x-y plot 
 var xticks = []     // x tick marks .... just an index of 1 ... number of points
 var colors = []     // colors for each of the x-y plot points that correspond to storm strenght
 var strength = []   // saffir-simpson scale for storm.. at each point of observation
 var nxticks=0       // total number of x ticks

 // iterate thru all the observations along the storm track
  storm[0].track.forEach(function(data){
     var temp = []  // temporary array to hold lat,lon 
     temp.push(data[0])
     temp.push(data[1])
     date = data[6]
     hour = date.substr(date.length-4)  // get just the hour from the date 

// for consistency in plotting, only choose the 00,06,12 and 18z observations...
// this should get atleast 90% of the obs for most storms
//  populate arrays for plotting x-y data
      if (hour == "0000" || hour === "0600" || hour === "1200" || hour === "1800") {
        lats.push(data[0])
        lons.push(data[1])
        windspeed.push(data[3]) 
        pressure.push(data[4])
        dates.push(data[6])
        colors.push(getColor(data[5]))
        strength.push(data[5])
        xticks.push(nxticks)
        nxticks+=1
     }
     
// add circle to map for each locations...  color each dot to represent the saffir-simpson scale (1-5)
     var dot = L.circle(temp, { 
      color: getColor(data[5]),
      fillColor: getColor(data[5]),
      fillOpacity: 1.0,
      radius: 32000
      
     })
  dots.push(dot)  // put each circle into an array to create a group layer
    })
  if (myMap.hasLayer(window.plotLayer)){  // remove storm track layer if it exists
    myMap.removeLayer(window.plotLayer)
  }

  if (myMap.hasLayer(window.plotLayer2)){  // remove single track layer if it exists
    myMap.removeLayer(window.plotLayer2)
  }
  window.plotLayer2 = L.layerGroup(dots)  // create leaflet layer out of current storm track
  myMap.addLayer(window.plotLayer2)  // add layer to map
  latmean  = lats.reduce((acc, c) => acc + c, 0);  // get mean latitude of storm track for adjusint the map to center on storm track
  lonmean  = lons.reduce((acc, c) => acc + c, 0);  // get mean longitude of storm track for adjusint the map to center on storm track
  latmean=latmean/lats.length
  lonmean = lonmean/lons.length
  
  mapTitle.update(currentYear,name,type)  // update map title
  myMap.setView([latmean,lonmean],4)  //  change map view to center on mean lat,lon of track


// This part of the functions plots x-y plot of wins speed and pressure for each point  

// delete previous plot in the stats div
  Plotly.deleteTraces('stats',0)  

  var myPlot = document.getElementById('stats'),  // gets the stats div 
  hoverInfo = document.getElementById('hoverinfo')


  // set up trace for wind speed line
  var trace1 = {
    
    y: windspeed,
    width: 400,
    height: 500,
    name: "Wind Speed",
    
    mode: 'lines+markers',
    marker: {
        size: 12,
        color: colors,
        opacity: 1.0
    }
};

//  set up trace for pressure line
var trace2 = {
    
  y: pressure,
  width: 400,
  height: 500,
  yaxis: "y2",
  name: "Pressure",
  mode: 'lines+markers',
  marker: {
      size: 12,
      color: colors,
      opacity: 1.0,
      symbol: "cross"
  }
};

var data = [trace1,trace2];  // add traces to array for plotting
// set up layout
var layout = {
  title: `${name} Track Profile`,
  tickmode: "array",
  xaxis: {
    tickvals: xticks,
    ticktext: dates
  },
  yaxis: {
    title: "Wind Speed (mph)"
  },
  yaxis2: {
    title: 'Pressure',
    overlaying: 'y',
    side: 'right'
  }
  ,
  legend: {
    x: 1,
    y: 1.5
  },
  hovermode:'closest'
  
};

Plotly.newPlot('stats', data, layout);  // plot data 

// this sets up the hover feature which will highlight the circle of 
// observation in the leaflet track map
myPlot.on('plotly_hover', function(data){
  var infotext = data.points.map(function(d){
    
    return (d.pointNumber);
  });
  ii = infotext[0]
  //  this controls the info box on the plotly plot
  hoverInfo.innerHTML = infotext.join('<br/>');
  //  this creates the highlight circle on the leaflet map
  hoverLayer = L.circle([lats[ii],lons[ii]], { 
    color: "black",
    fillColor: getColor(strength[ii]),
    fillOpacity: 1.0,
    radius: 128000
   }).addTo(myMap)
  })
  .on('plotly_unhover', function(data){  // remove the leaflet highlight circle when you are no longer hovering over the plotly point
    hoverInfo.innerHTML = '';
    if (myMap.hasLayer(hoverLayer)){
      myMap.removeLayer(hoverLayer)
    }


  });

}

function getColor(mag) {
//  assign color correlated to the saffir-simpson category of the hurricane
  if (mag == 0) {
    return "blue"
  } else if (mag == 1) {
    return "#66ff33"
  } else if (mag == 2) {
    return "#ff99ff"
  } else if (mag == 3) {
    return "#ff9900"
  } else if (mag == 4) {
    return "#cc6600"
  } else {
    return "#ff0000"
  }
}


function createMap() {
// create the leaflet basemap
  var Map = L.map("map", {
    center: [
      30.00, -60.00
    ],
    zoom: 3,
    
  });

// create a control legend to be used as a title box
  mapTitle = L.control();  //  title 
   
// add title to map   
  mapTitle.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'title'); // create a div with a class "info"
    this.update();
    return this._div;
  };

// add a function to update the title in the map depending on what is being plotted
  mapTitle.update = function (year,storm,type) {
    if (type == 1) {
      if (storm) {
        this._div.innerHTML = `<h4>All Storms for ${year}</h4><h4>This Storm: ${storm}`
      } else {
        this._div.innerHTML = `<h4>All Storms for ${year}</h4>`
      }
 
    } else {
      this._div.innerHTML = `<h4>${storm} RETIRED in ${year}</h4>`
    }
  }
   mapTitle.addTo(Map)  // add title to map

   var legend = L.control({position: 'bottomleft'}); // create a legend to map the storm strength to a color
   
   legend.onAdd = function (map) {  // add legend to map
   
     var div = L.DomUtil.create('div', 'legend')
     
     // loop through our density intervals and generate a label with a colored square for each interval
     div.innerHTML += "<h4>Hurricane Intensity</h4>" + 
         "<i style=background:" + getColor(0) + "><font color=white>Category 0(< 74mph)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>" +
         "<i style=background:" + getColor(1) + ">Category 1 ( 74-95mph)&nbsp;&nbsp;<br>" +
         "<i style=background:" + getColor(2) + ">Category 2 ( 96-110mph)<br>" +
         "<i style=background:" + getColor(3) + ">Category 3 (111-129mph)<br>" +
         "<i style=background:" + getColor(4) + ">Category 4 (130-156mph)<br>" +
         "<i style=background:" + getColor(5) + ">Category 5 (> 157mph)</font>&nbsp;&nbsp;&nbsp;&nbsp;" 
   
     return div;
   };
   
   legend.addTo(Map)  // add legend to map

  return Map
}
var stats;  // this variable holds the climatology


function plotStatsnew() {
// plot the storm climatology in x-y plotly plot
  
//  this create a slide bar at the bottom of the chart to zoom in on a time period 
var selectorOptions = {
  buttons: [ {
      step: 'year',
      stepmode: 'todate',
      count: 1,
      label: 'YTD'
  }, {
      step: 'year',
      stepmode: 'backward',
      count: 10,
      label: '10y'
  }, {
      step: 'all',
  }],
};

// bring in climatology from flask ... this is computed on server side when
// server is started to speed things up
  d3.json(`${www_addr}info`).then(function(data) {
    ts = []  // count of tropical storms per year
    hu = []  // count of hurricanes per year
    years = []  // all years in climatology
    all = []  // counts for tr + hu
    pie = []  // holds total counts of saffier-simpson cattegories for a pie chart
    stats = data
    type = 1;  // 1 for line plot, 2 for pie
    data.sort((a, b) => (a.year > b.year) ? 1 : -1)  // sort data by year
    data.forEach(function(stats){  // split stats into different categories
      if (stats.year > 1800) {
         years.push(stats.year.toString())
         ts.push(stats['0'])
         hu.push(stats.HU)
         all.push(stats.count)
      } else {  // this assigns total counts for entire period of record
        pie.push(stats['1'])
        pie.push(stats['2'])
        pie.push(stats['3'])
        pie.push(stats['4'])
        pie.push(stats['5'])
      }
    })

//  these are the choice for the select box at the bottom of the climatology
    var choices = ['Hurricanes','Tropical Storms','All Storms','Storm Aggregate']

    function getCountryData(chosents) {
//  this function assigns the data to be plotted when the select box is changed
      console.log("choice get data",chosents)
      if (chosents === "Hurricanes") {
         type=1
         return hu
      } else if (chosents === "Tropical Storms") {
        type=1
        return  ts
      } else if (chosents === "All Storms") {
        type=1
        return all
      } else {
        type=2
        return pie 
    }
  };

  // set the default value for the plot
  setBarPlot('Hurricanes');

  function setBarPlot(chosents) {
// this function sets up the x-y plot for plotly
      currentData = getCountryData(chosents);
      if (type == 1) {  // this is x-y plot for storm types by year
        var trace1 = {
            x: years,
            y: currentData,
            width: 400,
            height: 500,
            mode: 'lines+markers',
            marker: {
                size: 12,
                opacity: 0.5
            }
        }
        var layout = {
              xaxis: { rangeselector: selectorOptions,
              rangeslider: {}
            },
              title: `${chosents} per Year`,
              yaxis: {range: [0, 30]} 
        };
    
      } else {  // this is for pie chart counts for entere period of record by saffier-simpson scale
        var trace1 = {
           values: pie,
           labels: ['Cat 1', 'Cat 2', 'Cat 3','Cat 4','Cat 5'],
           marker: {
           colors: ["#66ff33","#ff99ff","#ff9900","#cc6600","#ff0000"]},
           type: 'pie',
           height: 500,
           width: 400
        } 
        var layout = {
          height: 400,
          width: 400,
          title: `Total Storm Counts by Category for 1851-2018`,     
    };


      }
      var data = [trace1];
   
     
      Plotly.newPlot('stats', data, layout);  //plot data
  }; 

// assign the actual plot to the inner div so that select box can 
// be put in outer div
  var innerContainer = document.querySelector('#stats'),
      plotEl = innerContainer.querySelector('.plot'),
      countrySelector = innerContainer.querySelector('.stats');


  function assignOptions(textArray, selector) {
//  this sets the select box up to choose what to plot
      for (var i = 0; i < textArray.length;  i++) {
          var currentOption = document.createElement('option');
          currentOption.text = textArray[i];
          selector.appendChild(currentOption);
      }
  }

  assignOptions(choices, countrySelector);

  function updateLine(){
//  this function allows us to update the line chart and makes this dynamic as it 
// is called by the event listener below
      setBarPlot(countrySelector.value);
  }
//  set up event listener on selector box to change the line plot/ pie chart
  countrySelector.addEventListener('change', updateLine, false);
});

    
}


plotStatsnew()  // plot the climatology when page loads
// create map and set it up when page lodads
var myMap = createMap()  
var cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {    attribution: cartodbAttribution
  }).addTo(myMap);


  
function seeTrack() {
//  This highlights the track when the storm is moused over 
  var name = d3.select(this).property('id')  // get storm name thats moused over
  
  var storm = currentStorms.filter(obj => {  // get data for selected storm
    return obj.name === name
  })
  storm=storm[0]
  
   tracks = []  // array to hold the lat,lon pairs for the track
   for (i=0;i< storm.track.length-1;i++) {  // iterate over the track pairs and color each line depending on the saffir-simpson scale
       var polyline = L.polyline(
       [[storm.track[i][0],storm.track[i][1]],[storm.track[i+1][0],storm.track[i+1][1]]], {weight: 8,color: getColor(storm.track[i][5])});
       
         tracks.push(polyline)
    }

    window.trackLayer = L.layerGroup(tracks)  // create a layer for the group of track polylines
    myMap.addLayer(window.trackLayer)  // add layer to map
}




function plotYear() {
// Plots all storm tracks for the selected year
  var year = d3.select(this).property('value')  // get the selected year
  
  oldYear = currentYear  // keep track of the previous year plotted
  currentYear = year  // keep track of the current year plotted
  
    // specify popup options 
    var customOptions =
    {
    'maxWidth': '500',
    'className' : 'custom'
    }

    var yearstats = stats.filter(obj => {  // get the year total stats for the chosen year so they can be written tothe stats box
      return obj.year == year
    })
    
    //  write out the storm total for the selected year to the info div
    document.getElementById("info").innerHTML = 
    `<h4>Stats for ${year}</h4>` + 
    `<table border=0>` + 
     `<tr><td halign=right><b>Total Storms:</b></td><td halign=left>${yearstats[0]["count"]}</td></tr>` +
     `<tr><td halign=right><b>Hurricane:</b></td><td halign=left>${yearstats[0]["HU"]}</td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(0) + `">Tropical Storms:</b></td><td halign=left>${yearstats[0]["0"]}</font></td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(1) + `">Cat 1:</b></td><td halign=left>${yearstats[0]["1"]}</font></td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(2) + `">Cat 2:</b></td><td halign=left>${yearstats[0]["2"]}</font></td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(3) + `">Cat 3:</b></td><td halign=left>${yearstats[0]["3"]}</font></td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(4) + `">Cat 4:</b></td><td halign=left>${yearstats[0]["4"]}</font></td></tr>` +
     `<tr><td halign=right><b><font color="` +getColor(5) + `">Cat 5:</b></td><td halign=left>${yearstats[0]["5"]}</font></td></tr>` +
     `<tr><td halign=right><b>Max Wind</b></td><td halign=left>${yearstats[0]["maxWind"]}</td></tr>` +
     `<tr><td halign=right><b>Mean Wind:</b></td><td halign=left>${(yearstats[0]["meanWind"]/yearstats[0]["HU"]).toFixed(0)}</td></tr>` +
     `<tr><td halign=right><b>Min Pressure:</b></td><td halign=left>${yearstats[0]["minPressure"]}</td></tr>` +

     `</table>`


 

//  This is the main loop that gets the data from flask for the given year nad plots each storm track
//  d3.json(`http://127.0.0.1:5000/getYear/${year}`)
  d3.json(`${www_addr}${year}`)
  .then(function(data) {
     
      var tracks = []  // array that holds all the storm tracks for the year
      currentStorms = data  // store all storms for the given year 
      maxStrength = {}  //  store the max saffir-simpson rating so that the storm name in the list can be colored 
      

      data.forEach(function(storm){  // iterate over each storm and plots its track
          var locs = []  // tempoprary array to hold lat-lon pair for each storm location
          
          nm = storm.name
          maxStrength[nm] = storm.maxStrength  // store storms max strength 

          storm.track.forEach(function(loc){  //iteratge over all the tracks for the given storm and pull out lat,lon and saffer-simpson rating
            var temp = []
            temp.push(loc[0])
            temp.push(loc[1])
            temp.push(loc[5])
            locs.push(temp)
          })
          for (i=0;i< storm.track.length-1;i++) {  // iterate over the tracks for each storm and draw the line from one location to the next and color it accordings to the saffir-simpson scale
            
          var polyline = L.polyline(  // draw line
          [[storm.track[i][0],storm.track[i][1]],[storm.track[i+1][0],storm.track[i+1][1]]], {color: getColor(storm.track[i][5])});
//  bind popup to each line so you can see storm info by clicking on a track
          polyline.bindPopup("<b>Name:</b>" + storm['name'] + "<br>"
                            + "<b>min Pressure:</b>" + storm['minPressure'] + "<br>"
                            + "<b>max Wind Speed:</b>" + storm['maxWind'] + "<br>"
                            + "<b>max Category:</b> " + storm['maxStrength']
                            ,customOptions)
          tracks.push(polyline)  // add polyline to array holding all the tracks
          }
      })

       

        if (myMap.hasLayer(window.plotLayer2)){  // remove single storm track layer if it exists
          myMap.removeLayer(window.plotLayer2)
        }

        if (myMap.hasLayer(window.plotLayer)){  // remove previous years track layer if it exists
          myMap.removeLayer(window.plotLayer)
        }
       window.plotLayer = L.layerGroup(tracks)  // create a layer group for the chosen years tracks
        // var overlay = {"tracks":trackGroup}
        //trackGroup.clearLayers()
        myMap.addLayer(window.plotLayer)  // add chosen years tracks to the map
//      d3.selectAll("#stormselect").remove()  // remove the previous selected years list storms radio buttons 
//      d3.selectAll("#stormlabel").remove()   // remove the lables of the previous years list of storms radio buttons
      mapTitle.update(year,"",1)  // update the map title
      d3.selectAll(".labels").remove()  // remove the labels class for the list of storms for the selected year
//      d3.select(`#stormform${oldYear}`).remove()

//  section below add the list of storms to the storm list box and creates radio buttons so 
//  user can select a particular storm and see it tracks in detail
       var form = d3.select("#stormlist").append("form").attr("id","stormform" + year)
      

      labels = (form.selectAll("label")  // create the radio buttons and label them wit hteh storm names
          .data(data)
          .enter()
          .append("label")
          .attr('id', function(d) { return d.name})
          .attr('class','labels')
          .style("color",function(d) {return getColor(d.maxStrength)})
          .text(function(d) {
            return  d.name 
          }))
          .on('mouseover',seeTrack)
          .on('mouseout',function (d) { myMap.removeLayer(window.trackLayer)})
          .append("input")
          .attr('id','stormselect')
          .attr('type', 'radio')
          .attr('name', 'mode')
          .attr('value', function(d) {
            return d.name;})
          .on('change',plotSingle)
         

    //  color the individual storm names in the radio list by max Strength          
         Object.keys(maxStrength).forEach(function(key) {
                 
                 color = getColor(maxStrength[key])   
                 hld = document.getElementById(key).innerHTML.split("<")       
      //          document.getElementById(key).innerHTML = "<font color=" + color + ">" + hld[0] + "</font><" + hld[1]
                
    
              });


  })  //  then
  plotStatsnew()

}


// the next three statements set up the packery grid for creating the web pages format... it will
// also allow for some of hte boxes to be moved around the screen
var $grid = $('.grid').packery({
  itemSelector: '.grid-item',
  columnWidth: 100,
  isHorizontal: false
});

var $grid = $('.grid').packery({
itemSelector: '.grid-item',
// stamp elements
stamp: '.stamp'
});

// make all grid-items draggable
$grid.find('.grid-item').each( function( i, gridItem ) {
  var draggie = new Draggabilly( gridItem );
  // bind drag events to Packery
  
  $grid.packery( 'bindDraggabillyEvents', draggie );
});


function selectYear() {
// this creates the select box for user to select a given year to view
  var years = []
  for (var i = 2018; i > 1850; i--) {  // loop thru POR backwards 
     var obj = {}
     obj.year = i
     years.push(i)
  }
  
  var selector = d3.select("#selector")  // create select box 
  .append("select")
  .attr("id", "selectYear")
  .on("change",plotYear)
  .selectAll("option")
  .data(years)
  .enter().append("option")
  .text(function(d,i) { 
    return d; })
  .attr("value", function (d, i) {
    return d;
  })
  

}


function selectStorm() {
//  Set up select box for retired storms
  var selector = d3.select("#retired")
  .append("select")
  .attr("id", "selectStorm")
  .on("change",retiredStorms)
  .selectAll("option")
  .data(retiredstorms)
  .enter().append("option")
  .text(function(d,i) {
    return `${d.storm} (${d.year})`;})
  .attr("value", function (d, i) {
    return d.storm;
  })

}

// place year and retired storm select boxes on page
selectYear()
selectStorm()
