//Megan Roessler
//Geog 575
//D3 Coordinated Visualization

//wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Boro", "ntaname", "ntacode", "Branch", "Total Libraries", "Average Adult Attendance", "Average Young Adult Attendance", "Average Juvenile Attendance", "Average Adult Circulation", "Average Young Adult Circulation", "Average Juvenile Circulation", "Average Total Circulation"]; //list of attributes
var expressed = attrArray[4]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.525,
	chartHeight = 550,
	leftPadding = 40,
	rightPadding = 2,
	topBottomPadding = 5,
	chartInnerWidth = chartWidth - leftPadding - rightPadding,
	chartInnerHeight = chartHeight - topBottomPadding * 2,
	translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
	.range([540, 0])
	.domain([0, 5]);
/* 	.range([0, chartHeight])
	.domain([0, chartHeight]); */

	
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
	var width = window.innerWidth * 0.40,
		height = 540;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	//create Albers equal area conic projection centered on France
	var projection = d3.geoAlbers()
		.center([0, 40.78])
		.rotate([73.95, 0, 0])
		.parallels([29.5, 45.5])
		.scale(147500)
		.translate([width / 2, height / 2]);

	var path = d3.geoPath()
		.projection(projection);
		
	//Bring in data
	var promises = [];
	promises.push(d3.csv("data/nyplData.csv"));
	promises.push(d3.json("data/nycNTA.topojson"));
	promises.push(d3.json("data/manhattan.topojson"));
	Promise.all(promises).then(callback);



	function callback(data){

		//console.log(data);
		csvData = data[0];
		nyc = data[1];
		manhattan = data[2];

		//place graticule on the map
		setGraticule(map, path);
		
		//translate New York/Manhattan into TopoJSONs
		var nycNeighborhoods = topojson.feature(nyc, nyc.objects["nyc-neighborhoods"]),
			manhattanNeighborhoods = topojson.feature(manhattan, manhattan.objects.manhattan).features;

		//add New York to map
		var nyc = map.append("path")
			.datum(nycNeighborhoods)
			.attr("class", "nyc")
			.attr("d", path);

		//join csv data to GeoJSON enumeration units
		manhattan = joinData(manhattanNeighborhoods, csvData);
		//console.log(manhattan);
		
		//create color scale
		var colorScale = makeColorScale(csvData);

		//add enumeration units to the map
		//Use manhattanNeighborhoods NOT manhattan
		//setEnumerationUnits(manhattan, map, path, colorScale);
		setEnumerationUnits(manhattanNeighborhoods, map, path, colorScale);

		//add coordinated visualization to the map
		setChart(csvData, colorScale);

		//create dropdown for attribute selection
		createDropdown(csvData);
	};
}; //end of setMap()

//Set graticule
function setGraticule(map, path){
	//create graticule generator
	var graticule = d3.geoGraticule()
		.step([0.15, 0.15]); //place graticule lines every 0.15 degrees

	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule

	//create graticule lines	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
};

//Join csv data to TopoJSON
function joinData(manhattan, csvData){
	
	//loop through csv to assign each set of csv attribute values to geojson region
	for (var i=0; i < csvData.length; i++){
		var csvRegion = csvData[i]; //the current region
	var csvKey = csvRegion["ntacode"]; //.ntacode //the CSV primary key

		//loop through geojson regions to find correct region
		for (var a=0; a < manhattan.length; a++){

			var geojsonProps = manhattan[a].properties; //the current region geojson properties
			var geojsonKey = geojsonProps["ntacode"];//.ntacode //the geojson primary key

			//where primary keys match, transfer csv data to geojson properties object
			if (geojsonKey == csvKey){

				//assign all attributes and values
				attrArray.forEach(function(attr){
					var val = parseFloat(csvRegion[attr]); //get csv attribute value
					geojsonProps[attr] = val; //assign attribute and value to geojson properties
				});
			};
		};
	};

	return manhattan;
};

function setEnumerationUnits(manhattan, map, path, colorScale,){

	//add Manhattan NTAs to map
	var manhattan = map.selectAll("manhattan.ntacode")
		.data(manhattan)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "manhattan " + d.properties.ntacode;
		})
		.attr("d", path)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale);
		})
		.on("mouseover", function(d){
			highlight(d.properties);
		})
		.on("mouseout", function(d){
			dehighlight(d.properties);
		})
		.on("mousemove", moveLabel);
		
	//add style descriptor to each path
	var desc = manhattan.append("desc")
		.text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create color scale generator
//define colors
function makeColorScale(data){
	var colorClasses = [
		"#FFFFD4",
		"#FED98E",
		"#FE9929",
		"#D95F0E",
		"#993404"
	];

	//create color scale generator
	var colorScale = d3.scaleThreshold()
		.range(colorClasses);

	//build array of all values of the expressed attribute
	var domainArray = [];
	for (var i=0; i<data.length; i++){
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);
	};

	//cluster data using ckmeans clustering algorithm to create natural breaks
	var clusters = ss.ckmeans(domainArray, 5);
	//reset domain array to cluster minimums
	domainArray = clusters.map(function(d){
		return d3.min(d);
	});
	//remove first value from domain array to create class breakpoints
	domainArray.shift();

	//assign array of last 4 cluster minimums as domain
	colorScale.domain(domainArray);

	return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
	//make sure attribute value is a number
	var val = parseFloat(props[expressed]);
	
	//if attribute value exists, assign a color; otherwise assign gray
	if (val && val != NaN){
		return colorScale(val);
	} else {
		return "#CCC";
	};
};

//function to create coordinated bar chart
//Add interactions
function setChart(csvData, colorScale){
	//create a second svg element to hold the bar chart
	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	//create a rectangle for chart background fill
	var chartBackground = chart.append("rect")
		.attr("class", "chartBackground")
		.attr("width", chartInnerWidth)
		.attr("height", chartInnerHeight)
		.attr("transform", translate);

	//set bars for each NTA
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d){
			return "bar " + d.ntacode;
		})
		.attr("width", chartInnerWidth / csvData.length - 1)
		//.attr("height", chartInnerHeight)
		.on("mouseover", highlight)
 		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);

	//add style descriptor to each rect
	var desc = bars.append("desc")
		.text('{"stroke": "none", "stroke-width": "0px"}');

	//create a text element for the chart title
	var chartTitle = chart.append("text")
		.attr("x", 55)
		.attr("y", 40)
		.attr("class", "chartTitle");

	//create vertical axis generator
	// var yAxis = d3.svg.axis()
	// 	.scale(yScale)
	// 	.orient("left");
	var yAxis = d3.axisLeft(yScale);

	//place axis
	var axis = chart.append("g")
		.attr("class", "yAxis")//"axis")
		.attr("transform", translate)//"translate(0, " + height / 2+ ")"
		.call(yAxis);

	//create frame for chart border
	var chartFrame = chart.append("rect")
		.attr("class", "chartFrame")
		.attr("width", chartInnerWidth)
		.attr("height", chartInnerHeight)
		.attr("transform", translate);

	//set bar positions, heights, and colors
	updateChart(bars, csvData.length, colorScale);
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
	//add select element
	var dropdown = d3.select("body")
		.append("select")
		.attr("class", "dropdown")
		.on("change", function(){
			changeAttribute(this.value, csvData)
		});

	//add initial option
	var titleOption = dropdown.append("option")
		.attr("class", "titleOption")
		.attr("disabled", "true")
		.text("Select Attribute");

	//add attribute name options
	var attrOptions = dropdown.selectAll("attrOptions")
		.data(attrArray)
		.enter()
		.append("option")
		.attr("value", function(d){ return d })
		.text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
	//change the expressed attribute
	expressed = attribute;

	//recreate the color scale
	var colorScale = makeColorScale(csvData);

	//recolor enumeration units
	var manhattan = d3.selectAll(".manhattan")
		.transition()
		.duration(1000)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale)
		});

	//re-sort/size/color bars
	var bars = d3.selectAll(".bar")
		//re-sort bars
		.sort(function(a, b){
			return b[expressed] - a[expressed];
		})
		.transition() //add animation
		.delay(function(d, i){
			return i * 20
		})
		.duration(500);
	var yAxis = d3.selectAll(".yAxis")
		

	updateChart(bars, csvData.length, colorScale);
};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
	
	//var yAxis = d3.selectAll(".findYMax")
	
	//position bars
	bars.attr("x", function(d, i){
			return i * (chartInnerWidth / n) + leftPadding;
		})
		//size/resize bars
		.attr("height", function(d, i){
/* 			.domain([0, d3.max(csvData, function(d) { return d.y + 10;})])
			.range([margin.top, h - margin.bottom]); */
			return 540 - yScale(parseFloat(d[expressed]));
			//return 540 - findYMax(parseFloat(d[expressed]));
		})
		.attr("y", function(d, i){
			return yScale(parseFloat(d[expressed])) + topBottomPadding;
		})

		//color/recolor bars
		.style("fill", function(d){
			return choropleth(d, colorScale);
		})

		//.on("mousemove", moveLabel);
	
	//add text to chart title
	var chartTitle = d3.select(".chartTitle")
		.text(expressed + " per NTA");
};

//function to highlight enumeration units and bars
function highlight(props){
	//var ntaname = expressed.ntaname
	var selected = d3.selectAll("." + props.ntacode)
		//change stroke
		.style("stroke", "blue")
		.style("stroke-width", "2");
	//console.log(".manhattan")
	setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
	var selected = d3.selectAll("." + props.ntacode)//ntacode")
		.style("stroke", function(){
				return getStyle(this, "stroke")
			})
		.style("stroke-width", function(){
				return getStyle(this, "stroke-width")
		});

	function getStyle(element, styleName){
		var styleText = d3.select(element)
			.select("desc")
			.text();

		var styleObject = JSON.parse(styleText);

		return styleObject[styleName];
	};

 	//remove info label
	d3.select(".infolabel")
		.remove();
};

//function to create dynamic label
function setLabel(props){
	//label content
	var labelAttribute = "<h1>" + props[expressed] +
		"</h1><b>" + expressed + "</b>";

	//create info label div
	var infolabel = d3.select("body")
		.append("div")
		.attr("class", "infolabel")
		.attr("id", props.ntaname + "_label")
		.html(labelAttribute);

	var ntaname = infolabel.append("div")
		.attr("class", "labelname")
		.html(props.ntaname);
		
	//mousemove event
	var x = d3.event.clientX + 10,
		y = d3.event.clientY - 30;
		
	d3.select(".infolabel")
		.style("left", x + "px")
		.style("top", y + "px");
};



//function to move info label with mouse
function moveLabel(){

	//get width of label
	var labelWidth = d3.select(".infolabel")
		.node()
		.getBoundingClientRect()
		.width;

	//use coordinates of mousemove event to set label coordinates
	var x1 = d3.event.clientX + 10,
		y1 = d3.event.clientY - 75;
		x2 = d3.event.clientX - labelWidth - 10,
		y2 = d3.event.clientY + 25;

	//horizontal label coordinate, testing for overflow
	var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
	
	//vertical label coordinate, testing for overflow
	var y = d3.event.clientY < 75 ? y2 : y1; 

	d3.select(".infolabel")
		.style("left", x + "px")
		.style("top", y + "px");
};

})();