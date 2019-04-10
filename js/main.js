/*Megan Roessler, Geography 575*/

//Example 1.3, using Promise.all
window.onload = setMap();
//function to set up map
function setMap(){
	
	//Example 2.1, creating a projection
	var width = 750,
		height = 460;
		
	//2.1, create SVG container
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);
		
	//2.1, create Albers equal area conic projection for New York
	var projection = d3.geoAlbers()
		.center([7.27, 40.87])
		.rotate([81.00, -0.91, 0])
		.parallels([29.5, 45.5])
		.scale(5000.00)
		.translate([width / 2, height / 2]);
	
	//Example 2.2, creating a path generator
	var path = d3.geoPath()
		.projection(projection);
		
	var promises = [];
	promises.push(d3.csv("data/nypl-data.csv")); //load attribute data from csv
	promises.push(d3.json("data/nyc-neighborhoods.topojson"));//load NYC neighborhoods
	Promise.all(promises).then(callback);
	
	//Example 1.4, callback to setMap()
	function callback(data){
		csvData = data[0];
		nyc = data[1];
		//console.log(nyc)

		//Example 1.5, convert TopoJSON to GeoJSON
		var nycNeighborhoods = topojson.feature (nyc, nyc.objects.nycNeighborhoods).features;
		
		//Example 2.3, draw geometries
		//add Manhattan
		var nyc = map.append("path")
			.datum(nyc)
			//.enter()
			.attr("class", function(d){
				return "nycNeighborhoods " + d.properties.nta-name;
			})
			.attr("d", path);
			
		//Example 2.5, draw graticule
		var graticule = d3.geoGraticule()
			.step([5, 5]);//Set graticule lines to 5 degrees lat lon
		var gratLines = map.selectAll(".gratLines") //select elements that will be created
			.data(graticule.lines()) //bind graticule lines to element
			.enter()//create element for each datum
			.append("path") //append each element to svg
			.attr("class", "gratLines")//assign class for styling
			.attr("d", path);//project graticule lines
	};
	
};