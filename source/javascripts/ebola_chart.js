var width = 1200,
    height = 650;

var offsets = {Guinea: {x: 0.15, y: -0.1},
		Liberia: {x: 0.15, y: 0.1},
		Spain: {x: 0.15, y: -0.15},
		Senegal: {x: 0.15, y: -0.15},
		Nigeria: {x: 0.15, y: 0.15} }
offsets['Sierra Leone'] = {x: 0.15, y: 0};
offsets['United States'] = {x: 0.15, y: 0}

var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 1.55])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var intensity_colors = ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)',
	'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)'];

var pow = d3.scale.pow()
	.exponent(0.75)
	.clamp(true)
    .domain([0, 1.1])
    .range([0, 1.0])

var quantize = d3.scale
	.quantize()
    .domain([0, 1.0])
    .range(d3.range(9).map(function(i) { return intensity_colors[i]; }));

svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

queue()
	.defer(d3.json, 'data/country_mapping.json')
	.defer(d3.json, 'data/world-110m.json')
	.defer(d3.csv, 'data/ebola_results.csv')
	.defer(d3.json, 'data/outbreak_data.json')
	.await(build_map)

var country_map = null;
var search_data = null
var world_data = null;
var outbreak_data = null;
var centroids_by_id = {};

function search_data_for_country(country_code, index) {
	return search_data[index][country_code];
}

function color_for_country(country_code, index) {
	result = search_data_for_country(country_code, index);
	return (result === undefined) ? intensity_colors[0] : quantize(pow(result));
}

function country_name(country_code) {
	return country_map.countries[country_code];
}

function text_date_at(date_index) {
	return search_data[date_index].Date
}

var us_country_code = 840;

function build_map(error, country_mapping, world, ebola_search_data, ebola_outbreak_data) {
	if (error != null) { console.log(error) }
	country_map = country_mapping;
	search_data = ebola_search_data;
	world_data = world;
	outbreak_data = ebola_outbreak_data

	svg.insert("path", ".graticule")
		.datum(topojson.feature(world, world.objects.land))
		.attr("class", "land")
		.attr("d", path);

	svg.selectAll(".country")
		.data(topojson.feature(world, world.objects.countries).features)
		.enter()
			.append("path")
			.attr("class", "country")
			.each(function(d) { 
				centroid = path.centroid(d); centroids_by_id[d.id] = { x: centroid[0], y: centroid[1] };
				if (d.id == us_country_code) {
					// Special case for US because Alaska messes up the centroid. Not sure
					// how to separately calculate case for multipolygon
					bb = path.bounds(d);
					centroids_by_id[d.id] = { x: centroid[0] + bb[1][0] * 0.175, y: centroid[1] + bb[1][1] * 0.175 }
				}
			})
			.style("fill", function(d) { return color_for_country(d.id, 0); })
			.attr("id", function(d) { return country_name(d.id); }, true)
			.attr("d", path)

	svg.append("text")
		.attr("id", 'current-date')
		.attr("x", width / 2)
		.attr("y", height - 20)
		.style("font-size", "1.333em")
		.style("fill", intensity_colors[7])
		.style("text-anchor", "middle")
		.text(text_date_at(0));

	// draw_labels(text_date_at(60));
	animate_map();
}

function choropleth_map(date_index) {
	svg.selectAll(".country").transition()
		.duration(250)
		.style("fill", function(d) { return color_for_country(d.id, date_index); })
}

function set_date(date_index) {
	svg.select('#current-date')
		.text(text_date_at(date_index));
}

function outbreak_data_for(text_date) {
	return outbreak_data[text_date]
}

function position_for_country(country_code) {
	return centroids_by_id[country_code]
}

function offset_for(country_code) {
	offset = offsets[country_name(country_code)]
	return {x: offset.x * width, y: offset.y * height};
}

function text_pos_for_country(country_code) {
	var offset = offset_for(country_code)
	pos = centroids_by_id[country_code]
	return  {x: pos.x - offset[0], y: pos.y - offset[1]};
}

function draw_labels(text_date) {
	svg.selectAll('.country_label').remove();
	svg.selectAll('.country_pointer').remove();

	text = svg.selectAll('.country_label').data(outbreak_data_for(text_date));

	text.enter()
		.append("text")
		.attr("x", function(d) { return text_pos_for_country(d.code).x; })
		.attr("y", function(d) { return text_pos_for_country(d.code).y; })
		.attr("class", "country_label")
		.style('text-anchor', 'end')

	text.each (function() {
		text = d3.select(this);
		pos = text_pos_for_country(d.code)
		text
			.append("tspan")
			.attr('x', function(d) { return pos.x; })
			.attr('y', function(d) { return pos.y; })
			.text(function(d) { return "Deaths: " + d.deaths; });

		text
			.append("tspan")
			.attr('x', function(d) { return pos.x; })
			.attr('y', function(d) { return pos.y - 11; })
			.text(function(d) { return "Cases: " + d.cases; })		

		text
			.append("tspan")
			.attr('x', function(d) { return pos.x; })
			.attr('y', function(d) { return pos.y - 22; })
			.text(function(d) { return country_name(d.code); })		
	})
}

function animate_map() {
	var current_date_index = 1;
	timer = setInterval(function() {
		set_date(current_date_index);
		choropleth_map(current_date_index);
		draw_labels(text_date_at(current_date_index))
		current_date_index = (current_date_index + 1) % search_data.length;
	}, 250)
}

d3.select(self.frameElement).style("height", height + "px");