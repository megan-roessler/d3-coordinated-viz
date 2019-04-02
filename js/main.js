/*Megan Roessler, Geography 575*/

//Example 1.3, using Promise.all
window.onload = setMap();
//function to set up map
function setMap(){
	
	//Example 2.1, creating a projection
	var width = 960,
		height = 460;
		
	//2.1, create SVG container
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);
		
	//2.1, create Albers equal area conic projection for France
	var projection = d3.geoAlbers()
		.center([0, 46.2])
		.rotate([-2, 0])
		.parallels([43, 62])
		.scale(2500)
		.translate([width / 2, height / 2]);
	
	//Example 2.2, creating a path generator
	var path = d3.geoPath()
		.projection(projection);
		
	var promises = [];
	promises.push(d3.csv("data/unitsData.csv")); //load attribute data from csv
	promises.push(d3.json("data/EuropeCountries.topojson")); //load background spatial data
	promises.push(d3.json("data/FranceRegions.topojson")); //load spatial data for choropleth
	//promises.push(d3.json("data/nyc-neighborhoods.topojson"));//load NYC neighborhoods
	Promise.all(promises).then(callback);
	
	//Example 1.4, callback to setMap()
	function callback(data){
		csvData = data[0];
		europe = data[1];
		france = data[2];
		//nyc = data[2]
		console.log(csvData);
		console.log(europe);
		//console.log(france);
		
		//Example 1.5, convert TopoJSON to GeoJSON
		var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
			franceRegions = topojson.feature(france, france.objects.FranceRegions).features;
			//view results
			console.log(europeCountries);
			console.log(franceRegions);
		//var nycNeighborhoods = topojson.feature (nyc, nyc.objects.nycNeighborhoods).features;
		
		//Example 2.3, draw geometries
		//add europe
		var countries = map.append("path")
			.datum(europeCountries)
			.attr("class", "countries")
			.attr("d", path);
		//add france
		var regions = map.selectAll(".regions")
			.data(franceRegions)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "regions " + d.properties.adm1_code;	
			})
			.attr("d", path);
			
		//Example 2.5, draw graticule
		var graticule = d3.geoGraticule()
			.step([5, 5]);//Set graticule lines to 5 degrees lat lon
		var gratLines = map.selectAll(".gratLines") //select elements that will be created
			.data(graticule.lines()) //bind graticule lines to element
			.enter()//create element for each datum
			.append("path") //append each element to svg
			.attr("class", "gratLInes")//assign class for styling
			.attr("d", path);//project graticule lines
	};
	
};