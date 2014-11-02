var LINE_CHART = {};
LINE_CHART.line_chart = function(data_file, chart_title, event_names, override_height) {
  var dates,
      timeFormat = d3.time.format("%Y-%m-%d"),
      axisFormat = d3.time.format("%m/%d"),
      eventFormat = d3.time.format("%b %d");
  var all_events = Event.events.get_events(event_names);

  var margin = {top: 20, right: 30, bottom: 30, left: 40};
  var calc_width = parseInt(d3.select('#line_chart').style('width'));
  var calc_height = override_height ? override_height : calc_width * 3 / 5;
  var width = calc_width - margin.left - margin.right;
  var height = calc_height - margin.top - margin.bottom;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var voronoi = d3.geom.voronoi()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.value); })
      .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

  var line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.value); });

  var svg = d3.select("#line_chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "line_chart")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/" + data_file, type, function(error, places) {
    x.domain(d3.extent(dates));
    y.domain([0, d3.max(places, function(c) { return d3.max(c.values, function(d) { return d.value; }); })]).nice();

    setup_x_axis(x);

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.svg.axis()
          .scale(y)
          .orient("left"))
      .append("text")
        .attr("x", 4)
        .attr("dy", ".32em")
        .style("font-weight", "bold")
        .text(chart_title);

    svg.append("g")
      .selectAll("path")
        .data(places)
      .enter().append("path")
        .attr("d", function(d) { d.line = this; return line(d.values); })
        .attr("class", function(d) { return d.place_class(); });

    var focus = svg.append("g")
        .attr("transform", "translate(-100,-100)")
        .attr("class", "focus");

    focus.append("circle")
        .attr("r", 3.5);

    focus.append("text")
        .attr("y", -10);

    var voronoiGroup = svg.append("g")
        .attr("class", "voronoi");

    voronoiGroup.selectAll("path")
        .data(voronoi(d3.nest()
            .key(function(d) { return x(d.date) + "," + y(d.value); })
            .rollup(function(v) { return v[0]; })
            .entries(d3.merge(places.map(function(d) { return d.values; })))
            .map(function(d) { return d.values; })))
      .enter().append("path")
        .attr("d", function(d) { 
          return "M" + d.join("L") + "Z"; 
        })
        .datum(function(d) { return d.point; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    setup_events_axis(x, height);

    function mouseover(d) {
      d3.select(d.place.line).classed(d.place.hover_class(), true);
      d.place.line.parentNode.appendChild(d.place.line);
      focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
      focus.select("text").text(d.place.name);
    }

    function mouseout(d) {
      d3.select(d.place.line).classed(d.place.hover_class(), false);
      focus.attr("transform", "translate(-100,-100)");
    }

    function event_dates() {
      return all_events.map(function(e) { return timeFormat.parse(e.date); })
    }

    function setup_x_axis(x) {
      x_axis = svg.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")");

      x_axis
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(8)
          .tickFormat(function(d) { return axisFormat(d) }));
    }

    function setup_events_axis(x, height) {
      if (all_events.length <= 0) {
        return;
      }

      axis_event_dates = event_dates();

      event_axis = d3.svg.axis()
        .orient('top')
        .scale(x)
        .tickSize(height)
        .tickValues(event_dates)
        .tickFormat(function(d) { return event_for(d); });

      hitbox_axis = d3.svg.axis()
        .orient('top')
        .scale(x)
        .tickSize(height)
        .tickValues(event_dates)
        .tickFormat(function(d) { return ''; });

      event_g = svg.append('g');

      event_g
        .attr('class', 'axis--event')
        .attr("transform", "translate(0," + height + ")")
        .call(event_axis)
        .selectAll('text')
        .attr('y', -4)
        .attr('x', 6)
        .attr('transform', 'rotate(-90)')
        .style("text-anchor", 'start');

      svg.append('g')
        .attr('class', 'event--hitbox')
        .attr("transform", "translate(0," + height + ")")
        .call(hitbox_axis)
        .selectAll('line')
        .on('mouseover', event_mouseover)
        .on('mouseout', event_mouseout)
    }

    function event_mouseover(date) {
      d3.selectAll('.axis--event text')
        .transition()
        .duration(250)
        .style('opacity', function(d) { 
          return (date.getTime() == d.getTime()) ? '1' :'0'; 
        });
    }

    function event_mouseout(d) {
      d3.selectAll('.axis--event text')
        .transition()
        .duration(250)
        .style('opacity', '0');
    }

    function event_for(event_date) {
      date = timeFormat(event_date)
      event_text = '';
      all_events.forEach(function(e) {
        if (e.date == date) {
          // event_text = eventFormat(event_date) + ': ' + e.description;
          event_text = e.description;
          return;
        }
      });

      return event_text;
    }
  });

  function type(d, i) {
    if (!i) dates = Object.keys(d).map(timeFormat.parse).filter(Number);
    var place = {
      name: d.Name,
      values: null,

      is_united_states: function() {
        return this.name == 'United States';
      },
      place_class: function() {
        if (this.is_united_states()) { return 'united-states'; }
        return 'places';
      },
      hover_class: function() {
        if (this.is_united_states()) { return 'united-states--hover'; }
        return 'place--hover';
      }      
    };
    place.values = dates.map(function(place_date) {
      return {
        place: place,
        date: place_date,
        value: parseFloat(d[timeFormat(place_date)])
      };
    });
    return place;
  }
};