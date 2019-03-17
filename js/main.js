var graph;

var x0 = null,
  x0old = null,
  x1 = null,
  dims = [];
var attrNo = null,
  attr = null,
  attr2 = [],
  index = 0;
var X = [],
  Y = [];
var loaddata = [];
var currData, prevData;

// Gets called when the page is loaded.
function init() {
  // Get input data
  d3.csv('data/04cars data_clean.csv').then(data => {
    for (var i = 0; i < data.length; i++) {
      var item = {
        "Name": null,
        "raw": null,
        "coord": null
      };
      item["Name"] = data[i]["Vehicle Name"];
      item["raw"] = data[i];
      delete item["raw"]["Vehicle Name"];
      delete item["raw"]["Pickup"];
      item["coord"] = {};
      loaddata[i] = item;
    }
    attr = Object.keys(loaddata[0]["raw"]); // ["Small/Sporty/ Compact/Large Sedan", "Sports Car", "SUV", ...]
    attrNo = attr.length; // 18
    for (var i = 0; i < attrNo; i++) {
      var tmpmax = d3.max(loaddata, function (d) {
        return +d["raw"][attr[i]];
      }); // max value of attr[i]
      var tmpmin = d3.min(loaddata, function (d) {
        return +d["raw"][attr[i]];
      }); // min value of attr[i]
      loaddata.forEach(function (d) {
        d["coord"][attr[i]] = (+d["raw"][attr[i]] - tmpmin) / (tmpmax - tmpmin); // calc coord of each attr, in [0,1]
      });
    }
    loadVis(loaddata);
  });
}

// Main function
function loadVis(data) {
  drawScatterPlot(data);
  for (var i = 0; i < attrNo; i++) {
    dims[i] = attr[i];
  }
  // drawParaCoords(data,dims);
  tabulate(data[0]);
}

function drawScatterPlot(data) {
  // heterogeneous data
  initdim1 = 11, initdim2 = 7; // 11:HP 7:Retail Price
  data.forEach(function (d) {
    d.x = d["coord"][attr[initdim1]];
    d.y = d["coord"][attr[initdim2]];
  }); // update x, y with coords of HP and Retail Price
  graph = new SimpleGraph("scplot", data, {
    "xlabel": attr[initdim1],
    "ylabel": attr[initdim2],
    "init": true
  });

  for (var i = 0; i < attrNo; i++) {
    X[i] = {
      "attr": attr[i],
      "value": 0,
      "changed": 0,
      "error": 0
    };
    Y[i] = {
      "attr": attr[i],
      "value": 0,
      "changed": 0,
      "error": 0
    };
  }
  X[initdim1]["value"] = 1; // at initial stage HP counts 100% for x axis 
  Y[initdim2]["value"] = 1; // Retail Price count 100% for y axis
  document.getElementById("cbX").selectedIndex = initdim1; // update initdim with index in comboBox
  document.getElementById("cbY").selectedIndex = initdim2;

  xaxis = new axis("#scplot", X, "X", {
    "width": graph.size.width - dropSize * 2,
    "height": graph.padding.bottom - 40,
    "padding": {
      top: graph.padding.top + graph.size.height + 40,
      right: 0,
      left: graph.padding.left + dropSize + 10,
      bottom: 0
    }
  });
  yaxis = new axis("#scplot", Y, "Y", {
    "width": graph.padding.left - dropSize,
    "height": graph.size.height - dropSize * 2,
    "padding": {
      top: graph.padding.top + dropSize,
      right: 0,
      left: 15,
      bottom: 0
    }
  });
}

var prevSearchLen = 0;

function searchList() {
  var input, filter;
  input = document.getElementById('searchContent');
  filter = input.value.toUpperCase();
  currData = loaddata;

  if (prevSearchLen == 0) {
    prevData = currData;
  }

  // remove navigation highlight
  // d3.selectAll('.curr').attr('class', '')
  // d3.selectAll('#curr').attr('id', '')

  if (prevSearchLen > filter.length) { // deleting words
    currData = prevData;
    // remove old content
    if (filter.length == 0) {
      d3.select('#plot').remove();
      drawScatterPlot(currData);
    }
  }
  if (filter.length > 1) {
    // remove old content
    d3.select('#plot').remove();

    // get all matched data
    currData = currData.filter(d => d.Name.toUpperCase().includes(filter));

    if (currData.length == 0) // no matched data
      d3.select('#error_info').text('No result.')
    else {
      drawScatterPlot(currData);
    }
  }
  prevSearchLen = filter.length;
}