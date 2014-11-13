var LINE_CHART = {};
LINE_CHART.line_chart = function(data_file, chart_title, event_names, chart_name, override_height, options) {
  this.dates,
  this.override_height = override_height;
  this.timeFormat = d3.time.format("%Y-%m-%d"),
  this.axisFormat = d3.time.format("%m/%d"),
  this.mouseoverFormat = d3.time.format("%b %d"),
  this.focus = null,
  this.focus_title = null,
  this.focus_activity = null,
  this.all_events = Event.events.get_events(event_names);
  this.chart_id = '#' + chart_name;
  this.resizable = options.resize;
  this.force_load = options.force_load;
  this.loaded = false;
  this.tick_count = options.tick_count || 8;
  this.max_range = options.max_range;
  this.places = null;

  this.calculate_dimensions = function() {
    this.margin = {top: 20, right: 30, bottom: 30, left: 40};
    this.calc_width = parseInt(d3.select(this.chart_id).style('width'));
    this.calc_height = this.override_height ? this.override_height : this.calc_width * 3 / 5;
    this.width = this.calc_width - this.margin.left - this.margin.right;
    this.height = this.calc_height - this.margin.top - this.margin.bottom;    
  }

  this.supports_voronoi = function() {
    // return !this.resizable;
    return true;
  }

  this.setup_voronoi = function() {
    this.x_scale
        .range([0, this.width]);

    this.y_scale
        .range([this.height, 0]);

    if (this.supports_voronoi()) {
      this.voronoi = d3.geom.voronoi()
          .x(function(d) { return Infograph.line_charts[chart_name].x_scale(d.date); })
          .y(function(d) { return Infograph.line_charts[chart_name].y_scale(d.value); })
          .clipExtent([[-this.margin.left, -this.margin.top], [this.width + this.margin.right, this.height + this.margin.bottom]]);
    }

    this.line = d3.svg.line()
        .x(function(d) { return this.x_scale(d.date); })
        .y(function(d) { return this.y_scale(d.value); });        
  }

  var self = this;
  this.x_scale = d3.time.scale();
  this.y_scale = d3.scale.linear();
  this.calculate_dimensions();
  this.setup_voronoi();

  this.svg = d3.select(this.chart_id).append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .attr("class", "line_chart")
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  this.mouseover = function(d) {
    d3.select(d.place.line).classed(d.place.hover_class(), true);
    d.place.line.parentNode.appendChild(d.place.line);
    this.focus.attr("transform", "translate(" + this.x_scale(d.date) + "," + this.y_scale(d.value) + ")");

    this.focus_title.text(d.place.name + ' – ' + this.mouseoverFormat(d.date));
    this.focus_activity.text('Search activity: ' + Math.round(d.value));
  }

  this.mouseout = function(d) {
    d3.select(d.place.line).classed(d.place.hover_class(), false);
    this.focus.attr("transform", "translate(-100,-100)");
  }

  this.clear_focus = function(d) {
    this.svg.selectAll('.united-states--hover').classed('united-states--hover', false);
    this.svg.selectAll('.place--hover').classed('place--hover', false);
    this.focus.attr("transform", "translate(-100,-100)");
  }

  this.event_dates = function() {
    var self = this;
    return this.all_events.map(function(e) { return self.timeFormat.parse(e.date); })
  }

  this.setup_x_axis = function(x) {
    var self = this;
    this.x_axis = this.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")");

    this.x_axis
      .call(d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(this.tick_count)
        .tickFormat(function(d) { return self.axisFormat(d) }));
  }

  this.setup_events_axis = function(x, height) {
    if (this.all_events.length <= 0) {
      return;
    }

    var self = this;
    axis_event_dates = this.event_dates();

    this.event_axis = d3.svg.axis()
      .orient('top')
      .scale(x)
      .tickSize(height)
      .tickValues(axis_event_dates)
      .tickFormat(function(d) { return self.event_for(d); });

    this.hitbox_axis = d3.svg.axis()
      .orient('top')
      .scale(x)
      .tickSize(height)
      .tickValues(axis_event_dates)
      .tickFormat(function(d) { return ''; });

    this.event_g = this.svg.append('g');
    this.event_g
      .attr('class', 'axis--event')
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.event_axis)
      .selectAll('text')
      .attr('y', -4)
      .attr('x', 6)
      .attr('transform', 'rotate(-90)')
      .style("text-anchor", 'start');

    this.hitbox_g = this.svg.append('g');
    this.hitbox_g
      .attr('class', 'event--hitbox')
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.hitbox_axis)
      .selectAll('line')
      .on(hover_enter_event_name(), function(d) { self.event_mouseover(d); })
      .on(hover_exit_event_name(), function(d) { self.event_mouseout(d); })
  }

  this.event_mouseover = function(date) {
    this.svg.selectAll('.axis--event text')
      .transition()
      .duration(250)
      .style('opacity', function(d) { 
        return (date.getTime() == d.getTime()) ? '1' :'0'; 
      });
  }

  this.event_mouseout = function(d) {
    this.svg.selectAll('.axis--event text')
      .transition()
      .duration(250)
      .style('opacity', '0');
  }

  this.event_for = function(event_date) {
    date = this.timeFormat(event_date)
    event_text = '';
    this.all_events.forEach(function(e) {
      if (e.date == date) {
        event_text = e.description;
        return;
      }
    });

    return event_text;
  }    

  this.voronoi_group = function() {
    if (this.supports_voronoi()) {

      var voronoi_path = null;
      if (!this.voronoiGroup) {
        this.voronoiGroup = this.svg.append("g")
            .attr("class", "voronoi");

      this.voronoiData = this.voronoi(d3.nest()
              .key(function(d) { return self.x_scale(d.date) + "," + self.y_scale(d.value); })
              .rollup(function(v) { return v[0]; })
              .entries(d3.merge(this.places.map(function(d) { return d.values; })))
              .map(function(d) { return d.values; }));

        voronoi_path = this.voronoiGroup.selectAll("path")
          .data(this.voronoiData)
          .enter().append("path");
      }
      else {
        this.voronoiData = this.voronoi(d3.nest()
                .key(function(d) { return self.x_scale(d.date) + "," + self.y_scale(d.value); })
                .rollup(function(v) { return v[0]; })
                .entries(d3.merge(this.places.map(function(d) { return d.values; })))
                .map(function(d) { return d.values; }));
        
        voronoi_path = this.voronoiGroup.selectAll("path").data(this.voronoiData);
      }
      
      voronoi_path
          .attr("d", function(d) { 
            return "M" + d.join("L") + "Z"; 
          })
          .datum(function(d) { return d.point; })
          .on(hover_enter_event_name(), function(d) { self.mouseover(d); })
          .on(hover_exit_event_name(), function(d) { self.mouseout(d); });
    }    
  }

  this.build_chart = function(error, places) {
    var self = this;
    this.loaded = true;
    this.places = places;
    this.x_scale.domain(d3.extent(this.dates));
    
    var max_range = this.max_range || d3.max(places, function(c) { return d3.max(c.values, function(d) { return d.value; }); });
    this.y_scale.domain([0, max_range]).nice();

    this.setup_x_axis(this.x_scale);
    this.y_axis = this.svg.append("g")
        .attr("class", "axis axis--y")

    this.y_axis
        .call(d3.svg.axis()
          .scale(this.y_scale)
          .orient("left"))
      .append("text")
        .attr("x", 4)
        .attr("dy", ".32em")
        .style("font-weight", "bold")
        .text(chart_title);

    this.place_lines = this.svg.append("g");
    this.place_lines
      .selectAll("path")
        .data(places)
      .enter().append("path")
        .attr("d", function(d) { d.line = this; return self.line(d.values); })
        .attr("class", function(d) { return d.place_class(); });

    this.focus = this.svg.append("g")
        .attr("transform", "translate(-100,-100)")
        .attr("class", "focus");
    this.focus_activity = this.focus.append('div')
        .attr('class', 'mouseover-activity')

    this.focus.append("circle")
        .attr("r", 3.5);

    this.focus_title = this.focus.append("text")
        .attr("y", -22);
    this.focus_activity = this.focus.append("text")
        .attr("y", -10);

    this.voronoi_group();

    this.setup_events_axis(this.x_scale, this.height - 7);
  }

  this.type = function(d, i) {
    var self = this;
    if (!i) this.dates = Object.keys(d).map(self.timeFormat.parse).filter(Number);
    var place = {
      name: d.Name,
      values: null,

      is_special_type: function() {
        return this.name == 'United States' || this.name == 'ebola';
      },
      place_class: function() {
        if (this.is_special_type()) { return 'united-states'; }
        return 'places';
      },
      hover_class: function() {
        if (this.is_special_type()) { return 'united-states--hover'; }
        return 'place--hover';
      }      
    };
    place.values = this.dates.map(function(place_date) {
      return {
        place: place,
        date: place_date,
        value: parseFloat(d[self.timeFormat(place_date)])
      };
    });

    return place;
  }

  this.resize = function() {
    if (!this.loaded) { return; }

    var self = this;
    this.calculate_dimensions();
    this.setup_voronoi();

    d3.select(this.chart_id + ' svg')
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
    .select("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.x_axis
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.svg.axis()
        .scale(this.x_scale)
        .orient("bottom")
        .ticks(this.tick_count)
        .tickFormat(function(d) { return self.axisFormat(d) }));

    this.y_axis
        .call(d3.svg.axis()
          .scale(this.y_scale)
          .orient("left"))

    this.clear_focus();
    this.place_lines
      .selectAll("path")
      .attr("d", function(d) { return self.line(d.values); })        

    this.voronoi_group();

    this.event_g
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.event_axis)
      .selectAll('text')
      .attr('y', -4)
      .attr('x', 6)
      .attr('transform', 'rotate(-90)')
      .style("text-anchor", 'start');

    this.hitbox_g
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.hitbox_axis)

    this.onscreen_check();
  }

  this.load_data = function() {
    d3.csv("data/" + data_file, 
      function(d, i) { return self.type(d, i); },
      function(error, places) { 
        self.build_chart(error, places); 
      });
  }

  this.onscreen_check = function() {
    if (!this.loaded && isScrolledIntoView(self.chart_id)) {
      self.load_data();
      d3.select(window).on('scroll.' + chart_name, null);
    }
  }

  function isScrolledIntoView(elem)
  {
      var docViewTop = $(window).scrollTop();
      var docViewBottom = docViewTop + $(window).height();

      var elemTop = $(elem).offset().top;
      var elemBottom = elemTop + $(elem).height();

      return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom));
  }

  Infograph.line_charts[chart_name] = this;

  if (this.force_load || isScrolledIntoView(self.chart_id)) {
    this.load_data();
  }
  else {
    d3.select(window).on('scroll.' + chart_name, function() {
      self.onscreen_check();
    })
  }

  if (this.resizable) {
    d3.select(window).on('resize.' + chart_name, function() { Infograph.line_charts[chart_name].resize(); });
  }
};
