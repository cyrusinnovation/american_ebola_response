function EbolaChart() {
	this.width = parseInt(d3.select('#ebola_chart').style('width')),
		this.mapAspectRatio = 0.55,
		this.height = this.width * this.mapAspectRatio;

	this.scale_x_offset = 38;
	this.scale_y_offset = 18;
	this.scale_length = this.width - this.scale_x_offset * 2;
	this.axis_height = this.scale_y_offset * 1.25;
	this.total_height = this.height + this.axis_height;

	this.label_offsets = { 
			Guinea: {x: 0.055, y: 0.045},
			Liberia: {x: 0.025, y: -0.08},
			Spain: {x: 0.03, y: 0.0475},
			Senegal: {x: 0.025, y: 0.095},
			Nigeria: {x: 0.01, y: -0.105},
			Mali: {x: -0.065, y: -0.025}
		};
	this.label_offsets['Sierra Leone'] = {x: 0.04, y: -0.0225};
	this.label_offsets['United States'] = {x: 0.09, y: -0.0175};

	this.label_minimum_pixel_offsets = {
		Guinea: {x: 45, y: 19},
		Liberia: {x: 20.8, y: -34.5},
		Spain: {x: 22.4, y: 18.4},
		Senegal: {x: 20.5, y: 40.5},
		Nigeria: {x: 8.3, y: -45.4},
		Mali: {x: 0, y: 0}
	};
	this.label_minimum_pixel_offsets['Sierra Leone'] = {x: 32.7, y: -9.6};
	this.label_minimum_pixel_offsets['United States'] = {x: 0, y: 0};

	this.pointer_offset_pixels = 4;
	this.text_height_pixels = 10;

	this.projection_height_ratio = 1.53
	this.projection = d3.geo.mercator()
	    .scale((this.width + 1) / 2 / Math.PI)
	    .translate([this.width / 2, this.height / this.projection_height_ratio])
	    .precision(.1);

	this.path = d3.geo.path()
	    .projection(this.projection);

	this.svg = d3.select("#ebola_chart").append("svg")
	    .attr("width", this.width)
	    .attr("height", this.total_height);

	this.intensity_colors = [d3.rgb(222,235,247), d3.rgb(198,219,239), d3.rgb(158,202,225),
		d3.rgb(107,174,214), d3.rgb(66,146,198), d3.rgb(33,113,181), d3.rgb(8,81,156), d3.rgb(8,48,107)];
	var intensity_colors = this.intensity_colors;

	this.quantize = d3.scale
		.quantize()
	    .domain([0, 1.0])
	    .range(d3.range(this.intensity_colors.length).map(function(i) { return intensity_colors[i]; }));

	this.us_country_code = 840;
	this.country_map = null;
	this.search_data = null
	this.world_data = null;
	this.outbreak_data = null;
	this.dates_of_interest = [];
	this.centroids_by_id = {};
	this.time_scale = null;
	this.xAxis = null;
	this.poi_Axis = null;
	this.current_axis = null;
	this.infection_lookups = [];
	this.current_news = null;
	this.current_date_format = d3.time.format('%b %d, %Y')
	this.parse_date_format = d3.time.format("%Y-%m-%d");
	this.hover_tooltip = d3.select('div.tooltip');
	this.hover_country = null;

	this.search_data_for_country = function(country_code, index) {
		return this.search_data[index][country_code];
	}

	this.search_intensity = function(country_code, index) {
		intensity = this.search_data_for_country(country_code, index);
		return Math.round((intensity == undefined ? 0 : intensity) * 100);
	}

	this.is_country_infected = function (country_code, index) {
		return this.infection_lookups[index][country_code];
	}

	this.infection_added_color = function(country_code, index) {
		return this.is_country_infected(country_code, index) ? d3.rgb(110, 0, 0) : d3.rgb(0,0,0);
	}

	this.color_for_country = function(country_code, index) {
		result = this.search_data_for_country(country_code, index);
		return (result === undefined) ? this.intensity_colors[0] : this.quantize(result);
	}

	this.country_name = function(country_code) {
		return this.country_map.countries[country_code];
	}

	this.text_date_at = function(date_index) {
		return this.search_data[date_index].Date
	}

	this.build_dates_of_interest = function() {
		var self = this;
		this.search_data.forEach(function (d) {
			self.dates_of_interest.push(self.parse_date_format.parse(d.Date));
		});

		this.time_scale = d3.time.scale()
			.domain(this.date_of_interest_range())
			.range([0, this.scale_length]);
	}

	this.date_of_interest_range = function() {
		return [this.dates_of_interest[0], this.dates_of_interest[this.dates_of_interest.length - 1]];
	}

	this.build_infection_lookups = function() {
		var self = this;
		this.infection_lookups = [];
		this.search_data.forEach(function (d, i) {
			text_date = self.text_date_at(i);

			var infected_countries = {};
			self.outbreak_data_for(text_date).forEach(function(d) {
				infected_countries[d.code] = true;
			});
			self.infection_lookups.push(infected_countries);
		});
	}

	this.build_map = function(error, country_mapping, world, ebola_search_data, ebola_outbreak_data) {
		if (error != null) { console.log(error) }
		this.country_map = country_mapping;
		this.search_data = ebola_search_data;
		this.world_data = world;
		this.outbreak_data = ebola_outbreak_data
		this.build_dates_of_interest();
		this.build_infection_lookups();
		var self = this;

		this.svg.selectAll(".country")
			.data(topojson.feature(world, world.objects.countries).features)
			.enter()
				.append("path")
				.attr("class", "country")
				.each(function(d) { self.calculate_centroid(d); })
				.style("fill", function(d) { return self.color_for_country(d.id, 0); })
				.attr("id", function(d) { return self.country_name(d.id); }, true)
				.attr("d", self.path)
				.on(hover_enter_event_name(), function(d) { self.country_mouseover(d); })
				.on(hover_exit_event_name(), function(d) { self.country_mouseout(d); });

		this.draw_time_scale();
		if (Infograph.animating) {
			this.animate_map();
		}
		else {
			// this.set_current_date(63);
			this.set_current_date(0);
			this.update_map(Infograph.current_date_index);
		}
		this.resize();
	}
	

	this.country_mouseover = function(country) {
		this.set_country_text(country.id)
		bounding_box = this.hover_tooltip.node().getBoundingClientRect();

		var element = document.getElementById("ebola_chart")
		var pos = d3.mouse(element);

		this.hover_tooltip
			.style('left', (pos[0] - bounding_box.width * 0.5) + 'px')
			.style('top', (pos[1] - bounding_box.height - 2) + 'px')
			.transition().duration(300)
			.style('opacity', 1);
		this.hover_country = country.id;
	}

	this.country_mouseout = function(country) {
		this.hover_tooltip
			.transition().duration(300)
			.style('opacity', 0);
		this.hover_country = null;
	}

	this.set_country_text = function(country_code) {
		if (country_code == null) { return; }
		intensity = this.search_intensity(country_code, Infograph.current_date_index)
		country = this.country_name(country_code);

		d3.select('.tooltip-country').html('Country: ' + country);
		d3.select('.tooltip-search-intensity').html('Search activity: ' + intensity);
	}

	this.calculate_centroid = function(geometry) {
		centroid = this.path.centroid(geometry); 
		this.centroids_by_id[geometry.id] = { x: centroid[0], y: centroid[1] };
		if (geometry.id == this.us_country_code) {
			// Special case for US because Alaska messes up the centroid. Not sure
			// how to separately calculate case for multipolygon
			bb = this.path.bounds(geometry);
			this.centroids_by_id[geometry.id] = { x: centroid[0] + bb[1][0] * 0.175, y: centroid[1] + bb[1][1] * 0.175 }
		}
	}

	this.add_legend = function() {
		var legend_width = this.width * 0.15
		var legend = d3.select('#legend')
			.style('width', legend_width + 'px')
			.style('right', 2 + '%')
			.style('top', 7 + 'px');

		var legend_list = legend.append('ul')
				.attr('class', 'list-inline');

		var keys = legend_list.selectAll('li.key')
			.data(this.quantize.range())
			.enter().append('li')
			.attr('class', 'key')
			.style('border-top-color', String);
	}

	this.axis_position = function() { return "translate(" + this.scale_x_offset + "," + (this.total_height - this.scale_y_offset) + ")" }

	this.draw_time_scale = function() {
		var self = this;
		this.xAxis = d3.svg.axis()
		    .orient("bottom")
		    .scale(this.time_scale);

		this.svg.append('g')
			.attr('class', 'time_axis')
			.attr('transform', self.axis_position())
			.call(self.xAxis);

		this.poi_Axis = d3.svg.axis()
			.orient('top')
			.scale(self.time_scale)
			.tickSize(5)
			.tickValues(self.dates_of_interest)
			.tickFormat(function(d) { return ''; });

		this.svg.append('g')
			.attr('class', 'poi_axis')
			.attr('transform', self.axis_position())
			.call(self.poi_Axis)

		this.set_date(0);
	}

	this.set_date = function(date_index) {
		current_date = this.dates_of_interest[date_index];
		d3.select('.current_axis').remove();
		this.current_axis = d3.svg.axis()
			.orient('top')
			.scale(this.time_scale)
			.tickSize(12)
			.tickValues([ current_date ])
			.tickFormat(function(d) { return '' });

		tracker_axis = this.svg.append('g')
			.attr('class', 'current_axis')
			.attr('transform', this.axis_position())
			.call(this.current_axis);

		this.update_tracker_totals(date_index, current_date, tracker_axis);
	}

	this.update_tracker_totals = function(date_index, current_date, tracker_axis) {
		var self = this;
		tracker_tick = tracker_axis.select('.tick');
		var outbreak_sum = this.global_outbreak_sum(date_index)
		
		tracker_div = d3.select('.global_tracker');
		tracker_div.select('.tracker_date').html(self.current_date_format(current_date))
		tracker_div.select('.tracker_cases').html('Cases: ' + self.number_with_commas(outbreak_sum.cases))
		tracker_div.select('.tracker_deaths').html('Deaths: ' + self.number_with_commas(outbreak_sum.deaths))

		var pos = this.tracker_position(tracker_axis, tracker_tick, tracker_div);
		tracker_div.style('left', pos.x + 'px');
		tracker_div.style('top', pos.y + 'px');	
	}

	this.parse_translate = function(translate_attr) {
		var splitBraces = translate_attr.split('(');
	    splitBraces = splitBraces[1].split(')');
	    var splitComma = splitBraces[0].split(',');
		return { x: parseFloat(splitComma[0]), y: parseFloat(splitComma[1]) };	
	}

	this.tracker_position = function(tracker_axis, tracker_tick, tracker_div) {
		var p_axis = this.parse_translate(tracker_axis.attr('transform'));
		var p_tick = this.parse_translate(tracker_tick.attr('transform'));
		var bounding_box = tracker_div.node().getBoundingClientRect();

	    return { x: p_axis.x + p_tick.x - bounding_box.width * 0.5, y: p_axis.y + p_tick.y - 46 };
	}

	this.global_outbreak_sum = function(date_index) {
		var outbreaks = this.outbreak_data_for(this.text_date_at(date_index))
		var cases = 0;
		var deaths = 0;
		outbreaks.forEach(function(outbreak) { 
			cases += +outbreak.cases;
			deaths += +outbreak.deaths;
		});

		return { cases: cases, deaths: deaths};
	}

	this.choropleth_map = function(date_index) {
		var self = this;
		this.svg.selectAll(".country").transition()
			.duration(250)
			.style("fill", function(d) { return self.color_for_country(d.id, date_index); })
	}

	this.outbreak_data_for = function(text_date) {
		return this.outbreak_data[text_date].outbreak;
	}

	this.news_data_for = function(text_date) {
		return this.outbreak_data[text_date].news;
	}

	this.closer_to_center = function(center_y, y1, y2) { return (Math.abs(y1 - center_y) <= Math.abs(y2 - center_y)) ? y2 : y1; }
	this.further_from_center = function(center_y, y1, y2) { return (Math.abs(y1 - center_y) <= Math.abs(y2 - center_y)) ? y1 : y2; }
	this.label_bottom = function(y_position) { return y_position + this.text_height_pixels * 0.25; }
	this.label_top = function(y_position) { return y_position - this.text_height_pixels * 2.75; }

	this.pointer_x_pos = function(outbreak_datum) {
		var x_offset = this.offset_for(outbreak_datum.code).x;
		var direction = (x_offset >= 0 ? 1.0 : -1.0)
		return outbreak_datum.pos_x + this.pointer_offset_pixels * direction;
	}

	this.calculate_pointer_end = function(outbreak_datum) {
		closer = this.closer_to_center(outbreak_datum.center.y, this.label_bottom(outbreak_datum.pos_y), this.label_top(outbreak_datum.pos_y))
		return {x: this.pointer_x_pos(outbreak_datum), y: closer};
	}

	this.calculate_pointer_mid = function(outbreak_datum) {
		further = this.further_from_center(outbreak_datum.center.y, this.label_bottom(outbreak_datum.pos_y), this.label_top(outbreak_datum.pos_y))
		return {x: this.pointer_x_pos(outbreak_datum), y: further};
	}

	this.position_for_country = function(country_code) {
		return this.centroids_by_id[country_code]
	}

	this.country_offset_px = function(country_name) {
		offset = this.label_offsets[country_name];
		return {x: offset.x * this.width, y: offset.y * this.height};
	}

	this.vector_length_squared = function(vector) {
		return (vector.x * vector.x) + (vector.y * vector.y);
	}

	this.pixel_offset = function(country) {
		var offset = this.label_offsets[country];
		return {x: offset.x * this.width, y: offset.y * this.height};
	}

	this.offset_for = function(country_code) {
		var country = this.country_name(country_code);
		var calculated_offset = this.pixel_offset(country);
		var min_pixel_offset = this.label_minimum_pixel_offsets[country];
		var offset = (this.vector_length_squared(calculated_offset) < this.vector_length_squared(min_pixel_offset)) ?
			min_pixel_offset : calculated_offset;

		return {x: offset.x, y: offset.y};
	}

	this.text_pos_for_country = function(country_code) {
		var offset = this.offset_for(country_code)
		pos = this.centroids_by_id[country_code]
		return  {x: pos.x - offset.x, y: pos.y - offset.y};
	}

	this.draw_labels = function(text_date) {
		var self = this;
		this.svg.selectAll('.country_label').remove();

		text = this.svg.selectAll('.country_label').data(this.outbreak_data_for(text_date));

		text.enter()
			.append("text")
			.attr("x", function(d) { 
				d.center = self.position_for_country(d.code);
				d.pos_x = self.text_pos_for_country(d.code).x; 
				return d.pos_x;
			})
			.attr("y", function(d) { 
				d.pos_y = self.text_pos_for_country(d.code).y; 
				return d.pos_y;
			})
			.attr("class", "country_label")
			.style('text-anchor', function(d) { return self.text_anchor_for_offset(self.offset_for(d.code).x); })
			.each(function(d) {
				d.pointer_end = self.calculate_pointer_end(d);
				d.pointer_mid = self.calculate_pointer_mid(d);
			});

		this.add_text_for_labels(text);
		this.add_pointer_for_labels(text, text_date);
	}

	this.text_anchor_for_offset = function(x_offset) {
		return (x_offset < 0) ? 'start' : 'end';
	}

	this.add_text_label = function(text, label_function, offset_index) {
		var self = this;
		text.append("tspan").attr('x', function(d) { return d.pos_x; })
			.attr('y', function(d) { return d.pos_y - self.text_height_pixels * offset_index; })
			.text(label_function);
	}

	this.add_text_for_labels = function(text) {
		var self = this;
		text.each (function() {
			text = d3.select(this);
			self.add_text_label(text, function(d) { return "Deaths: " + self.number_with_commas(d.deaths); }, 0 );
			self.add_text_label(text, function(d) { return "Cases: " + self.number_with_commas(d.cases); }, 1 );
			self.add_text_label(text, function(d) { return self.country_name(d.code); }, 2 );
		});	
	}

	this.add_pointer_for_labels = function(text, text_date) {
		this.svg.selectAll('.country_pointer').remove();
		this.svg.selectAll('.country_pointer').data(this.outbreak_data_for(text_date))
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

	this.outbreak_index = function(outbreak_search_data, country_code) {
		for (var i = 0; i < outbreak_search_data.length; i++) {
			if (outbreak_search_data[i].code == country_code) return i;
		}
		return -1;
	} 

	this.infected_geometry_collector_for = function(text_date) {
		var self = this;
		current_outbreak_data = this.outbreak_data_for(text_date).outbreak;
		geometries = this.world_data.objects.countries.geometries.filter(function(d) {
			return self.outbreak_index(current_outbreak_data, d.id) != -1;
		});
		return { type: 'GeometryCollection', bbox: this.world_data.objects.countries.bbox, geometries: geometries };
	}

	this.update_map = function(current_date_index) {
		this.set_date(current_date_index);
		this.choropleth_map(current_date_index);
		this.draw_labels(this.text_date_at(current_date_index));
		this.update_headlines(current_date_index);
		this.set_country_text(this.hover_country);
	}

	this.on_last_search_date = function() {
		return Infograph.current_date_index == this.search_data.length - 1;
	}

	this.animate_map = function() {
		if (this.on_last_search_date()) {
			Infograph.current_date_index = 0;		
		}

		var self = this;
		Infograph.intervalId = setInterval(function() {
			self.update_map(Infograph.current_date_index);
			if (self.on_last_search_date()) {
				Infograph.animation_controls.pause_animation();
			}
			else {
				self.increment_current_date(1);
			}
		}, 250)
	}

	this.update_headlines = function(current_date_index) {
		var current_date = this.text_date_at(current_date_index);
		var news = this.news_data_for(current_date);
		this.clear_outbreak_news(current_date, news);

		if (news != null) {
			this.set_outbreak_news(news);
		}
	}

	this.set_outbreak_news = function(news) {
		this.current_news = news;
		this.draw_news(news);
	}

	this.draw_news = function(news) {
		var self = this;
		this.remove_news_articles();

		headlines = d3.select('.headlines');
		articles = headlines.selectAll('.article').data([news])
			.enter()
			.append('div')
			.attr('class', 'article')
			.each(function(d, i) {
				article = d3.select(this)
				self.add_article_data(article, d, i);
			});
	}

	this.add_article_data = function(article, article_data, article_index) {
		article.append('div')
			.attr('class', 'article-caret')
			.append('i')
			.attr('class', 'fa fa-caret-right fa-sm')

		var article_content = article.append('div')
			.attr('class', 'article-content')

		article_content.append('span')
			.attr('class', 'article-source')
			.html(article_data.source);
		article_content.append('span')
			.attr('class', 'article-date')
			.html(' ' + this.current_date_format(this.parse_date_format.parse(article_data.date)));
		article_content.append('div')
			.attr('class', 'article-headline')
			.append('a')
			.attr(':href', article_data.url)
			.attr('target', '_blank')
			.html(article_data.title);

		this.set_headline_size(article, article_content);
		this.position_news(article, article_index);
	}

	this.set_headline_size = function(article, article_content) {
		var article_width = (this.width * 0.25)
		var data_width = 17;
		article.style('width', article_width + 'px')
		article_content.style('width', (article_width - data_width) + 'px')
	}

	this.position_news = function(article, article_index) {
		article.style('left', (this.width * 0.02) + 'px');
		var articleHeight = parseInt(article.style('height'));
		article.style('bottom', (47 + this.axis_height) + 'px');
	}

	this.remove_news_articles = function() { d3.selectAll('.article').remove(); }

	this.clear_outbreak_news = function(current_date, replacement_news) {
		if (this.current_news == null) { return; }
		
		if (replacement_news == null) {
			if (current_date == this.text_date_at(0)) {
				this.remove_news_articles();
				this.current_news = null;
			}
		}
		else {
			this.current_news = null;
		}
	}

	this.set_current_date = function(date_index) {
		Infograph.current_date_index = date_index % this.search_data.length;
		if (Infograph.current_date_index < 0) {
			Infograph.current_date_index = this.search_data.length - 1;
		}
	}

	this.increment_current_date = function(increment) {
		this.set_current_date(Infograph.current_date_index + increment);
	}

	this.number_with_commas = function(number_to_format) {
	    return number_to_format.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	this.resize = function() {
		if (this.time_scale == null) { return; }
		var self = this;

	    // adjust things when the window size changes
	    this.width = parseInt(d3.select('#ebola_chart').style('width'));
	    this.height = this.width * this.mapAspectRatio;

	    this.scale_length = this.width - this.scale_x_offset * 2;
		axis_height = this.scale_y_offset * 1.25;
		this.total_height = this.height + axis_height;

	    // update projection
	    this.projection
	        .translate([this.width / 2, this.height / this.projection_height_ratio])
	        .scale((this.width + 1) / 2 / Math.PI);

	    // resize the map container
	    this.svg.attr('width', this.width + 'px')
	    	.attr('height', this.total_height + 'px');

	    // Update the time axes
		this.time_scale.range([0, this.scale_length]);
		this.svg.select('.time_axis')
			.attr('transform', this.axis_position())
			.call(this.xAxis);

		this.svg.select('.poi_axis')
			.attr('transform', this.axis_position())
			.call(this.poi_Axis);

		this.svg.select('.current_axis')
			.attr('transform', this.axis_position())
			.call(this.current_axis);

	    // resize the map
	    this.svg.selectAll('.country').attr('d', this.path);

	    d3.select('ul.list-inline').remove();
	    this.add_legend();
	    this.set_date(Infograph.current_date_index);

	    // Redraw the labels
	    this.svg.selectAll(".country").each(function(d) { self.calculate_centroid(d); });
	    this.draw_labels(this.text_date_at(Infograph.current_date_index));

	    this.update_headlines(Infograph.current_date_index);
	}

	var queued_self = this;
	this.add_legend();
	queue()
		.defer(d3.json, 'data/country_mapping.json')
		.defer(d3.json, 'data/world-110m.json')
		.defer(d3.csv, 'data/ebola_results.csv')
		.defer(d3.json, 'data/outbreak_data.json')
		.await(function(error, country_mapping, world_data, ebola_results, outbreak_data) {
			queued_self.build_map(error, country_mapping, world_data, ebola_results, outbreak_data);
		})
	d3.select(window).on('resize.ebola_chart', function(d) { Infograph.ebola_chart.resize(); });
}

Infograph.ebola_chart = new EbolaChart();
Infograph.animation_controls = new AnimationControls(Infograph.ebola_chart)
;
