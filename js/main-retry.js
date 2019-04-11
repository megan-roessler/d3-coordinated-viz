/* Megan Roessler
Geography 575
D3 Coordinated Viz
------------------------ */

//Module 3, Ex. 1.2, Definine attrArray and expressed
(function(){

//Module 3, Ex. 1.1, Join CSV to geojson
var attrArray = ["Boro/Central Library", "ntaName", "Branch", "ADULT Attendance", "YOUNG ADULT Attendance", "JUVENILE Attendance", "CIRCULATION Adult", "CIRCULATION Young Adult", "CIRCULATION Juvenile", "CIRCULATION"];
var expressed = attrArray[3]//Initial attribute

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
	//map frame dimensions
	var width = window.innerWidth * 0.55,
		height = 500;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	//create Albers equal area conic projection centered on Manhattan
	var projection = d3.geoAlbers()
		.center([0, 40.75])
		.rotate([74, 0, 0])
		.parallels([29.5, 45.5])
		.scale(155000)
		.translate([width / 2, height / 2]);

	var path = d3.geoPath()
		.projection(projection);

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
		
		//translate NYC and Manhattan TopoJSON
		console.log(nyc.objects);
		console.log(manhattan.objects);
		var nycNeighborhoods = topojson.feature(nyc, nyc.objects["nyc-neighborhoods"]),
			manhattanNeighborhoods = topojson.feature(manhattan, manhattan.objects.manhattan).features;
			
		//add NYC to map
		var nyc = map.append("path")
			.datum(nycNeighborhoods)
			.attr("class", "nyc")
			.attr("d", path);
			
		var manhattan = map.selectAll(".manhattan")
			.data(manhattanNeighborhoods)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "manhattan " + d.properties.ntaName;
			})
			.attr("d",path);
			
			//join csv data to GeoJSON enumeration units
		manhattan = joinData(manhattan, csvData);

		//Module 3, Ex. 1.4, Create color scale
		//var colorScale = makeColorScale(csvData);

		//add enumeration units to the map
		setEnumerationUnits(manhattan, map, path);
	};
}; //end of setMap()

function setGraticule(map, path){
	//create graticule generator
	var graticule = d3.geoGraticule()
		.step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule

	//create graticule lines	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) 
	  	.enter() 
		.append("path") 
		.attr("class", "gratLines") 
		.attr("d", path); 
};

function joinData (manhattan, csvData){
	//Loop through csv to assign each set of csv attribute vals to geojson region
	for (var i=0; i<csvData.length; i++){
		var csvName = csvData[i];//current region
		var csvKey = csvName.ntaName;//SOMETHING IS WRONG HERE
		
		//Loop through geojson areas to find correct one
		for (var a=0; a<manhattan.length; a++){
			
			var geojsonProps = manhattan[a].properties;//current properties
			var geojsonKey = geojsonProps.ntaName//geojson primary key
			
			//transfer csv data where keys match
			if (geojsonKey == csvKey){
				//assign all attributes and values
				attrArray.forEach(function(attr){
					var val = parseFloat(csvName[attr]);//get csv att value
					geojsonProps[attr] = val;//assign attribute value to geojson props
				});
			};
		};
	};
	return manhattan;
};

//Module 3, Ex. 1.4, Create QUANTILE color scale
function makeColorScale(data){
	var colorClasses = [
		"#D4B9DA",
		"#C994C7",
		"#DF65B0",
		"#DD1C77",
		"#980043",
	];
	
	//create color scale generator
	var colorScale = d3.scaleQuantile()
		.range(colorClasses);
	
	//build array of all values of expressed attribute
	var domainArray = [];
	for (var i=0; i<data.length; i++){
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);
	};
	//assign array of expressed values as scale domain
	colorScale.domain(domainArray);
	
	return colorScale;
};

//Ex. 1.3, setting enumeration units
//Ex. 1.7, Coloring enumeration units
function setEnumerationUnits(manhattan, map, path, colorScale){

	//add Manhattan NTAs to map
	var NTA = map.selectAll(".nta")
		.data(manhattan)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "NTA " + d.properties.ntaName;
		})
		.attr("d", path)
		.style("fill", function(d){
			return colorScale(d.properties,[expressed]);
		});

/* 	//add style descriptor to each path
	var desc = NTA.append("desc")
		.text('{"stroke": "#000", "stroke-width": "0.5px"}'); */
};

//Ex. 1.8, choropleth helper function
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//Ex 2.1, create bar chart
function setChart (csvData, colorScale){
	//chart frame dimensions
	var chartWidth = window.innerWidth * 0.425,
		chartHeight = 473;
		leftPadding = 25,
		rightPadding = 2,
		topBottomPaddint = 5,
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottomPadding * 2,
		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
	
	//create second svg element for bar chart
	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");
		
	//create background
	var chartBackground = chart.append("rect")
		.attr("class", "chartBackground")
		.attr("width", chartInnerWidth)
		.attr("height", chartInnerHeight)
		.attr("transform", translate);
	
	//set y scale for proportional bars
	var yScale = d3.scaleLinear()
		.range([463, 0])
		.domain([0, 100]); //CHANGE TO MIN/MAX VALUES FROM YOUR DATA!
	
	//set bars for each NTA
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return "bars " + d.ntaName;
		})
		.attr("class", function(d){
			return "bar " + d.ntaName;
		})
		.attr("width", chartWidth / csvData.length - 1)
		.attr("x", function(d, i){
			return i * (chartWidth / csvData.length);
		})
		.attr("height", function(d){
			return chartHeight - yScale(parseFloat(d[expressed]));
		});
	
	//Ex. 2.10, Add chart title
	var chartTitle = chart.append("text")
		.attr("x", 20)
		.attr("y", 40)
		.attr("class", "chartTitle")
		.text("Number of Variable " + expressed[3] + " in each NTA");
};

})();//last line of main.js


/* For Module 10:
Making map responsive
Transitions make better visual effects (D3 Transition method)
Adding mouseover effects (call 'highlight' function to change style of existing region, 'dehighlight' pulls that effect)
Dynamic labels show att value of region (labels are easy to create, label follows mouse w dynamic retrieval)
^ last part of tutorial
**Scale of attributes may vary from attribute to attribute (bars might exceed chart area), we want it to dynamically fit
	- When creating y scale, pick one that works for the first value
	- Add min/max to changeAttribute function... change y scale upon selection of a new attribute */
