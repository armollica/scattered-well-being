var projection = d3.geo.conicConformal()
    .rotate([102, 0])
    .center([0, 24])
    .parallels([17.5, 29.5])
    .scale(350)
    .translate([180 / 2, 170 / 2]);

var path = d3.geo.path()
    .projection(projection);

var showInfo = false;
d3.select('.legend-header .info-button')
  .on('click', function() {
    showInfo = !showInfo;

    d3.select('.legend-header .info-button')
      .classed('active', showInfo)
      .text(showInfo ? "CLOSE" : "READ ME");

    d3.select('.intro .info')
      .classed('active', showInfo);
  });

d3.select('.info .close')
  .on('click', function() {
    showInfo = false;

    d3.select('.legend-header .info-button')
      .classed('active', showInfo)
      .text(showInfo ? "CLOSE" : "READ ME");

    d3.select('.intro .info')
      .classed('active', showInfo);
  });

var tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip');

tooltip.append('ul');
tooltip.select('ul').append('li').attr('class', 'state');
tooltip.select('ul').append('li').attr('class', 'muni')
tooltip.select('ul').append('li').attr('class', 'population')

tooltip.append('svg')
    .attr('class', 'chart')
    .attr('width', 200 )
    .attr('height', 100)
  .append('g')
    .attr('transform', 'translate(60,0)');

tooltip.append("svg")
    .attr('class', 'map')
    .attr("width", 180)
    .attr("height", 160);

queue()
  .defer(d3.json, "states.json")
  .defer(d3.json, "data.json")
  .await(ready);

function ready(error, states, carto) {
  if (error) throw error;

  data = carto.map;

  tooltip.select('svg.map').selectAll('path')
      .data(states.features)
    .enter().append('path')
      .attr('class', function(d) {
        return 'state-' + d.properties.CVE_ENT;
      })
      .attr('d', path)

  var baseConfigs = getBaseConfigs();

  var otherConfigs = {};

  otherConfigs.mexicoCity = baseConfigs.map(function(d) {
    return {
      name: d.name,
      width: 160,
      height: 230,
      scale: 1.5,
      offset: [490, 570],
      fill: d.fill,
      palette: d.palette,
      color: d.color,
      header: true
    };
  });

  otherConfigs.guadalajara = baseConfigs.map(function(d) {
    return {
      name: d.name,
      width: 160,
      height: 230,
      scale: 1.8,
      offset: [350, 510],
      fill: d.fill,
      palette: d.palette,
      color: d.color,
      header: true
    };
  });

  otherConfigs.borderCities = baseConfigs
    .filter(function(d) {
      return ["Income", "Safety"].indexOf(d.name) !== -1;
    })
    .map(function(d) {
      return {
        name: d.name,
        width: 500,
        height: 200,
        scale: 1.3,
        offset: [50, 175],
        fill: d.fill,
        palette: d.palette,
        color: d.color,
        header: true
      };
    });

  otherConfigs.safeSouth = ['Income', 'Safety', 'Education']
    .map(function(name) {
      return baseConfigs
                .filter(function(d) {
                  return name == d.name;
                })
                .map(function(d) {
                  return {
                    name: d.name,
                    width: 330,
                    height: 270,
                    scale: 1.2,
                    offset: [510, 550],
                    fill: d.fill,
                    palette: d.palette,
                    color: d.color,
                    header: true
                  };
                })[0];
    });

  otherConfigs.educationDivide = baseConfigs
    .filter(function(d) {
      return ['Jobs', 'Education'].indexOf(d.name) !== -1;
    })
    .map(function(d) {
      return {
        name: d.name,
        width: 500,
        height: 270,
        scale: 1.9,
        offset: [320, 550],
        fill: d.fill,
        palette: d.palette,
        color: d.color,
        header: true
      };
    });

  d3.select('.explore .map-container')
    .call(drawExplore, baseConfigs);

  d3.select('.mexico-city .map-container')
    .call(drawFromConfigs, otherConfigs.mexicoCity);

  d3.select('.guadalajara .map-container')
    .call(drawFromConfigs, otherConfigs.guadalajara);

  d3.select('.border-cities .map-container')
    .call(drawFromConfigs, otherConfigs.borderCities);

  d3.select('.safe-south .map-container')
    .call(drawFromConfigs, otherConfigs.safeSouth);

  d3.select('.education-divide .map-container')
    .call(drawFromConfigs, otherConfigs.educationDivide);

  function drawFromConfigs(selection, configs) {
    configs.forEach(function(config) {
      var map = selection.append('div')
        .style('display', 'inline-block')
        .attr('class', 'map-container ' + config.name.toLowerCase());

      map.append('h2')
        .style('display', config.header ? 'block' : 'none')
        .style('color', config.color)
        .text(config.name);

      var mousemove = function(d) {
        return mousemove_map.call(this, configs, d);
      };
      var mouseleave = function(d) {
        return mouseleave_map.call(this, configs, d);
      };
      config.map = appendMap(map, config);
      config.map.select('svg')
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);

      var legend = map.append('div')
        .attr('class', 'legend')
        .style('width', config.width + 'px')
        .style('height', '20px')
        .style('font-size', "10px");

      var legendData = config.palette.map(function(d,i) {
        return {
          i: i,
          name: config.name.toLowerCase(),
          color: d
        };
      });

      var legendRects = legend.selectAll('.rect').data(legendData);

      legendRects.enter().append('div')
        .attr('class', 'rect');

      legendRects
        .style('display', 'inline-block')
        .style('background-color', function(d) { return d.color; })
        .style('width', config.width/5 + 'px')
        .style('height', '20px')
        .on('mouseenter', function(d) {
          return mouseenter_legend(configs, d);
        })
        .on('mouseleave', function(d) {
          return mouseleave_legend(configs, d);
        });

      legendRects.exit().remove();
    });
  }

  function drawExplore(selection, configs) {
    var config = configs.filter(function(d) {
      return d.name == "Income";
    })[0];

    var map = selection.append('div')
      .style('display', 'inline-block');

    var mousemove = function(d) {
      return mousemove_map.call(this, [config], d);
    };
    var mouseleave = function(d) {
      return mouseleave_map.call(this, [config], d);
    };
    config.map = appendMap(map, config);
    config.map.select('svg')
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave);

    var legend = d3.select('.explore').append('div')
      .attr('class', 'legend');

    var legendData = configs
      .map(function(c) {
        return c.palette.map(function(d,i) {
          return {
            i: i,
            name: c.name.toLowerCase(),
            color: d,
            mainColor: c.color
          };
        });
      });

    var legendRows = legend.selectAll('.row').data(legendData);

    legendRows.enter().append('div')
      .attr('class', 'row');

    legendRows.append('span')
      .attr('class', 'title')
      .style('color', function(d) { return d[0].mainColor; })
      .text(function(d, i) {
        var name = d[0].name.charAt(0).toUpperCase() + d[0].name.slice(1);
        return i == 0 ? "> " + name : name;
      })
      .on('click', function(d) {

        // highlight selected variable title
        legendRows.selectAll('.title')
          .text(function(title) {
            var name = title[0].name.charAt(0).toUpperCase() +
                          title[0].name.slice(1);
            name = (title[0].name == d[0].name) ? "> " + name : name;

            return name;
          });

        // Redraw the map with the new variable
        var map = config.map;
        baseConfigs = getBaseConfigs();
        config = baseConfigs.filter(function(c) {
          return c.name.toLowerCase() == d[0].name;
        })[0];
        config.map = map;
        redraw(config);
      });

    var legendRects = legendRows.selectAll('.rect')
      .data(function(d) { return d; });

    legendRects.enter().append('div')
      .attr('class', 'rect');

    legendRects
      .style('display', 'inline-block')
      .style('background-color', function(d) { return d.color; })
      .on('mouseenter', function(d) {
        var hoverConfig = configs.slice().filter(function(c) {
          return c.name.toLowerCase() == d.name;
        })[0];
        hoverConfig.map = config.map;
        hoverConfig.fill = config.fill;
        return mouseenter_legend([hoverConfig], d);
      })
      .on('mouseleave', function(d) {
        return mouseleave_legend([config], d);
      })
      .on('click', function(d) {

        // highlight selected variable title
        legendRows.selectAll('.title')
          .text(function(title) {
            var name = title[0].name.charAt(0).toUpperCase() +
                          title[0].name.slice(1);
            name = (title[0].name == d.name) ? "> " + name : name;

            return name;
          });

        // Redraw the map with the new variable
        var map = config.map;
        baseConfigs = getBaseConfigs();
        config = baseConfigs.filter(function(c) {
          return c.name.toLowerCase() == d.name;
        })[0];
        config.map = map;
        redraw(config);
        /*
        // Redraw with the filtered municipios based on legend hover
        var hoverConfig = configs.slice().filter(function(c) {
          return c.name.toLowerCase() == d.name;
        })[0];
        hoverConfig.map = config.map;
        hoverConfig.fill = config.fill;
        mouseenter_legend([hoverConfig], d);
        */
      });


      function redraw(config) {

        drawMap(config.map.select('canvas').node(), config);

        var mousemove = function(d) {
          return mousemove_map.call(this, [config], d);
        };
        var mouseleave = function(d) {
          return mouseleave_map.call(this, [config], d);
        };
        config.map.select('svg')
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave);
      }
  }

  function mouseenter_legend(configs, hovered) {
    configs.forEach(function(config) {
      var name = "quantile_" + hovered.name;

      var fill = function(d) {
        var i = d[name] - 1;
        return i == hovered.i ?
          config.fill(d) : 'white';
      };

      var stroke = function(d) {
        return "grey";
      };

      drawMap(config.map.select('canvas').node(), {
        name: config.name,
        width: config.width,
        height: config.height,
        scale: config.scale,
        offset: config.offset,
        fill: fill,
        stroke: stroke,
        palette: config.palette
      });
    });
  }

  function mouseleave_legend(configs, d) {
    configs.forEach(function(config) {
      config.stroke = undefined;
      drawMap(config.map.select('canvas').node(), config);
    });
  }

  function mousemove_map(configs, config) {
    var hovered = hoveredMuni(d3.mouse(this));

    if (hovered !== undefined) {
      var offset = config.offset,
          scale = config.scale;

      var left = d3.event.clientX +
            (window.innerWidth - d3.event.clientX > 300 ? 60 : -300);

      var top = d3.event.clientY - 240;

      tooltip
        .style('display', 'inline')
        .style('left', left + 'px')
        .style('top', top + 'px');
      tooltip.select('.state')
        .text(hovered.name.state);
      tooltip.select('.muni')
        .text(hovered.name.muni);
      tooltip.select('.population')
        .text("    (pop. " + d3.format("0,000")(hovered.population) + ")");


      makeBarChart(tooltip.select('svg').select('g'), hovered, carto);

      tooltip.selectAll('path').classed('highlight', false);
      tooltip.select('path.state-' + hovered.id.slice(0,2))
        .classed('highlight', true);

      // Highlight muni on all maps
      configs.forEach(function(config) {
        var svg = config.map.select('svg');

        var hover = svg.selectAll('.hover').data([hovered]);

        hover.enter().append('rect')
          .attr('class', 'hover');

        hover
          .attr('x', scale*(hovered.x - offset[0]))
          .attr('y', scale*(hovered.y - offset[1]))
          .attr('width', scale*hovered.width)
          .attr('height', scale*hovered.width)
          .style('fill', 'none')
          .style('stroke', 'rgb(255, 61, 0)');

        hover.exit().remove();
      });
    }

    function hoveredMuni(coords) {
      var x = coords[0],
          y = coords[1],
          offset = config.offset,
          scale = config.scale;

      var hovered = data.filter(function(d) {
        return x >= scale*(d.x - offset[0]) &&
               x <= scale*(d.x - offset[0] + d.width) &&
               y >= scale*(d.y - offset[1]) &&
               y <= scale*(d.y - offset[1] + d.width);
      });

      return hovered.length > 0 ? hovered[0] : undefined;
    }
  }

  function mouseleave_map(configs) {
    configs.forEach(function(config) {
      config.map.select('svg').selectAll('.hover').remove();
    });

    tooltip.style('display', 'none');
  }

  function appendMap(selection, config) {
    var map = createMap(config);
    selection.node().appendChild(map.node());
    return map;
  }

  function createMap(config) {
    if (config === undefined) config = {};

    var canvas = document.createElement('canvas');

    drawMap(canvas, config);

    var map = d3.select(document.createElement('div'))
      .attr('class', 'map')
      .style('display', 'inline-block')
      .style('width', config.width + "px")
      .style('height', config.height + "px");

    map.node().appendChild(canvas);

    // svg for hover events
    map.append('svg')
      .style('position', 'absolute')
      .attr('width', config.width)
      .attr('height', config.height)
      .datum(config);

    map.select('canvas').style('position', 'absolute');

    return map;
  }

  function drawMap(canvas, config) {
    var context = canvas.getContext('2d'),
        width = config.width || 960,
        height = config.height || 960,
        fill = config.fill || function(d) { return 'steelblue'; },
        stroke = config.stroke || function(d) { return 'rgba(0,0,0,0)'; },
        offset = config.offset || [0, 0],
        scale = config.scale || 1;

    canvas.width = width;
    canvas.height = height;
    context.lineWidth = .3;

    data.forEach(function(d) {
      var x = scale*(d.x - offset[0]),
          y = scale*(d.y - offset[1]),
          w = scale*d.width,
          h = scale*d.width;

      context.strokeStyle = stroke(d);
      context.strokeRect(x, y, w, h);

      context.fillStyle = fill(d);
      context.fillRect(x, y, w, h);
    });
  }

  function getBaseConfigs() {
    var baseConfigs = carto.colors.map(function(color) {
      var name = "quantile_" + color.name.toLowerCase();
      var fill = function(d) {
        return color.palette[d[name] - 1];
      };

      return {
        name: color.name,
        width: 1020,
        height: 650,
        scale: 1.1,
        offset: [80, 200],
        fill: fill,
        palette: color.palette,
        color: color.color,
        header: false
      };
    });

    var orderedIndexes = [
      'Income',
      'Education',
      'Housing',
      'Health',
      'Jobs',
      'Safety'
    ];

    return orderedIndexes.map(function(name) {
      return baseConfigs.filter(function(config) {
        return name == config.name;
      })[0];
    });
  }
}
function makeBarChart(svg, datum, data) {

  svg.call(renderBarChart, makeBarData(datum, data.colors), data);

  return svg;

  function makeBarData(datum, colors) {
    return colors.map(function(d) {
      var name = "index_" + d.name.toLowerCase();
      return {
        name: d.name,
        color: d.color,
        value: datum[name]
      };
    });
  }

  function renderBarChart(svg, datum, data) {
    var scale = {
      x: d3.scale.linear()
          .domain([0, 100])
          .range([0, 140]),
      y: d3.scale.ordinal()
          .domain(["Health", "Housing", "Income", "Jobs", "Education", "Safety"])
          .rangeRoundBands([100, 0], .1)
    };

    var scales = makeScales(data);

    var bars = svg.selectAll('.bar').data(datum);

    bars.enter().append('rect')
      .attr('class', 'bar');

    bars
      .attr('x', function(d) {
        var x = scales[d.name],
            median = data.summaries[d.name.toLowerCase()]['medians'];

        return clamp(d.value > median ? x(median) : x(d.value), 0, 140);
      })
      .attr('y', function(d) { return scale.y(d.name); })
      .attr('width', function(d) {
        var x = scales[d.name],
            median = data.summaries[d.name.toLowerCase()]['medians'],
            w = Math.abs(x(d.value) - x(median));

        return w > 70 ? 70 : w;
      })
      .attr('height', function(d) { return scale.y.rangeBand(); })
      .style('fill', function(d) { return d.color; });

    bars.exit().remove();

    var valueText = svg.selectAll('.value').data(datum);

    valueText.enter().append('text')
      .attr('class', 'value');

    valueText
      .attr('x', function(d) {
        var median = data.summaries[d.name.toLowerCase()]['medians'];
        return d.value > median ? 138 : 2;
      })
      .attr('y', function(d) { return scale.y(d.name); })
      .attr('dy', 11)
      .attr('font-family', 'sans-serif')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('fill', "white")
      .attr('text-anchor', function(d) {
        var x = scales[d.name],
            median = data.summaries[d.name.toLowerCase()]['medians'];
        return d.value > median ? "end" : "start";
      })
      .text(function(d) {
        var x = scales[d.name]
        if (x(d.value) >= 140) return "+";
        if (x(d.value) <= 0) return "-";
      });

    valueText.exit().remove();

    var nameText = svg.selectAll('.name').data(datum);

    nameText.enter().append('text')
      .attr('class', 'name');

    nameText
      .attr('x', function(d) { return scale.x(0) - 3; })
      .attr('y', function(d) { return scale.y(d.name); })
      .attr('dy', 11)
      .attr('font-family', 'sans-serif')
      .attr('font-size', 13)
      .attr('fill', function(d) { return d.color; })
      .attr('text-anchor', 'end')
      .text(function(d) { return d.name; });

    nameText.exit().remove();
  }

  function makeScales(data) {
    var scales = {};
    data.colors.forEach(function(d) {
      var name = d.name.toLowerCase(),
          q10 = data.summaries[name]['q10'],
          median = data.summaries[name]['medians'],
          q90 = data.summaries[name]['q90'];

      scales[d.name] = d3.scale.linear()
                        .domain([q10, median, q90])
                        .range([0, 70, 140]);
    });
    return scales;
  }

  function clamp(d, min, max) {
    return d < min ? min :
           d > max ? max : d;
  }
}
