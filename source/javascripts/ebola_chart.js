// var width = 1200,
//     height = 625;
var width = 960,
    height = 500;

var scale_x_offset = 30;
var scale_y_offset = 18;
var scale_length = width - scale_x_offset * 2;
var axis_height = scale_y_offset * 1.25;
var total_height = height + axis_height;

var label_offsets = {Guinea: {x: 0.055, y: 0.045},
		Liberia: {x: 0.025, y: -0.08},
		Spain: {x: 0.03, y: 0.0275},
		Senegal: {x: 0.025, y: 0.095},
		Nigeria: {x: 0.01, y: -0.105} }
label_offsets['Sierra Leone'] = {x: 0.04, y: -0.0225};
label_offsets['United States'] = {x: 0.09, y: -0.0175}

var pointer_offset_pixels = 4;
var text_height_pixels = 10;

var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 1.6])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#ebola_chart").append("svg")
    .attr("width", width)
    .attr("height", total_height);

var intensity_colors = [d3.rgb(222,235,247), d3.rgb(198,219,239), d3.rgb(158,202,225),
	d3.rgb(107,174,214), d3.rgb(66,146,198), d3.rgb(33,113,181), d3.rgb(8,81,156), d3.rgb(8,48,107)];
function add_colors(rgb1, rgb2) {
	return d3.rgb(rgb1.r + rgb2.r, rgb1.g + rgb2.g, rgb1.b + rgb2.b);
}

var pow = d3.scale.pow()
	.exponent(0.75)
	.clamp(true)
    .domain([0, 1.1])
    .range([0, 1.0])

var quantize = d3.scale
	.quantize()
    .domain([0, 1.0])
    .range(d3.range(intensity_colors.length).map(function(i) { return intensity_colors[i]; }));

add_legend();
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
var dates_of_interest = [];
var centroids_by_id = {};
var time_scale = null;
var infection_lookups = [];
var current_date_format = d3.time.format('%b %d, %Y')

function search_data_for_country(country_code, index) {
	return search_data[index][country_code];
}

function is_country_infected(country_code, index) {
	return infection_lookups[index][country_code];
}

function infection_added_color(country_code, index) {
	return is_country_infected(country_code, index) ? d3.rgb(110, 0, 0) : d3.rgb(0,0,0);
}

function color_for_country(country_code, index) {
	result = search_data_for_country(country_code, index);
	return (result === undefined) ? intensity_colors[0] : quantize(result);
	// return add_colors(color, infection_added_color(country_code, index)).toString();
}

function country_name(country_code) {
	return country_map.countries[country_code];
}

function text_date_at(date_index) {
	return search_data[date_index].Date
}

function build_dates_of_interest() {
	var format = d3.time.format("%Y-%m-%d");

	search_data.forEach(function (d) {
		dates_of_interest.push(format.parse(d.Date));
	});

	time_scale = d3.time.scale()
		.domain(date_of_interest_range())
		.range([scale_x_offset, scale_length]);
}

function date_of_interest_range() {
	return [dates_of_interest[0], dates_of_interest[dates_of_interest.length - 1]];
}

function build_infection_lookups() {
	infection_lookups = [];
	search_data.forEach(function (d, i) {
		text_date = text_date_at(i);

		var infected_countries = {};
		outbreak_data_for(text_date).forEach(function(d) {
			infected_countries[d.code] = true;
		});
		infection_lookups.push(infected_countries);
	});
}

var us_country_code = 840;

function build_map(error, country_mapping, world, ebola_search_data, ebola_outbreak_data) {
	if (error != null) { console.log(error) }
	country_map = country_mapping;
	search_data = ebola_search_data;
	world_data = world;
	outbreak_data = ebola_outbreak_data
	build_dates_of_interest();
	build_infection_lookups();

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

	draw_time_scale();
	if (Infograph.animating) {
		animate_map();
	}
	else {
		// set_current_date(63);
		set_current_date(0);
		update_map(Infograph.current_date_index);
	}
}

function add_legend() {
	var legend_width = width * 0.15
	var legend = d3.select('#legend')
		.style('width', legend_width + 'px')
		.style('left', (width - legend_width) + 'px')
		.style('top', 20 + 'px');

	var legend_list = legend.append('ul')
			.attr('class', 'list-inline');

	var keys = legend_list.selectAll('li.key')
		.data(quantize.range())
		.enter().append('li')
		.attr('class', 'key')
		.style('border-top-color', String);
}

function axis_position() { return "translate(" + scale_x_offset + "," + (total_height - scale_y_offset) + ")" }

function draw_time_scale() {
	var xAxis = d3.svg.axis()
	    .orient("bottom")
	    .scale(time_scale);

	svg.append('g')
		.attr('class', 'time_axis')
		.attr('transform', axis_position())
		.call(xAxis);

	var poi_Axis = d3.svg.axis()
		.orient('top')
		.scale(time_scale)
		.tickSize(5)
		.tickValues(dates_of_interest)
		.tickFormat(function(d) { return ''; });

	svg.append('g')
		.attr('class', 'poi_axis')
		.attr('transform', axis_position())
		.call(poi_Axis)

	set_date(0);
}

function set_date(date_index) {
	current_date = dates_of_interest[date_index];
	d3.select('.current_axis').remove();
	var current_axis = d3.svg.axis()
		.orient('top')
		.scale(time_scale)
		.tickSize(12)
		.tickValues([ current_date ])
		.tickFormat(function(d) { return current_date_format(current_date); });

	svg.append('g')
		.attr('class', 'current_axis')
		.attr('transform', axis_position())
		.call(current_axis)
}

function choropleth_map(date_index) {
	svg.selectAll(".country").transition()
		.duration(250)
		.style("fill", function(d) { return color_for_country(d.id, date_index); })
}

function outbreak_data_for(text_date) {
	return outbreak_data[text_date].outbreak;
}

function closer_to_center(center_y, y1, y2) { return (Math.abs(y1 - center_y) <= Math.abs(y2 - center_y)) ? y2 : y1; }
function further_from_center(center_y, y1, y2) { return (Math.abs(y1 - center_y) <= Math.abs(y2 - center_y)) ? y1 : y2; }
function label_bottom(y_position) { return y_position + text_height_pixels * 0.25; }
function label_top(y_position) { return y_position - text_height_pixels * 2.75; }

function calculate_pointer_end(outbreak_datum) {
	closer = closer_to_center(outbreak_datum.center.y, label_bottom(outbreak_datum.pos_y), label_top(outbreak_datum.pos_y))
	return {x: outbreak_datum.pos_x + pointer_offset_pixels, y: closer};
}

function calculate_pointer_mid(outbreak_datum) {
	further = further_from_center(outbreak_datum.center.y, label_bottom(outbreak_datum.pos_y), label_top(outbreak_datum.pos_y))
	return {x: outbreak_datum.pos_x + pointer_offset_pixels, y: further};
}

function position_for_country(country_code) {
	return centroids_by_id[country_code]
}

function offset_for(country_code) {
	offset = label_offsets[country_name(country_code)]
	return {x: offset.x * width, y: offset.y * height};
}

function text_pos_for_country(country_code) {
	var offset = offset_for(country_code)
	pos = centroids_by_id[country_code]
	return  {x: pos.x - offset.x, y: pos.y - offset.y};
}

function draw_labels(text_date) {
	svg.selectAll('.country_label').remove();

	text = svg.selectAll('.country_label').data(outbreak_data_for(text_date));

	text.enter()
		.append("text")
		.attr("x", function(d) { 
			d.center = position_for_country(d.code);
			d.pos_x = text_pos_for_country(d.code).x; 
			return d.pos_x;
		})
		.attr("y", function(d) { 
			d.pos_y = text_pos_for_country(d.code).y; 
			return d.pos_y;
		})
		.attr("class", "country_label")
		.style('text-anchor', 'end')
		.each(function(d) {
			d.pointer_end = calculate_pointer_end(d);
			d.pointer_mid = calculate_pointer_mid(d);
		});

	add_text_for_labels(text);
	add_pointer_for_labels(text, text_date);
}

function add_text_label(text, label_function, offset_index) {
	text.append("tspan").attr('x', function(d) { return d.pos_x; })
		.attr('y', function(d) { return d.pos_y - text_height_pixels * offset_index; })
		.text(label_function);
}

function add_text_for_labels(text) {
	text.each (function() {
		text = d3.select(this);
		add_text_label(text, function(d) { return "Deaths: " + d.deaths; }, 0 );
		add_text_label(text, function(d) { return "Cases: " + d.cases; }, 1 );
		add_text_label(text, function(d) { return country_name(d.code); }, 2 );
	});	
}

function add_pointer_for_labels(text, text_date) {
	svg.selectAll('.country_pointer').remove();
	svg.selectAll('.country_pointer').data(outbreak_data_for(text_date))
		.enter()
		.append('path')
		.attr('class', 'country_pointer')
		.attr('d', function (d) {
			return 'M' + d.pointer_end.x + ',' + d.pointer_end.y + ' ' +
				d.pointer_mid.x + ',' + d.pointer_mid.y + ' ' +
				(d.pointer_end.x + d.pointer_mid.x) * 0.5 + ',' + (d.pointer_end.y + d.pointer_mid.y) * 0.5 + ' ' +
				d.center.x + ',' + d.center.y;
		});
}

function outbreak_index(outbreak_search_data, country_code) {
	for (var i = 0; i < outbreak_search_data.length; i++) {
		if (outbreak_search_data[i].code == country_code) return i;
	}
	return -1;
} 

function infected_geometry_collector_for(text_date) {
	current_outbreak_data = outbreak_data_for(text_date).outbreak;
	geometries = world_data.objects.countries.geometries.filter(function(d) {
		return outbreak_index(current_outbreak_data, d.id) != -1;
	});
	return { type: 'GeometryCollection', bbox: world_data.objects.countries.bbox, geometries: geometries };
}

// function outline_infected_countries(text_date) {
// 	svg.selectAll('.infected_outline').remove();
	
// 	svg.selectAll('.infected_outline')
// 		.data(topojson.feature(world_data, infected_geometry_collector_for(text_date)).features)
// 		.enter()
// 		.append('path')
// 		.attr('class', 'infected_outline')
// 		.attr("d", path)
// }

function update_map(current_date_index) {
	set_date(current_date_index);
	choropleth_map(current_date_index);
	// outline_infected_countries(text_date_at(current_date_index));
	draw_labels(text_date_at(current_date_index))
}

function animate_map() {
	Infograph.intervalId = setInterval(function() {
		update_map(Infograph.current_date_index);
		increment_current_date(1);
		if (Infograph.current_date_index == 0) {
			pause_animation();
		}		
	}, 250)
}

function set_current_date(date_index) {
	Infograph.current_date_index = date_index % search_data.length;
	if (Infograph.current_date_index < 0) {
		Infograph.current_date_index = search_data.length - 1;
	}
}

function increment_current_date(increment) {
	set_current_date(Infograph.current_date_index + increment);
}

d3.select(self.frameElement).style("height", height + "px");