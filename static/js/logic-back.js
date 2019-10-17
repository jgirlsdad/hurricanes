// Create our map, giving it the streetmap and earthquakes layers to display on load
var currentYear=0;
var oldYear=0;
window.plotLayer;
window.plotLayer2;
window.trackLayer;
var mapTitle;
var currentStorms;
var currentStorm;
var hoverLayer;
var maxStrength = new Object();



function retiredStorms() {
  var name = d3.select(this).property('value')
  console.log("Retired ",name)
  console.log("oldYear ",oldYear)
  
  console.log("removing labels")
  d3.select(`#stormform${oldYear}`).remove()
  d3.select(`#stormform${currentYear}`).remove()
  d3.selectAll("#stormlabel").remove()
  d3.selectAll(".labels").remove()
  


 d3.json(`http://127.0.0.1:5000/retired/${name}`).then(function(data) {
   plotStorm(data,name,2)

  })
}


//retiredstorms()




function updatePlots(){
  Plotly.deleteTraces('stats',0)

}

function plotSingle() {
  var name = d3.select(this).property('value')
 
  


  var storm = currentStorms.filter(obj => {
    return obj.name === name
  })

  plotStorm(storm,name,1)
}


function plotStorm(storm,name,type) {
  year = storm[0].year
  currentYear = storm[0].year
  currentStorm = storm
  var locs = []
 // var map = createMap()
 var dots = []
 var lats = []
 var lons = []
 var dates = []
 var windspeed = []
 var pressure = []
 var xticks = []
 var colors = []
 var strength = []
 var nxticks=0
  storm[0].track.forEach(function(data){
     var temp = []
     temp.push(data[0])
     temp.push(data[1])
     date = data[6]
     hour = date.substr(date.length-4)
     
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
     

     var dot = L.circle(temp, { 
      color: getColor(data[5]),
      fillColor: getColor(data[5]),
      fillOpacity: 1.0,
      radius: 32000
      
     })
  dots.push(dot)
    })
  if (myMap.hasLayer(window.plotLayer)){
    myMap.removeLayer(window.plotLayer)
  }

  if (myMap.hasLayer(window.plotLayer2)){
    myMap.removeLayer(window.plotLayer2)
  }
  window.plotLayer2 = L.layerGroup(dots)
  myMap.addLayer(window.plotLayer2)
  latmean  = lats.reduce((acc, c) => acc + c, 0);
  lonmean  = lons.reduce((acc, c) => acc + c, 0);
  latmean=latmean/lats.length
  lonmean = lonmean/lons.length
  
  mapTitle.update(currentYear,name,type)
  myMap.setView([latmean,lonmean],4)


// plot x-y plot of wins speed and pressure for each point  
  Plotly.deleteTraces('stats',0)

  var myPlot = document.getElementById('stats'),
  hoverInfo = document.getElementById('hoverinfo')

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





var data = [trace1,trace2];
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

Plotly.newPlot('stats', data, layout);

myPlot.on('plotly_hover', function(data){
  var infotext = data.points.map(function(d){
    
    return (d.pointNumber);
  });
  ii = infotext[0]
  
  hoverInfo.innerHTML = infotext.join('<br/>');
  hoverLayer = L.circle([lats[ii],lons[ii]], { 
    color: "black",
    fillColor: getColor(strength[ii]),
    fillOpacity: 1.0,
    radius: 128000
   }).addTo(myMap)






})
.on('plotly_unhover', function(data){
  hoverInfo.innerHTML = '';
  if (myMap.hasLayer(hoverLayer)){
    myMap.removeLayer(hoverLayer)
  }


});







}

function getColor(mag) {
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
  var Map = L.map("map", {
    center: [
      30.00, -60.00
    ],
    zoom: 3,
    
  });

  mapTitle = L.control();  //  title 
   
   
  mapTitle.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'title'); // create a div with a class "info"
    this.update();
    return this._div;
  };

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
   mapTitle.addTo(Map)

   var legend = L.control({position: 'bottomleft'});
   
   legend.onAdd = function (map) {
   
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
   
   legend.addTo(Map)






  return Map
}
var stats;


function plotStatsnew() {
  console.log("getting stats")
 
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


  d3.json("http://127.0.0.1:5000/info").then(function(data) {
    ts = []
    hu = []
    years = []
    all = []
    pie = []
    stats = data
    type = 1;  // 1 for line plot, 2 for pie
    data.sort((a, b) => (a.year > b.year) ? 1 : -1)
    data.forEach(function(stats){
      if (stats.year > 1800) {
         years.push(stats.year.toString())
         ts.push(stats['0'])
         hu.push(stats.HU)
         all.push(stats.count)
      } else {
        pie.push(stats['1'])
        pie.push(stats['2'])
        pie.push(stats['3'])
        pie.push(stats['4'])
        pie.push(stats['5'])
      }
    })

    console.log(years)
    var choices = ['Hurricanes','Tropical Storms','All Storms','Storm Aggregate']

    function getCountryData(chosents) {
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

  // Default Country Data
  setBarPlot('Hurricanes');

  function setBarPlot(chosents) {
      currentData = getCountryData(chosents);
      if (type == 1) {
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



    
      } else {
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
   
     
      Plotly.newPlot('stats', data, layout);
  }; 

  var innerContainer = document.querySelector('#stats'),
      plotEl = innerContainer.querySelector('.plot'),
      countrySelector = innerContainer.querySelector('.stats');

  function assignOptions(textArray, selector) {
      for (var i = 0; i < textArray.length;  i++) {
          var currentOption = document.createElement('option');
          currentOption.text = textArray[i];
          selector.appendChild(currentOption);
      }
  }

  assignOptions(choices, countrySelector);

  function updateLine(){
      setBarPlot(countrySelector.value);
  }

  countrySelector.addEventListener('change', updateLine, false);
});

    
}





plotStatsnew()
var myMap = createMap()
var cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {    attribution: cartodbAttribution
  }).addTo(myMap);

function seeTrack() {
  var name = d3.select(this).property('id')
  console.log("Lets see track",name)
  var storm = currentStorms.filter(obj => {
    return obj.name === name
  })
  storm=storm[0]
  console.log(storm.track)


  
   tracks = []
   for (i=0;i< storm.track.length-1;i++) {
       var polyline = L.polyline(
       [[storm.track[i][0],storm.track[i][1]],[storm.track[i+1][0],storm.track[i+1][1]]], {weight: 8,color: getColor(storm.track[i][5])});
       
         tracks.push(polyline)
    }

    window.trackLayer = L.layerGroup(tracks)
    myMap.addLayer(window.trackLayer)
}




function plotYear() {
  
  var year = d3.select(this).property('value')
  
  oldYear = currentYear
  currentYear = year
  console.log("plotYear ",year,oldYear,currentYear)
    // specify popup options 
    var customOptions =
    {
    'maxWidth': '500',
    'className' : 'custom'
    }

    var yearstats = stats.filter(obj => {
      return obj.year == year
    })
    
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


 


  d3.json(`http://127.0.0.1:5000/getYear/${year}`)
  .then(function(data) {
     
      var tracks = []
      currentStorms = data
      maxStrength = {}
      

      data.forEach(function(storm){
          var locs = []
          
          nm = storm.name
          maxStrength[nm] = storm.maxStrength

          storm.track.forEach(function(loc){
            var temp = []
            temp.push(loc[0])
            temp.push(loc[1])
            temp.push(loc[5])
            locs.push(temp)
          })
          for (i=0;i< storm.track.length-1;i++) {
            
          var polyline = L.polyline(
          [[storm.track[i][0],storm.track[i][1]],[storm.track[i+1][0],storm.track[i+1][1]]], {color: getColor(storm.track[i][5])});
          polyline.bindPopup("<b>Name:</b>" + storm['name'] + "<br>"
                            + "<b>min Pressure:</b>" + storm['minPressure'] + "<br>"
                            + "<b>max Wind Speed:</b>" + storm['maxWind'] + "<br>"
                            + "<b>max Category:</b> " + storm['maxStrength']
                            ,customOptions)
          tracks.push(polyline)
          }
      })

        console.log("MAXSS ",maxStrength)

        if (myMap.hasLayer(window.plotLayer2)){
          myMap.removeLayer(window.plotLayer2)
        }

        if (myMap.hasLayer(window.plotLayer)){
          myMap.removeLayer(window.plotLayer)
        }
       window.plotLayer = L.layerGroup(tracks)
        // var overlay = {"tracks":trackGroup}
        //trackGroup.clearLayers()
        myMap.addLayer(window.plotLayer)
      d3.selectAll("#stormselect").remove()
      d3.selectAll("#stormlabel").remove()
      mapTitle.update(year,"",1)
      d3.selectAll(".labels").remove()
      d3.select(`#stormform${oldYear}`).remove()
      var form = d3.select("#stormlist").append("form").attr("id","stormform" + year)
      

      labels = (form.selectAll("label")
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
  var years = []
  for (var i = 2018; i > 1850; i--) {
     var obj = {}
     obj.year = i
     years.push(i)
  }
  
  var selector = d3.select("#selector")
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
selectYear()
selectStorm()
