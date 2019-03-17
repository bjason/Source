axis = function (elemid, vector, XorY, options) {
  var margin = { top: 30, right: 40, bottom: 10, left: 5 },
    padding = options.padding,
    width = options.width - margin.left - margin.right,
    height = options.height - margin.top - margin.bottom;

  var data = vector;
  data.sort(function (a, b) { // sort attrs by weights in descending order
    if (a["value"] == b["value"]) { return d3.ascending(a["attr"], b["attr"]) }
    else { return Math.abs(b["value"]) - Math.abs(a["value"]); }
  });
  data = data.slice(0, 15); // get top 15 attrs

  var x = d3.scaleLinear() // x axis of bar chart, weights of attrs
    .domain(d3.extent(data, function (d) { return d["value"]; })).nice()
    .range([0, width]); // extent: find the max and min value; nice: modify the range to avoid fraction

  var y = d3.scaleBand() // y axis of bar chart, names of attrs
    .rangeRound([0, height], .2)
    .domain(data.map(function (d) { return d["attr"] }));

  var xAxis = d3.axisTop(x);
  if (XorY == "Y") { xAxis.ticks(5); } // bar chart of Y do not have enough space to hold many ticks

  var svg = d3.select(elemid).select("svg").append("g")
    .attr("id", XorY)
    .attr("transform", "translate(" + (padding.left + margin.left) + "," + (padding.top + margin.top) + ")");

  var dragBar = svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", function (d) { if (d["changed"] == 1) { return d["value"] < 0 ? "bar negChanged" : "bar posChanged"; } else { return d["value"] < 0 ? "bar negative" : "bar positive"; } })
    .attr("x", function (d) { return x(Math.min(0, d["value"])); })
    .attr("y", function (d) { return y(d["attr"]); })
    .attr("width", function (d) { if (d["value"] == 0) { return 2; } else { return Math.abs(x(d["value"]) - x(0)); } })
    .attr("height", y.bandwidth())
    .attr("fill-opacity", function (d) { return 1 - d["error"]; });

  var dragBarTop = svg.selectAll(".dummy")
    .data(data)
    .enter().append("rect")
    .attr("class", "dummy dragBarTop")
    .attr("x", function (d) { if (d["value"] > 0) { return x(d["value"]) - 2; } else { return x(Math.min(0, d["value"])); } })
    .attr("y", function (d) { return y(d["attr"]); })
    .attr("width", 2)
    .attr("height", y.bandwidth())
    .call(d3.drag().on('drag', function (d, i) {
      d3.select(this).attr("x", d3.mouse(document.getElementById(XorY))[0]); // mouse position x
      d3.select("#" + XorY).selectAll('.bar[y="' + y(d["attr"]) + '"]')
        // .attr("class", function(d) { return x.invert(d3.mouse(document.getElementById(XorY))[0]) < 0 ? "bar negative" : "bar positive"; })
        .attr("class", function (d) { return x.invert(d3.mouse(document.getElementById(XorY))[0]) < 0 ? "bar negChanged" : "bar posChanged"; })
        .attr("x", function (d) { return x.invert(d3.mouse(document.getElementById(XorY))[0]) < 0 ? d3.mouse(document.getElementById(XorY))[0] : x(0); })
        .attr("width", function (d) {
          if (x.invert(d3.mouse(document.getElementById(XorY))[0]) == 0) { return 2; }
          else if (x.invert(d3.mouse(document.getElementById(XorY))[0]) > 0) { return Math.abs(d3.mouse(document.getElementById(XorY))[0] - x(0) + 2); }
          else { return Math.abs(d3.mouse(document.getElementById(XorY))[0] - x(0)); }
        });
      d["value"] = x.invert(d3.mouse(document.getElementById(XorY))[0]);
      if (graph.dropzone[XorY + "H"].length + graph.dropzone[XorY + "L"].length > 0) { d["changed"] = 1; }
    }).on('end', function (d, i) {
      console.log("dragend");
      var V = {}, Vchanged = {};
      for (var i = 0; i < attrNo; i++) {
        var tmp = data[i] || vector[i];
        V[vector[i]["attr"]] = tmp["value"];
        Vchanged[vector[i]["attr"]] = tmp["changed"];
      }
      console.log(V);
      updategraph(XorY, V, Vchanged);
    }));

  svg.append("g")
    .attr("class", "x axis")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y2", height);

  svg.append("g").selectAll("text")
    .data(data)
    .enter().append("text")
    .text(function (d) { return d["attr"]; })
    .attr("x", function (d) {
      // if (d["value"] < 0) { return  x(Math.min(0, d["value"])) - 5;}
      if (d["value"] < 0) { return x(0) + 5; }
      else { return x(Math.max(0, d["value"])) + 5; }
    })
    .attr("text-anchor", function (d) {
      // if (d["value"] < 0) { return  "end";}
      if (d["value"] < 0) { return "start"; }
      else { return "start"; }
    })
    .attr("y", function (d) { return y(d["attr"]) + 0.5 * y.bandwidth(); })
    .attr("dy", ".35em");

};