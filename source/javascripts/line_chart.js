var LINE_CHART = {};
LINE_CHART.line_chart = function(data_file, chart_title) {
  var months,
      monthFormat = d3.time.format("%Y-%m");

  var margin = {top: 20, right: 30, bottom: 30, left: 40};
  var calc_width = parseInt(d3.select('#line_chart').style('width'));
  var calc_height = calc_width * 3 / 5;
  var width = calc_width - margin.left - margin.right;
  var height = calc_height - margin.top - margin.bottom;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.category20();

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

  d3.tsv("data/" + data_file, type, function(error, cities) {
    x.domain(d3.extent(months));
    y.domain([0, d3.max(cities, function(c) { return d3.max(c.values, function(d) { return d.value; }); })]).nice();

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom"));

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.svg.axis()
          .scale(y)
          .orient("left")
          .ticks(10, "%"))
      .append("text")
        .attr("x", 4)
        .attr("dy", ".32em")
        .style("font-weight", "bold")
        .text(chart_title);

    svg.append("g")
        .attr("class", "cities")
      .selectAll("path")
        .data(cities)
      .enter().append("path")
        .attr("d", function(d) { d.line = this; return line(d.values); });

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
            .entries(d3.merge(cities.map(function(d) { return d.values; })))
            .map(function(d) { return d.values; })))
      .enter().append("path")
        .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
        .datum(function(d) { return d.point; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    function mouseover(d) {
      d3.select(d.city.line).classed("city--hover", true);
      d.city.line.parentNode.appendChild(d.city.line);
      focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
      focus.select("text").text(d.city.name);
    }

    function mouseout(d) {
      d3.select(d.city.line).classed("city--hover", false);
      focus.attr("transform", "translate(-100,-100)");
    }
  });

  function type(d, i) {
    if (!i) months = Object.keys(d).map(monthFormat.parse).filter(Number);
    var city = {
      name: d.name.replace(/ (msa|necta div|met necta|met div)$/i, ""),
      values: null
    };
    city.values = months.map(function(m) {
      return {
        city: city,
        date: m,
        value: d[monthFormat(m)] / 100
      };
    });
    return city;
  }
};