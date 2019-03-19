var dropSize = 75,
  dropR = 10,
  axisOptions = {};

InterAxis = function (elemid, data, options) {
  var self = this;
  this.chart = document.getElementById(elemid);
  this.cx = this.chart.clientWidth * 0.9;
  this.cy = this.chart.clientHeight;
  this.options = options || {};
  this.points = data;

  this.options.xmax = d3.max(data, function (d) {
    return +d["x"];
  }) || options.xmax || 1;
  this.options.xmin = d3.min(data, function (d) {
    return +d["x"];
  }) || options.xmin || 0;
  this.options.ymax = d3.max(data, function (d) {
    return +d["y"];
  }) || options.ymax || 1;
  this.options.ymin = d3.min(data, function (d) {
    return +d["y"];
  }) || options.ymin || 0;

  this.padding = {
    "top": 10,
    "right": 30,
    "bottom": 110,
    "left": 712
  };

  this.size = {
    "width": this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top - this.padding.bottom
  };

  axisOptions = {
    "X": {
      "width": this.padding.left - 200,
      "height": this.size.height / 2 - 50,
      "padding": {
        top: this.padding.top + this.size.height / 2 + 100,
        right: 0,
        left: 80,
        bottom: 0
      }
    },
    "Y": {
      "width": this.padding.left - 200,
      "height": this.size.height / 2 - 50,
      "padding": {
        top: this.padding.top,
        right: 0,
        left: 80,
        bottom: 0
      }
    }
  };

  // x-scale
  this.x = d3.scaleLinear()
    .domain([this.options.xmin, this.options.xmax])
    .nice()
    .range([0, this.size.width])
    .nice();

  // drag x-axis logic
  this.downx = Math.NaN;

  // y-scale (inverted domain)
  this.y = d3.scaleLinear()
    .domain([this.options.ymax, this.options.ymin])
    .nice()
    .range([0, this.size.height])
    .nice();

  // drag y-axis logic
  this.downy = Math.NaN;

  this.dragged = this.selected = null;
  this.dropped = null;
  if (this.options.dropzone) {
    this.dropzone = this.options.dropzone;
    delete this.options.dropzone;
  } else {
    this.dropzone = {
      "YH": [],
      "YL": [],
      "XL": [],
      "XH": []
    };
  }

  var xrange = (this.options.xmax - this.options.xmin),
    yrange2 = (this.options.ymax - this.options.ymin) / 2,
    yrange4 = yrange2 / 2;

  if (this.options.init == true) {
    var SC = d3.select(this.chart).append("svg")
      .attr('id', 'svgplot')
      .attr("width", this.cx)
      .attr("height", this.cy);

    var drp = SC.append("g").attr("id", "DROP");
    drp.append("g")
      .attr("id", "YH")
      .append("rect")
      .attr("class", "positive")
      .attr("x", this.padding.left - dropSize * 1.4)
      .attr("y", this.padding.top)
      .append('svg:title')
      .text('drop cars here to create new axis');
    drp.append("g")
      .attr("id", "YL")
      .append("rect")
      .attr("class", "negative")
      .attr("x", this.padding.left - dropSize * 1.4)
      .attr("y", this.cy - this.padding.bottom - dropSize)
      .append('svg:title')
      .text('drop cars here to create new axis');
    drp.append("g")
      .attr("id", "XL")
      .append("rect")
      .attr("class", "negative")
      .attr("x", this.padding.left)
      .attr("y", this.cy - this.padding.bottom + dropSize * 0.3)
      .append('svg:title')
      .text('drop cars here to create new axis');
    drp.append("g")
      .attr("id", "XH")
      .append("rect")
      .attr("class", "positive")
      .attr("x", this.cx - this.padding.right - dropSize)
      .attr("y", this.cy - this.padding.bottom + dropSize * 0.3)
      .append('svg:title')
      .text('drop cars here to create new axis');
    drp.selectAll("rect")
      .attr("width", dropSize)
      .attr("height", dropSize)
      .attr("rx", dropR)
      .attr("ry", dropR);

    var div = document.getElementById("btnYc"); // btn y clear
    div.style.left = 240;
    div.style.top = this.padding.top + this.size.height / 2;
    div = document.getElementById("btnXc"); // btn x clear
    div.style.left = 240;
    div.style.top = this.padding.top + this.size.height / 2 + 0.5 * dropSize;

    d3.select("#cbY") // combo box y
      .selectAll("option")
      .data(attr)
      .enter()
      .append("option")
      .attr("value", function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });
    d3.select("#cbX") // combo box x
      .selectAll("option")
      .data(attr)
      .enter()
      .append("option")
      .attr("value", function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });
    div = document.getElementById("cbY");
    div.style.left = 100;
    // div.style.left = this.padding.left - dropSize - 220;
    div.style.top = this.padding.top + this.size.height / 2;
    div = document.getElementById("cbX");
    div.style.left = 100;
    // div.style.left = this.padding.left - dropSize - 220;;
    div.style.top = this.padding.top + this.size.height / 2 + 0.5 * dropSize;
  } else {
    var SC = d3.select(this.chart).select("svg")
      .attr("width", this.cx)
      .attr("height", this.cy);
  }
  this.vis = SC.append("g")
    .attr("id", "SC")
    .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

  this.plot = this.vis.append("rect")
    .attr("width", this.size.width)
    .attr("height", this.size.height)
    .attr("pointer-events", "all")
    .call(d3.zoom().on("zoom", self.onZoom()))

  this.vis.append("svg")
    .attr('id', 'plot')
    .attr("top", 0)
    .attr("left", 0)
    .attr("width", this.size.width)
    .attr("height", this.size.height);

  d3.select(this.chart)
    .on("mousemove.drag", self.mousemove())
    .on("touchmove.drag", self.mousemove())
    .on("mouseup.drag", self.mouseup())
    .on("touchend.drag", self.mouseup());

  this.redraw()();
};

//
// InterAxis methods
//

InterAxis.prototype.plot_drag = function () {
  var self = this;
  return function () {
    // registerKeyboardHandler(self.keydown());
    d3.select('body').style("cursor", "move");
    if (d3.event.altKey) {
      var p = d3.mouse(self.vis.node());
      var newpoint = {};
      newpoint.x = self.x.invert(Math.max(0, Math.min(self.size.width, p[0])));
      newpoint.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.points.push(newpoint);
      self.points.sort(function (a, b) {
        if (a.x < b.x) {
          return -1
        };
        if (a.x > b.x) {
          return 1
        };
        return 0
      });
      self.selected = newpoint;
      self.update();
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

InterAxis.prototype.update = function () {
  var self = this;

  var circle = this.vis.select("svg").selectAll("circle")
    .data(this.points);

  circle.enter().append("circle")
    .attr("class", function (d) {
      return d.indropzone == 1 ? "positive_dropped" : d.indropzone == -1 ? "negative_dropped" : null;
    })
    .attr("id", d => "circle" + d.id)
    .attr("cx", function (d) {
      return self.x(d["x"]);
    })
    .attr("cy", function (d) {
      return self.y(d["y"]);
    })
    .attr("r", 8.0)
    .style("cursor", "resize")
    .on("mouseover", function (d) {
      hoverOnCell(d);
      d3.select("#DROP").selectAll("circle").filter(function (c) {
        return c == d;
      }).attr("class", function (d) {
        return d.indropzone == 1 ? "highlighted positive_dropped" : d.indropzone == -1 ? "highlighted negative_dropped" : "highlighted";
      });
    })
    .on("mouseout", function (d) {
      d3.select("#DROP").selectAll("circle").filter(function (c) {
        return c == d;
      }).attr("class", null);
      hoverOutCell(d);
    })
    .on("mousemove", moveTruliaLabel)
    .on("mousedown.drag", self.datapoint_drag())
    .on("touchstart.drag", self.datapoint_drag());

  circle.attr("text", function (d) {
    return d["Name"];
  });

  circle
    .attr("class", function (d) {
      return d.indropzone == 1 ? "positive_dropped" : d.indropzone == -1 ? "negative_dropped" : null;
    })
    .attr("cx", function (d) {
      return self.x(d.x);
    })
    .attr("cy", function (d) {
      return self.y(d.y);
    });

  circle.exit().remove();

  if (d3.event && d3.event.keyCode) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
}

InterAxis.prototype.datapoint_drag = function () {
  var self = this;
  return function (d) {
    // registerKeyboardHandler(self.keydown());
    document.onselectstart = function () {
      return false;
    };
    self.selected = self.dragged = d;
    self.dragged.oldy = d.y;
    self.dragged.oldx = d.x;

    self.update();
  }
};

InterAxis.prototype.mousemove = function () {
  var self = this;
  return function () {
    var p = d3.mouse(self.vis.node());
    var t = d3.event.changedTouches;

    if (self.dragged) {
      // self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.dragged.y = self.y.invert(p[1]);
      // self.dragged.x = self.x.invert(Math.max(0, Math.min(self.size.width, p[0])));
      self.dragged.x = self.x.invert(p[0]);

      if (-dropSize * 1.5 <= p[0] && p[0] <= -dropSize * 0.5 && 0 <= p[1] && p[1] <= dropSize) { // YH
        self.dropped = "YH";
      } else if (-dropSize * 1.5 <= p[0] && p[0] <= -dropSize * 0.5 && self.size.height - dropSize <= p[1] && p[1] <= self.size.height) { // YL
        self.dropped = "YL";
      } else if (0 <= p[0] && p[0] <= dropSize && self.size.height + dropSize * 0.5 <= p[1] && p[1] <= self.size.height + dropSize * 1.5) { // XL
        self.dropped = "XL";
      } else if (self.size.width - dropSize <= p[0] && p[0] <= self.size.width && self.size.height + dropSize * 0.5 <= p[1] && p[1] <= self.size.height + dropSize * 1.5) { // XH
        self.dropped = "XH";
      } else {
        self.dropped = null;
      }

      self.update();
    };
    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx = self.x.invert(p[0]),
        xaxis1 = self.x.domain()[0],
        xaxis2 = self.x.domain()[1],
        xextent = xaxis2 - xaxis1;
      if (rupx != 0) {
        var changex, new_domain;
        changex = self.downx / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
        yaxis1 = self.y.domain()[1],
        yaxis2 = self.y.domain()[0],
        yextent = yaxis2 - yaxis1;
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

InterAxis.prototype.mouseup = function () {
  var self = this;

  return function () {
    document.onselectstart = function () {
      return true;
    };
    d3.select('body').style("cursor", "auto");
    d3.select('body').style("cursor", "auto");
    if (!isNaN(self.downx)) {
      self.redraw()();
      self.downx = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      self.redraw()();
      self.downy = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (self.dragged) {
      self.dragged.y = self.dragged.oldy;
      self.dragged.x = self.dragged.oldx;

      if (self.dropped) {
        if (self.dropped == "XH" || self.dropped == "YH") {
          self.dragged.indropzone = 1;
        } else if (self.dropped == "XL" || self.dropped == "YL") {
          self.dragged.indropzone = -1;
        } else {
          self.dragged.indropzone = 0;
        }

        var count = 0;
        for (var i = 0; i < self.dropzone[self.dropped].length; i++) {
          if (self.dropzone[self.dropped][i]["Name"] == self.dragged["Name"]) {
            count = count + 1;
            break;
          }
        }
        if (count == 0) {
          self.dropzone[self.dropped][self.dropzone[self.dropped].length] = self.dragged;
          d3.select("#" + self.dropped).selectAll("circle").remove();

          var cx = +d3.select("#" + self.dropped).select("rect").attr("x") + 0.5 * dropSize,
            cy = +d3.select("#" + self.dropped).select("rect").attr("y") + 0.5 * dropSize,
            num = self.dropzone[self.dropped].length,
            dist = num == 1 ? 0 : 10.0 / Math.sin(Math.PI / num);

          d3.select("#" + self.dropped).selectAll("circle").data(self.dropzone[self.dropped]).enter().append("circle")
            .attr("cx", function (d, i) {
              return cx + dist * Math.cos(Math.PI * 2 * i / num);
            })
            .attr("cy", function (d, i) {
              return cy + dist * Math.sin(Math.PI * 2 * i / num);
            })
            .attr("r", 8.0)
            .on("mouseover", function (d) {
              hoverOnCell(d);
              tmpclass = d3.select("#SC").selectAll("circle").filter(function (c) {
                return c == d;
              }).attr("class");
              d3.select("#SC").selectAll("circle").filter(function (c) {
                return c == d;
              }).attr("class", function (d) {
                return d.indropzone == 1 ? "highlighted positive_dropped" : d.indropzone == -1 ? "highlighted negative_dropped" : "highlighted";
              });
            })
            .on("mouseout", function (d) {
              d3.select("#SC").selectAll("circle").filter(function (c) {
                return c == d;
              }).attr("class", tmpclass);
            })
            .on("dblclick", function (d) {
              thisdropzone = d3.select(this.parentNode).attr("id");
              for (var i = 0; i < self.dropzone[thisdropzone].length; i++) {
                if (self.dropzone[thisdropzone][i] == d) {
                  self.dropzone[thisdropzone].splice(i, 1);
                  break;
                }
              }
              var inotherdropzone = graph.dropzone.XH.concat(graph.dropzone.XL, graph.dropzone.YH, graph.dropzone.YL)
                .filter(function (c) {
                  return c == d;
                });
              if (inotherdropzone.length == 0) {
                d.indropzone = 0;
                tmpclass = null;
              }
              this.remove();
              if (thisdropzone == "XL" || thisdropzone == "XH") {
                console.log("update X");
                if (self.dropzone["XH"].length * self.dropzone["XL"].length > 0) {
                  updategraph("X");
                } else {
                  updatebycb("X", attr[initdim1]);
                }
              } else if (thisdropzone == "YL" || thisdropzone == "YH") {
                console.log("update Y");
                if (self.dropzone["YH"].length * self.dropzone["YL"].length > 0) {
                  updategraph("Y");
                } else {
                  updatebycb("Y", attr[initdim2]);
                }
              } else {
                self.redraw();
              }
            })
        }
      }
      if ((self.dropped == "XL" && self.dropzone["XH"].length > 0) || (self.dropped == "XH" && self.dropzone["XL"].length > 0)) {
        console.log("update X");
        updategraph("X");
      } else if ((self.dropped == "YL" && self.dropzone["YH"].length > 0) || (self.dropped == "YH" && self.dropzone["YL"].length > 0)) {
        console.log("update Y");
        updategraph("Y");
      }
      self.dragged = null;
      self.dropped = null;
      self.redraw()();
    }
  }
}

updategraph = function (axistobeupdated, givenV, givenVchanged) {
  data = graph.points;
  if (givenV == undefined) {
    var x1 = {},
      x0 = {};
    var high = graph.dropzone[axistobeupdated + "H"],
      low = graph.dropzone[axistobeupdated + "L"];
    for (var i = 0; i < attrNo; i++) {
      x1[attr[i]] = d3.mean(low, function (d) {
        return d["coord"][attr[i]]
      });
      x0[attr[i]] = d3.mean(high, function (d) {
        return d["coord"][attr[i]]
      });
    }

    var hlpair = [];
    for (var i = 0; i < high.length; i++) {
      for (var j = 0; j < low.length; j++) {
        var tmpelt = {};
        for (var k = 0; k < attrNo; k++) {
          tmpelt[attr[k]] = high[i]["coord"][attr[k]] - low[j]["coord"][attr[k]];
        }
        hlpair[hlpair.length] = tmpelt;
      }
    }

    // calculate new attr
    console.log("------------------------ Getting new axis vector ------------------------------")
    var V = {},
      Vchanged = {},
      Verror = {},
      norm = 0;
    for (var i = 0; i < attrNo; i++) {
      V[attr[i]] = 0;
      Vchanged[attr[i]] = 0;
    }
    for (var i = 0; i < attrNo; i++) {
      V[attr[i]] = x0[attr[i]] - x1[attr[i]];
      norm = norm + (x0[attr[i]] - x1[attr[i]]) * (x0[attr[i]] - x1[attr[i]]);
    }
    var VV = [];
    for (var i = 0; i < attrNo; i++) {
      VV[i] = {
        "attr": attr[i],
        "value": V[attr[i]]
      };
    }
    VV.sort(function (a, b) {
      return Math.abs(b["value"]) - Math.abs(a["value"]);
    });
    for (var i = 0; i < VV.length; i++) {
      // V[VV[i]["attr"]] = i<10 ? VV[i]["value"] : 0;
    }
    norm = Math.sqrt(norm);
    for (var i = 0; i < attrNo; i++) {
      V[attr[i]] = V[attr[i]] / norm;
      if (hlpair.length > 1) {
        Verror[attr[i]] = d3.deviation(hlpair, function (d) {
          return d[attr[i]];
        });
      } else {
        Verror[attr[i]] = 0;
      }
    }
  } else {
    var V = givenV,
      Vchanged = givenVchanged,
      Verror = {},
      norm = 0;
    for (var i = 0; i < attrNo; i++) {
      norm = norm + (V[attr[i]]) * (V[attr[i]]);
    }
    norm = Math.sqrt(norm);
    for (var i = 0; i < attrNo; i++) {
      V[attr[i]] = V[attr[i]] / norm;
      Verror[attr[i]] = 0;
    }
  }

  index = index + 1;
  var newxname = 'x' + index;
  graph.points.forEach(function (d, i) {
    d["coord"][newxname] = 0;
    for (var j = 0; j < attrNo; j++) {
      d["coord"][newxname] = d["coord"][newxname] + V[attr[j]] * d["coord"][attr[j]];
    }

  });

  d3.select("#SC").remove();
  d3.select("#" + axistobeupdated).remove();
  data.forEach(function (d) {
    d[axistobeupdated == "X" ? "x" : "y"] = d["coord"][newxname];
  });
  graph = new InterAxis("scplot", data, {
    "xlabel": axistobeupdated == "X" ? newxname : graph.options.xlabel,
    "ylabel": axistobeupdated == "X" ? graph.options.ylabel : newxname,
    "init": false,
    "dropzone": graph.dropzone
  });
  var VV = [];
  for (var i = 0; i < attrNo; i++) {
    VV[i] = {
      "attr": attr[i],
      "value": V[attr[i]],
      "changed": Vchanged[attr[i]],
      "error": Verror[attr[i]]
    };
  }
  if (axistobeupdated == "X") {
    X = VV;
    xaxis = new axis("#scplot", VV, axistobeupdated, axisOptions[axistobeupdated]);
  } else {
    Y = VV;
    yaxis = new axis("#scplot", VV, axistobeupdated, axisOptions[axistobeupdated])
  }
};

InterAxis.prototype.onZoom = function () {
  var self = this;
  return function () {
    var xAxisScale = d3.scaleLinear()
      .domain([-10, -20])
      .range([0, 10]);

    var new_xScale = d3.event.transform.rescaleX(xAxisScale);
    self.x = d3.event.transform.rescaleX(self.x);
    self.y = d3.event.transform.rescaleY(self.y);

    //console.log(self.x.domain());

    self.redraw()();
  }
}

InterAxis.prototype.redraw = function () {
  var self = this;
  // console.log(self.x.domain());
  return function () {
    var tx = function (d) {
        console.log("scale:" + self.k);
        return "translate(" + self.x(d) + ")";
      },
      ty = function (d) {
        return "translate(0," + self.y(d) + ")";
      },
      fx = self.x.tickFormat(10),
      fy = self.y.tickFormat(10);

    console.log(self.x.domain());

    // Regenerate x-ticks…
    var gx = self.vis.selectAll("g.x")
      .data(self.x.ticks(10), String)
      .attr("transform", tx);

    gx.select("text")
      .text(fx);

    var gxe = gx.enter().insert("g", "a")
      .attr("class", "x")
      .attr("transform", tx);

    gxe.append("line")
      .attr("y1", 0)
      .attr("y2", self.size.height);

    gxe.append("text")
      .attr("class", "axis")
      .attr("y", self.size.height)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text(fx)
      .style("cursor", "ew-resize")
      .on("mouseover", function (d) {
        d3.select(this).style("font-weight", "bold");
      })
      .on("mouseout", function (d) {
        d3.select(this).style("font-weight", "normal");
      })
      .on("mousedown.drag", self.xaxis_drag())
      .on("touchstart.drag", self.xaxis_drag());

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = self.vis.selectAll("g.y")
      .data(self.y.ticks(10), String)
      .attr("transform", ty);

    gy.select("text")
      .text(fy);

    var gye = gy.enter().insert("g", "a")
      .attr("class", "y")
      .attr("transform", ty)
      .attr("background-fill", "#FFEEB6");

    gye.append("line")
      .attr("x1", 0)
      .attr("x2", self.size.width);

    gye.append("text")
      .attr("class", "axis")
      .attr("x", -3)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(fy)
      .style("cursor", "ns-resize")
      .on("mouseover", function (d) {
        d3.select(this).style("font-weight", "bold");
      })
      .on("mouseout", function (d) {
        d3.select(this).style("font-weight", "normal");
      })
      .on("mousedown.drag", self.yaxis_drag())
      .on("touchstart.drag", self.yaxis_drag());

    gy.exit().remove();

    // self.plot.call(d3.zoom().on("zoom", self.onZoom()));
    self.update();
  }
}

InterAxis.prototype.xaxis_drag = function () {
  var self = this;
  return function (d) {
    document.onselectstart = function () {
      return false;
    };
    var p = d3.mouse(self.vis.node());
    self.downx = self.x.invert(p[0]);
  }
};

InterAxis.prototype.yaxis_drag = function (d) {
  var self = this;
  return function (d) {
    document.onselectstart = function () {
      return false;
    };
    var p = d3.mouse(self.vis.node());
    self.downy = self.y.invert(p[1]);
  }
};
