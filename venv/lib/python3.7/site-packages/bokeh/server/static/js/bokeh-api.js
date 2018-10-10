(function() { var define = undefined; return (function outer(modules, cache, entry) {
  if (Bokeh != null) {
    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
      var plugin = Bokeh.require(entry[0]);
      Bokeh.Models.register_models(plugin.models);

      for (var name in plugin) {
        if (name !== "models") {
          Bokeh[name] = plugin[name];
        }
      }
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
({"api":[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var LinAlg = require("./api/linalg");
exports.LinAlg = LinAlg;
var Charts = require("./api/charts");
exports.Charts = Charts;
var Plotting = require("./api/plotting");
exports.Plotting = Plotting;
var document_1 = require("./document");
exports.Document = document_1.Document;
var sprintf = require("sprintf");
exports.sprintf = sprintf;
__export(require("./api/models"));

},{"./api/charts":"api/charts","./api/linalg":"api/linalg","./api/models":"api/models","./api/plotting":"api/plotting","./document":"document","sprintf":"sprintf"}],"api/charts":[function(require,module,exports){
"use strict";
var cumsum, hexcolor2rgb, is_dark, num2hexcolor, sum;
var _ = require("underscore");
var sprintf = require("sprintf");
var models = require("./models");
var palettes = require("./palettes");
sum = function (array) {
    return array.reduce(((function (_this) {
        return function (a, b) {
            return a + b;
        };
    })(this)), 0);
};
cumsum = function (array) {
    var result;
    result = [];
    array.reduce((function (a, b, i) {
        return result[i] = a + b;
    }), 0);
    return result;
};
num2hexcolor = function (num) {
    return sprintf("#%06x", num);
};
hexcolor2rgb = function (color) {
    var b, g, r;
    r = parseInt(color.substr(1, 2), 16);
    g = parseInt(color.substr(3, 2), 16);
    b = parseInt(color.substr(5, 2), 16);
    return [r, g, b];
};
is_dark = function (arg) {
    var b, g, l, r;
    r = arg[0], g = arg[1], b = arg[2];
    l = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return l >= 0.6;
};
exports.pie = function (data, opts) {
    var angle_span, colors, cumulative_values, cx, cy, end_angle, end_angles, g1, g2, h1, half_angles, half_radius, hover, i, inner_radius, k, labels, normalized_values, outer_radius, palette, plot, r1, r2, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, source, start_angle, start_angles, text_angles, text_colors, text_cx, text_cy, to_cartesian, to_radians, tooltip, total_value, values, xdr, ydr;
    if (opts == null) {
        opts = {};
    }
    labels = [];
    values = [];
    for (i = k = 0, ref = Math.min(data.labels.length, data.values.length); 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        if (data.values[i] > 0) {
            labels.push(data.labels[i]);
            values.push(data.values[i]);
        }
    }
    start_angle = (ref1 = opts.start_angle) != null ? ref1 : 0;
    end_angle = (ref2 = opts.end_angle) != null ? ref2 : start_angle + 2 * Math.PI;
    angle_span = Math.abs(end_angle - start_angle);
    to_radians = function (x) {
        return angle_span * x;
    };
    total_value = sum(values);
    normalized_values = values.map(function (v) {
        return v / total_value;
    });
    cumulative_values = cumsum(normalized_values);
    end_angles = cumulative_values.map(function (v) {
        return start_angle + to_radians(v);
    });
    start_angles = [start_angle].concat(end_angles.slice(0, -1));
    half_angles = _.zip(start_angles, end_angles).map((function (_this) {
        return function (arg) {
            var end, start;
            start = arg[0], end = arg[1];
            return (start + end) / 2;
        };
    })(this));
    if (opts.center == null) {
        cx = 0;
        cy = 0;
    }
    else if (_.isArray(opts.center)) {
        cx = opts.center[0];
        cy = opts.center[1];
    }
    else {
        cx = opts.center.x;
        cy = opts.center.y;
    }
    inner_radius = (ref3 = opts.inner_radius) != null ? ref3 : 0;
    outer_radius = (ref4 = opts.outer_radius) != null ? ref4 : 1;
    if (_.isArray(opts.palette)) {
        palette = opts.palette;
    }
    else {
        palette = palettes[(ref5 = opts.palette) != null ? ref5 : "Spectral11"].map(num2hexcolor);
    }
    colors = (function () {
        var m, ref6, results;
        results = [];
        for (i = m = 0, ref6 = normalized_values.length; 0 <= ref6 ? m < ref6 : m > ref6; i = 0 <= ref6 ? ++m : --m) {
            results.push(palette[i % palette.length]);
        }
        return results;
    })();
    text_colors = colors.map(function (c) {
        if (is_dark(hexcolor2rgb(c))) {
            return "white";
        }
        else {
            return "black";
        }
    });
    to_cartesian = function (r, alpha) {
        return [r * Math.cos(alpha), r * Math.sin(alpha)];
    };
    half_radius = (inner_radius + outer_radius) / 2;
    ref6 = _.unzip(half_angles.map((function (_this) {
        return function (half_angle) {
            return to_cartesian(half_radius, half_angle);
        };
    })(this))), text_cx = ref6[0], text_cy = ref6[1];
    text_cx = text_cx.map(function (x) {
        return x + cx;
    });
    text_cy = text_cy.map(function (y) {
        return y + cy;
    });
    text_angles = half_angles.map(function (a) {
        if (a >= Math.PI / 2 && a <= 3 * Math.PI / 2) {
            return a + Math.PI;
        }
        else {
            return a;
        }
    });
    source = new Bokeh.ColumnDataSource({
        data: {
            labels: labels,
            values: values,
            percentages: normalized_values.map((function (_this) {
                return function (v) {
                    return sprintf("%.2f%%", v * 100);
                };
            })(this)),
            start_angles: start_angles,
            end_angles: end_angles,
            text_angles: text_angles,
            colors: colors,
            text_colors: text_colors,
            text_cx: text_cx,
            text_cy: text_cy
        }
    });
    g1 = new models.AnnularWedge({
        x: cx,
        y: cy,
        inner_radius: inner_radius,
        outer_radius: outer_radius,
        start_angle: {
            field: "start_angles"
        },
        end_angle: {
            field: "end_angles"
        },
        line_color: null,
        line_width: 1,
        fill_color: {
            field: "colors"
        }
    });
    h1 = new models.AnnularWedge({
        x: cx,
        y: cy,
        inner_radius: inner_radius,
        outer_radius: outer_radius,
        start_angle: {
            field: "start_angles"
        },
        end_angle: {
            field: "end_angles"
        },
        line_color: null,
        line_width: 1,
        fill_color: {
            field: "colors"
        },
        fill_alpha: 0.8
    });
    r1 = new models.GlyphRenderer({
        data_source: source,
        glyph: g1,
        hover_glyph: h1
    });
    g2 = new models.Text({
        x: {
            field: "text_cx"
        },
        y: {
            field: "text_cy"
        },
        text: {
            field: (ref7 = opts.slice_labels) != null ? ref7 : "labels"
        },
        angle: {
            field: "text_angles"
        },
        text_align: "center",
        text_baseline: "middle",
        text_color: {
            field: "text_colors"
        },
        text_font_size: "9pt"
    });
    r2 = new models.GlyphRenderer({
        data_source: source,
        glyph: g2
    });
    xdr = new models.DataRange1d({
        renderers: [r1],
        range_padding: 0.2
    });
    ydr = new models.DataRange1d({
        renderers: [r1],
        range_padding: 0.2
    });
    plot = new models.Plot({
        x_range: xdr,
        y_range: ydr
    });
    if (opts.width != null) {
        plot.plot_width = opts.width;
    }
    if (opts.height != null) {
        plot.plot_height = opts.height;
    }
    plot.add_renderers(r1, r2);
    tooltip = "<div>@labels</div><div><b>@values</b> (@percentages)</div>";
    hover = new models.HoverTool({
        renderers: [r1],
        tooltips: tooltip
    });
    plot.add_tools(hover);
    return plot;
};
exports.bar = function (data, opts) {
    var anchor, attachment, bottom, column_names, columns, dy, g1, hover, i, j, k, label, labels, left, len, len1, len2, len3, len4, m, n, name, o, orientation, p, palette, plot, q, r, r1, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, renderers, right, row, rows, s, source, stacked, tooltip, top, v, xaxis, xdr, xformatter, yaxis, ydr;
    if (opts == null) {
        opts = {};
    }
    column_names = data[0];
    rows = data.slice(1);
    columns = (function () {
        var k, len, results;
        results = [];
        for (k = 0, len = column_names.length; k < len; k++) {
            name = column_names[k];
            results.push([]);
        }
        return results;
    })();
    for (k = 0, len = rows.length; k < len; k++) {
        row = rows[k];
        for (i = m = 0, len1 = row.length; m < len1; i = ++m) {
            v = row[i];
            columns[i].push(v);
        }
    }
    labels = columns[0].map(function (v) {
        return v.toString();
    });
    columns = columns.slice(1);
    yaxis = new models.CategoricalAxis();
    ydr = new models.FactorRange({
        factors: labels
    });
    if (opts.axis_number_format != null) {
        xformatter = new models.NumeralTickFormatter({
            format: opts.axis_number_format
        });
    }
    else {
        xformatter = new models.BasicTickFormatter();
    }
    xaxis = new models.LinearAxis({
        formatter: xformatter
    });
    xdr = new models.DataRange1d({
        start: 0
    });
    if (_.isArray(opts.palette)) {
        palette = opts.palette;
    }
    else {
        palette = palettes[(ref = opts.palette) != null ? ref : "Spectral11"].map(num2hexcolor);
    }
    stacked = (ref1 = opts.stacked) != null ? ref1 : false;
    orientation = (ref2 = opts.orientation) != null ? ref2 : "horizontal";
    renderers = [];
    if (stacked) {
        left = [];
        right = [];
        for (i = n = 0, ref3 = columns.length; 0 <= ref3 ? n < ref3 : n > ref3; i = 0 <= ref3 ? ++n : --n) {
            bottom = [];
            top = [];
            for (j = o = 0, len2 = labels.length; o < len2; j = ++o) {
                label = labels[j];
                if (i === 0) {
                    left.push(0);
                    right.push(columns[i][j]);
                }
                else {
                    left[j] += columns[i - 1][j];
                    right[j] += columns[i][j];
                }
                bottom.push(label + ":0");
                top.push(label + ":1");
            }
            source = new Bokeh.ColumnDataSource({
                data: {
                    left: _.clone(left),
                    right: _.clone(right),
                    top: top,
                    bottom: bottom,
                    labels: labels,
                    values: columns[i],
                    columns: (function () {
                        var len3, p, ref4, results;
                        ref4 = columns[i];
                        results = [];
                        for (p = 0, len3 = ref4.length; p < len3; p++) {
                            v = ref4[p];
                            results.push(column_names[i + 1]);
                        }
                        return results;
                    })()
                }
            });
            g1 = new models.Quad({
                left: {
                    field: "left"
                },
                bottom: {
                    field: "bottom"
                },
                right: {
                    field: "right"
                },
                top: {
                    field: "top"
                },
                line_color: null,
                fill_color: palette[i % palette.length]
            });
            r1 = new models.GlyphRenderer({
                data_source: source,
                glyph: g1
            });
            renderers.push(r1);
        }
    }
    else {
        dy = 1 / columns.length;
        for (i = p = 0, ref4 = columns.length; 0 <= ref4 ? p < ref4 : p > ref4; i = 0 <= ref4 ? ++p : --p) {
            left = [];
            right = [];
            bottom = [];
            top = [];
            for (j = q = 0, len3 = labels.length; q < len3; j = ++q) {
                label = labels[j];
                left.push(0);
                right.push(columns[i][j]);
                bottom.push(label + ":" + (i * dy));
                top.push(label + ":" + ((i + 1) * dy));
            }
            source = new Bokeh.ColumnDataSource({
                data: {
                    left: left,
                    right: right,
                    top: top,
                    bottom: bottom,
                    labels: labels,
                    values: columns[i],
                    columns: (function () {
                        var len4, ref5, results, s;
                        ref5 = columns[i];
                        results = [];
                        for (s = 0, len4 = ref5.length; s < len4; s++) {
                            v = ref5[s];
                            results.push(column_names[i + 1]);
                        }
                        return results;
                    })()
                }
            });
            g1 = new models.Quad({
                left: {
                    field: "left"
                },
                bottom: {
                    field: "bottom"
                },
                right: {
                    field: "right"
                },
                top: {
                    field: "top"
                },
                line_color: null,
                fill_color: palette[i % palette.length]
            });
            r1 = new models.GlyphRenderer({
                data_source: source,
                glyph: g1
            });
            renderers.push(r1);
        }
    }
    if (orientation === "vertical") {
        ref5 = [ydr, xdr], xdr = ref5[0], ydr = ref5[1];
        ref6 = [yaxis, xaxis], xaxis = ref6[0], yaxis = ref6[1];
        for (s = 0, len4 = renderers.length; s < len4; s++) {
            r = renderers[s];
            data = r.data_source.data;
            ref7 = [data.bottom, data.left], data.left = ref7[0], data.bottom = ref7[1];
            ref8 = [data.top, data.right], data.right = ref8[0], data.top = ref8[1];
        }
    }
    plot = new models.Plot({
        x_range: xdr,
        y_range: ydr
    });
    if (opts.width != null) {
        plot.plot_width = opts.width;
    }
    if (opts.height != null) {
        plot.plot_height = opts.height;
    }
    plot.add_renderers.apply(plot, renderers);
    plot.add_layout(yaxis, "left");
    plot.add_layout(xaxis, "below");
    tooltip = "<div>@labels</div><div>@columns:&nbsp<b>@values</b></div>";
    if (orientation === "horizontal") {
        anchor = "center_right";
        attachment = "horizontal";
    }
    else {
        anchor = "top_center";
        attachment = "vertical";
    }
    hover = new models.HoverTool({
        renderers: renderers,
        tooltips: tooltip,
        point_policy: "snap_to_data",
        anchor: anchor,
        attachment: attachment,
        show_arrow: opts.show_arrow
    });
    plot.add_tools(hover);
    return plot;
};

},{"./models":"api/models","./palettes":"api/palettes","sprintf":"sprintf","underscore":"underscore"}],"api/linalg":[function(require,module,exports){
"use strict";
function transpose(array) {
    var rows = array.length;
    var cols = array[0].length;
    var transposed = [];
    for (var j = 0; j < cols; j++) {
        transposed[j] = [];
        for (var i = 0; i < rows; i++) {
            transposed[j][i] = array[i][j];
        }
    }
    return transposed;
}
exports.transpose = transpose;
function linspace(start, stop, num) {
    if (num === void 0) { num = 100; }
    var step = (stop - start) / (num - 1);
    var array = new Array(num);
    for (var i = 0; i < num; i++) {
        array[i] = start + step * i;
    }
    return array;
}
exports.linspace = linspace;
function arange(start, stop, step) {
    if (step === void 0) { step = 1; }
    var num = Math.ceil((stop - start) / step);
    var array = new Array(num);
    for (var i = 0; i < num; i++) {
        array[i] = start + step * i;
    }
    return array;
}
exports.arange = arange;

},{}],"api/models":[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require("../models/index"));

},{"../models/index":"models/index"}],"api/palettes":[function(require,module,exports){
"use strict";
exports.YlGn3 = [0x31a354, 0xaddd8e, 0xf7fcb9];
exports.YlGn4 = [0x238443, 0x78c679, 0xc2e699, 0xffffcc];
exports.YlGn5 = [0x006837, 0x31a354, 0x78c679, 0xc2e699, 0xffffcc];
exports.YlGn6 = [0x006837, 0x31a354, 0x78c679, 0xaddd8e, 0xd9f0a3, 0xffffcc];
exports.YlGn7 = [0x005a32, 0x238443, 0x41ab5d, 0x78c679, 0xaddd8e, 0xd9f0a3, 0xffffcc];
exports.YlGn8 = [0x005a32, 0x238443, 0x41ab5d, 0x78c679, 0xaddd8e, 0xd9f0a3, 0xf7fcb9, 0xffffe5];
exports.YlGn9 = [0x004529, 0x006837, 0x238443, 0x41ab5d, 0x78c679, 0xaddd8e, 0xd9f0a3, 0xf7fcb9, 0xffffe5];
exports.YlGnBu3 = [0x2c7fb8, 0x7fcdbb, 0xedf8b1];
exports.YlGnBu4 = [0x225ea8, 0x41b6c4, 0xa1dab4, 0xffffcc];
exports.YlGnBu5 = [0x253494, 0x2c7fb8, 0x41b6c4, 0xa1dab4, 0xffffcc];
exports.YlGnBu6 = [0x253494, 0x2c7fb8, 0x41b6c4, 0x7fcdbb, 0xc7e9b4, 0xffffcc];
exports.YlGnBu7 = [0x0c2c84, 0x225ea8, 0x1d91c0, 0x41b6c4, 0x7fcdbb, 0xc7e9b4, 0xffffcc];
exports.YlGnBu8 = [0x0c2c84, 0x225ea8, 0x1d91c0, 0x41b6c4, 0x7fcdbb, 0xc7e9b4, 0xedf8b1, 0xffffd9];
exports.YlGnBu9 = [0x081d58, 0x253494, 0x225ea8, 0x1d91c0, 0x41b6c4, 0x7fcdbb, 0xc7e9b4, 0xedf8b1, 0xffffd9];
exports.GnBu3 = [0x43a2ca, 0xa8ddb5, 0xe0f3db];
exports.GnBu4 = [0x2b8cbe, 0x7bccc4, 0xbae4bc, 0xf0f9e8];
exports.GnBu5 = [0x0868ac, 0x43a2ca, 0x7bccc4, 0xbae4bc, 0xf0f9e8];
exports.GnBu6 = [0x0868ac, 0x43a2ca, 0x7bccc4, 0xa8ddb5, 0xccebc5, 0xf0f9e8];
exports.GnBu7 = [0x08589e, 0x2b8cbe, 0x4eb3d3, 0x7bccc4, 0xa8ddb5, 0xccebc5, 0xf0f9e8];
exports.GnBu8 = [0x08589e, 0x2b8cbe, 0x4eb3d3, 0x7bccc4, 0xa8ddb5, 0xccebc5, 0xe0f3db, 0xf7fcf0];
exports.GnBu9 = [0x084081, 0x0868ac, 0x2b8cbe, 0x4eb3d3, 0x7bccc4, 0xa8ddb5, 0xccebc5, 0xe0f3db, 0xf7fcf0];
exports.BuGn3 = [0x2ca25f, 0x99d8c9, 0xe5f5f9];
exports.BuGn4 = [0x238b45, 0x66c2a4, 0xb2e2e2, 0xedf8fb];
exports.BuGn5 = [0x006d2c, 0x2ca25f, 0x66c2a4, 0xb2e2e2, 0xedf8fb];
exports.BuGn6 = [0x006d2c, 0x2ca25f, 0x66c2a4, 0x99d8c9, 0xccece6, 0xedf8fb];
exports.BuGn7 = [0x005824, 0x238b45, 0x41ae76, 0x66c2a4, 0x99d8c9, 0xccece6, 0xedf8fb];
exports.BuGn8 = [0x005824, 0x238b45, 0x41ae76, 0x66c2a4, 0x99d8c9, 0xccece6, 0xe5f5f9, 0xf7fcfd];
exports.BuGn9 = [0x00441b, 0x006d2c, 0x238b45, 0x41ae76, 0x66c2a4, 0x99d8c9, 0xccece6, 0xe5f5f9, 0xf7fcfd];
exports.PuBuGn3 = [0x1c9099, 0xa6bddb, 0xece2f0];
exports.PuBuGn4 = [0x02818a, 0x67a9cf, 0xbdc9e1, 0xf6eff7];
exports.PuBuGn5 = [0x016c59, 0x1c9099, 0x67a9cf, 0xbdc9e1, 0xf6eff7];
exports.PuBuGn6 = [0x016c59, 0x1c9099, 0x67a9cf, 0xa6bddb, 0xd0d1e6, 0xf6eff7];
exports.PuBuGn7 = [0x016450, 0x02818a, 0x3690c0, 0x67a9cf, 0xa6bddb, 0xd0d1e6, 0xf6eff7];
exports.PuBuGn8 = [0x016450, 0x02818a, 0x3690c0, 0x67a9cf, 0xa6bddb, 0xd0d1e6, 0xece2f0, 0xfff7fb];
exports.PuBuGn9 = [0x014636, 0x016c59, 0x02818a, 0x3690c0, 0x67a9cf, 0xa6bddb, 0xd0d1e6, 0xece2f0, 0xfff7fb];
exports.PuBu3 = [0x2b8cbe, 0xa6bddb, 0xece7f2];
exports.PuBu4 = [0x0570b0, 0x74a9cf, 0xbdc9e1, 0xf1eef6];
exports.PuBu5 = [0x045a8d, 0x2b8cbe, 0x74a9cf, 0xbdc9e1, 0xf1eef6];
exports.PuBu6 = [0x045a8d, 0x2b8cbe, 0x74a9cf, 0xa6bddb, 0xd0d1e6, 0xf1eef6];
exports.PuBu7 = [0x034e7b, 0x0570b0, 0x3690c0, 0x74a9cf, 0xa6bddb, 0xd0d1e6, 0xf1eef6];
exports.PuBu8 = [0x034e7b, 0x0570b0, 0x3690c0, 0x74a9cf, 0xa6bddb, 0xd0d1e6, 0xece7f2, 0xfff7fb];
exports.PuBu9 = [0x023858, 0x045a8d, 0x0570b0, 0x3690c0, 0x74a9cf, 0xa6bddb, 0xd0d1e6, 0xece7f2, 0xfff7fb];
exports.BuPu3 = [0x8856a7, 0x9ebcda, 0xe0ecf4];
exports.BuPu4 = [0x88419d, 0x8c96c6, 0xb3cde3, 0xedf8fb];
exports.BuPu5 = [0x810f7c, 0x8856a7, 0x8c96c6, 0xb3cde3, 0xedf8fb];
exports.BuPu6 = [0x810f7c, 0x8856a7, 0x8c96c6, 0x9ebcda, 0xbfd3e6, 0xedf8fb];
exports.BuPu7 = [0x6e016b, 0x88419d, 0x8c6bb1, 0x8c96c6, 0x9ebcda, 0xbfd3e6, 0xedf8fb];
exports.BuPu8 = [0x6e016b, 0x88419d, 0x8c6bb1, 0x8c96c6, 0x9ebcda, 0xbfd3e6, 0xe0ecf4, 0xf7fcfd];
exports.BuPu9 = [0x4d004b, 0x810f7c, 0x88419d, 0x8c6bb1, 0x8c96c6, 0x9ebcda, 0xbfd3e6, 0xe0ecf4, 0xf7fcfd];
exports.RdPu3 = [0xc51b8a, 0xfa9fb5, 0xfde0dd];
exports.RdPu4 = [0xae017e, 0xf768a1, 0xfbb4b9, 0xfeebe2];
exports.RdPu5 = [0x7a0177, 0xc51b8a, 0xf768a1, 0xfbb4b9, 0xfeebe2];
exports.RdPu6 = [0x7a0177, 0xc51b8a, 0xf768a1, 0xfa9fb5, 0xfcc5c0, 0xfeebe2];
exports.RdPu7 = [0x7a0177, 0xae017e, 0xdd3497, 0xf768a1, 0xfa9fb5, 0xfcc5c0, 0xfeebe2];
exports.RdPu8 = [0x7a0177, 0xae017e, 0xdd3497, 0xf768a1, 0xfa9fb5, 0xfcc5c0, 0xfde0dd, 0xfff7f3];
exports.RdPu9 = [0x49006a, 0x7a0177, 0xae017e, 0xdd3497, 0xf768a1, 0xfa9fb5, 0xfcc5c0, 0xfde0dd, 0xfff7f3];
exports.PuRd3 = [0xdd1c77, 0xc994c7, 0xe7e1ef];
exports.PuRd4 = [0xce1256, 0xdf65b0, 0xd7b5d8, 0xf1eef6];
exports.PuRd5 = [0x980043, 0xdd1c77, 0xdf65b0, 0xd7b5d8, 0xf1eef6];
exports.PuRd6 = [0x980043, 0xdd1c77, 0xdf65b0, 0xc994c7, 0xd4b9da, 0xf1eef6];
exports.PuRd7 = [0x91003f, 0xce1256, 0xe7298a, 0xdf65b0, 0xc994c7, 0xd4b9da, 0xf1eef6];
exports.PuRd8 = [0x91003f, 0xce1256, 0xe7298a, 0xdf65b0, 0xc994c7, 0xd4b9da, 0xe7e1ef, 0xf7f4f9];
exports.PuRd9 = [0x67001f, 0x980043, 0xce1256, 0xe7298a, 0xdf65b0, 0xc994c7, 0xd4b9da, 0xe7e1ef, 0xf7f4f9];
exports.OrRd3 = [0xe34a33, 0xfdbb84, 0xfee8c8];
exports.OrRd4 = [0xd7301f, 0xfc8d59, 0xfdcc8a, 0xfef0d9];
exports.OrRd5 = [0xb30000, 0xe34a33, 0xfc8d59, 0xfdcc8a, 0xfef0d9];
exports.OrRd6 = [0xb30000, 0xe34a33, 0xfc8d59, 0xfdbb84, 0xfdd49e, 0xfef0d9];
exports.OrRd7 = [0x990000, 0xd7301f, 0xef6548, 0xfc8d59, 0xfdbb84, 0xfdd49e, 0xfef0d9];
exports.OrRd8 = [0x990000, 0xd7301f, 0xef6548, 0xfc8d59, 0xfdbb84, 0xfdd49e, 0xfee8c8, 0xfff7ec];
exports.OrRd9 = [0x7f0000, 0xb30000, 0xd7301f, 0xef6548, 0xfc8d59, 0xfdbb84, 0xfdd49e, 0xfee8c8, 0xfff7ec];
exports.YlOrRd3 = [0xf03b20, 0xfeb24c, 0xffeda0];
exports.YlOrRd4 = [0xe31a1c, 0xfd8d3c, 0xfecc5c, 0xffffb2];
exports.YlOrRd5 = [0xbd0026, 0xf03b20, 0xfd8d3c, 0xfecc5c, 0xffffb2];
exports.YlOrRd6 = [0xbd0026, 0xf03b20, 0xfd8d3c, 0xfeb24c, 0xfed976, 0xffffb2];
exports.YlOrRd7 = [0xb10026, 0xe31a1c, 0xfc4e2a, 0xfd8d3c, 0xfeb24c, 0xfed976, 0xffffb2];
exports.YlOrRd8 = [0xb10026, 0xe31a1c, 0xfc4e2a, 0xfd8d3c, 0xfeb24c, 0xfed976, 0xffeda0, 0xffffcc];
exports.YlOrRd9 = [0x800026, 0xbd0026, 0xe31a1c, 0xfc4e2a, 0xfd8d3c, 0xfeb24c, 0xfed976, 0xffeda0, 0xffffcc];
exports.YlOrBr3 = [0xd95f0e, 0xfec44f, 0xfff7bc];
exports.YlOrBr4 = [0xcc4c02, 0xfe9929, 0xfed98e, 0xffffd4];
exports.YlOrBr5 = [0x993404, 0xd95f0e, 0xfe9929, 0xfed98e, 0xffffd4];
exports.YlOrBr6 = [0x993404, 0xd95f0e, 0xfe9929, 0xfec44f, 0xfee391, 0xffffd4];
exports.YlOrBr7 = [0x8c2d04, 0xcc4c02, 0xec7014, 0xfe9929, 0xfec44f, 0xfee391, 0xffffd4];
exports.YlOrBr8 = [0x8c2d04, 0xcc4c02, 0xec7014, 0xfe9929, 0xfec44f, 0xfee391, 0xfff7bc, 0xffffe5];
exports.YlOrBr9 = [0x662506, 0x993404, 0xcc4c02, 0xec7014, 0xfe9929, 0xfec44f, 0xfee391, 0xfff7bc, 0xffffe5];
exports.Purples3 = [0x756bb1, 0xbcbddc, 0xefedf5];
exports.Purples4 = [0x6a51a3, 0x9e9ac8, 0xcbc9e2, 0xf2f0f7];
exports.Purples5 = [0x54278f, 0x756bb1, 0x9e9ac8, 0xcbc9e2, 0xf2f0f7];
exports.Purples6 = [0x54278f, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0xf2f0f7];
exports.Purples7 = [0x4a1486, 0x6a51a3, 0x807dba, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0xf2f0f7];
exports.Purples8 = [0x4a1486, 0x6a51a3, 0x807dba, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0xefedf5, 0xfcfbfd];
exports.Purples9 = [0x3f007d, 0x54278f, 0x6a51a3, 0x807dba, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0xefedf5, 0xfcfbfd];
exports.Blues3 = [0x3182bd, 0x9ecae1, 0xdeebf7];
exports.Blues4 = [0x2171b5, 0x6baed6, 0xbdd7e7, 0xeff3ff];
exports.Blues5 = [0x08519c, 0x3182bd, 0x6baed6, 0xbdd7e7, 0xeff3ff];
exports.Blues6 = [0x08519c, 0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xeff3ff];
exports.Blues7 = [0x084594, 0x2171b5, 0x4292c6, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xeff3ff];
exports.Blues8 = [0x084594, 0x2171b5, 0x4292c6, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xdeebf7, 0xf7fbff];
exports.Blues9 = [0x08306b, 0x08519c, 0x2171b5, 0x4292c6, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xdeebf7, 0xf7fbff];
exports.Greens3 = [0x31a354, 0xa1d99b, 0xe5f5e0];
exports.Greens4 = [0x238b45, 0x74c476, 0xbae4b3, 0xedf8e9];
exports.Greens5 = [0x006d2c, 0x31a354, 0x74c476, 0xbae4b3, 0xedf8e9];
exports.Greens6 = [0x006d2c, 0x31a354, 0x74c476, 0xa1d99b, 0xc7e9c0, 0xedf8e9];
exports.Greens7 = [0x005a32, 0x238b45, 0x41ab5d, 0x74c476, 0xa1d99b, 0xc7e9c0, 0xedf8e9];
exports.Greens8 = [0x005a32, 0x238b45, 0x41ab5d, 0x74c476, 0xa1d99b, 0xc7e9c0, 0xe5f5e0, 0xf7fcf5];
exports.Greens9 = [0x00441b, 0x006d2c, 0x238b45, 0x41ab5d, 0x74c476, 0xa1d99b, 0xc7e9c0, 0xe5f5e0, 0xf7fcf5];
exports.Oranges3 = [0xe6550d, 0xfdae6b, 0xfee6ce];
exports.Oranges4 = [0xd94701, 0xfd8d3c, 0xfdbe85, 0xfeedde];
exports.Oranges5 = [0xa63603, 0xe6550d, 0xfd8d3c, 0xfdbe85, 0xfeedde];
exports.Oranges6 = [0xa63603, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0xfeedde];
exports.Oranges7 = [0x8c2d04, 0xd94801, 0xf16913, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0xfeedde];
exports.Oranges8 = [0x8c2d04, 0xd94801, 0xf16913, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0xfee6ce, 0xfff5eb];
exports.Oranges9 = [0x7f2704, 0xa63603, 0xd94801, 0xf16913, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0xfee6ce, 0xfff5eb];
exports.Reds3 = [0xde2d26, 0xfc9272, 0xfee0d2];
exports.Reds4 = [0xcb181d, 0xfb6a4a, 0xfcae91, 0xfee5d9];
exports.Reds5 = [0xa50f15, 0xde2d26, 0xfb6a4a, 0xfcae91, 0xfee5d9];
exports.Reds6 = [0xa50f15, 0xde2d26, 0xfb6a4a, 0xfc9272, 0xfcbba1, 0xfee5d9];
exports.Reds7 = [0x99000d, 0xcb181d, 0xef3b2c, 0xfb6a4a, 0xfc9272, 0xfcbba1, 0xfee5d9];
exports.Reds8 = [0x99000d, 0xcb181d, 0xef3b2c, 0xfb6a4a, 0xfc9272, 0xfcbba1, 0xfee0d2, 0xfff5f0];
exports.Reds9 = [0x67000d, 0xa50f15, 0xcb181d, 0xef3b2c, 0xfb6a4a, 0xfc9272, 0xfcbba1, 0xfee0d2, 0xfff5f0];
exports.Greys3 = [0x636363, 0xbdbdbd, 0xf0f0f0];
exports.Greys4 = [0x525252, 0x969696, 0xcccccc, 0xf7f7f7];
exports.Greys5 = [0x252525, 0x636363, 0x969696, 0xcccccc, 0xf7f7f7];
exports.Greys6 = [0x252525, 0x636363, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf7f7f7];
exports.Greys7 = [0x252525, 0x525252, 0x737373, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf7f7f7];
exports.Greys8 = [0x252525, 0x525252, 0x737373, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf0f0f0, 0xffffff];
exports.Greys9 = [0x000000, 0x252525, 0x525252, 0x737373, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf0f0f0, 0xffffff];
exports.Greys10 = [0x000000, 0x1c1c1c, 0x383838, 0x555555, 0x717171, 0x8d8d8d, 0xaaaaaa, 0xc6c6c6, 0xe2e2e2, 0xffffff];
exports.Greys11 = [0x000000, 0x191919, 0x333333, 0x4c4c4c, 0x666666, 0x7f7f7f, 0x999999, 0xb2b2b2, 0xcccccc, 0xe5e5e5, 0xffffff];
exports.Greys256 = [0x000000, 0x010101, 0x020202, 0x030303, 0x040404, 0x050505, 0x060606, 0x070707, 0x080808, 0x090909, 0x0a0a0a, 0x0b0b0b,
    0x0c0c0c, 0x0d0d0d, 0x0e0e0e, 0x0f0f0f, 0x101010, 0x111111, 0x121212, 0x131313, 0x141414, 0x151515, 0x161616, 0x171717,
    0x181818, 0x191919, 0x1a1a1a, 0x1b1b1b, 0x1c1c1c, 0x1d1d1d, 0x1e1e1e, 0x1f1f1f, 0x202020, 0x212121, 0x222222, 0x232323,
    0x242424, 0x252525, 0x262626, 0x272727, 0x282828, 0x292929, 0x2a2a2a, 0x2b2b2b, 0x2c2c2c, 0x2d2d2d, 0x2e2e2e, 0x2f2f2f,
    0x303030, 0x313131, 0x323232, 0x333333, 0x343434, 0x353535, 0x363636, 0x373737, 0x383838, 0x393939, 0x3a3a3a, 0x3b3b3b,
    0x3c3c3c, 0x3d3d3d, 0x3e3e3e, 0x3f3f3f, 0x404040, 0x414141, 0x424242, 0x434343, 0x444444, 0x454545, 0x464646, 0x474747,
    0x484848, 0x494949, 0x4a4a4a, 0x4b4b4b, 0x4c4c4c, 0x4d4d4d, 0x4e4e4e, 0x4f4f4f, 0x505050, 0x515151, 0x525252, 0x535353,
    0x545454, 0x555555, 0x565656, 0x575757, 0x585858, 0x595959, 0x5a5a5a, 0x5b5b5b, 0x5c5c5c, 0x5d5d5d, 0x5e5e5e, 0x5f5f5f,
    0x606060, 0x616161, 0x626262, 0x636363, 0x646464, 0x656565, 0x666666, 0x676767, 0x686868, 0x696969, 0x6a6a6a, 0x6b6b6b,
    0x6c6c6c, 0x6d6d6d, 0x6e6e6e, 0x6f6f6f, 0x707070, 0x717171, 0x727272, 0x737373, 0x747474, 0x757575, 0x767676, 0x777777,
    0x787878, 0x797979, 0x7a7a7a, 0x7b7b7b, 0x7c7c7c, 0x7d7d7d, 0x7e7e7e, 0x7f7f7f, 0x808080, 0x818181, 0x828282, 0x838383,
    0x848484, 0x858585, 0x868686, 0x878787, 0x888888, 0x898989, 0x8a8a8a, 0x8b8b8b, 0x8c8c8c, 0x8d8d8d, 0x8e8e8e, 0x8f8f8f,
    0x909090, 0x919191, 0x929292, 0x939393, 0x949494, 0x959595, 0x969696, 0x979797, 0x989898, 0x999999, 0x9a9a9a, 0x9b9b9b,
    0x9c9c9c, 0x9d9d9d, 0x9e9e9e, 0x9f9f9f, 0xa0a0a0, 0xa1a1a1, 0xa2a2a2, 0xa3a3a3, 0xa4a4a4, 0xa5a5a5, 0xa6a6a6, 0xa7a7a7,
    0xa8a8a8, 0xa9a9a9, 0xaaaaaa, 0xababab, 0xacacac, 0xadadad, 0xaeaeae, 0xafafaf, 0xb0b0b0, 0xb1b1b1, 0xb2b2b2, 0xb3b3b3,
    0xb4b4b4, 0xb5b5b5, 0xb6b6b6, 0xb7b7b7, 0xb8b8b8, 0xb9b9b9, 0xbababa, 0xbbbbbb, 0xbcbcbc, 0xbdbdbd, 0xbebebe, 0xbfbfbf,
    0xc0c0c0, 0xc1c1c1, 0xc2c2c2, 0xc3c3c3, 0xc4c4c4, 0xc5c5c5, 0xc6c6c6, 0xc7c7c7, 0xc8c8c8, 0xc9c9c9, 0xcacaca, 0xcbcbcb,
    0xcccccc, 0xcdcdcd, 0xcecece, 0xcfcfcf, 0xd0d0d0, 0xd1d1d1, 0xd2d2d2, 0xd3d3d3, 0xd4d4d4, 0xd5d5d5, 0xd6d6d6, 0xd7d7d7,
    0xd8d8d8, 0xd9d9d9, 0xdadada, 0xdbdbdb, 0xdcdcdc, 0xdddddd, 0xdedede, 0xdfdfdf, 0xe0e0e0, 0xe1e1e1, 0xe2e2e2, 0xe3e3e3,
    0xe4e4e4, 0xe5e5e5, 0xe6e6e6, 0xe7e7e7, 0xe8e8e8, 0xe9e9e9, 0xeaeaea, 0xebebeb, 0xececec, 0xededed, 0xeeeeee, 0xefefef,
    0xf0f0f0, 0xf1f1f1, 0xf2f2f2, 0xf3f3f3, 0xf4f4f4, 0xf5f5f5, 0xf6f6f6, 0xf7f7f7, 0xf8f8f8, 0xf9f9f9, 0xfafafa, 0xfbfbfb,
    0xfcfcfc, 0xfdfdfd, 0xfefefe, 0xffffff];
exports.PuOr3 = [0x998ec3, 0xf7f7f7, 0xf1a340];
exports.PuOr4 = [0x5e3c99, 0xb2abd2, 0xfdb863, 0xe66101];
exports.PuOr5 = [0x5e3c99, 0xb2abd2, 0xf7f7f7, 0xfdb863, 0xe66101];
exports.PuOr6 = [0x542788, 0x998ec3, 0xd8daeb, 0xfee0b6, 0xf1a340, 0xb35806];
exports.PuOr7 = [0x542788, 0x998ec3, 0xd8daeb, 0xf7f7f7, 0xfee0b6, 0xf1a340, 0xb35806];
exports.PuOr8 = [0x542788, 0x8073ac, 0xb2abd2, 0xd8daeb, 0xfee0b6, 0xfdb863, 0xe08214, 0xb35806];
exports.PuOr9 = [0x542788, 0x8073ac, 0xb2abd2, 0xd8daeb, 0xf7f7f7, 0xfee0b6, 0xfdb863, 0xe08214, 0xb35806];
exports.PuOr10 = [0x2d004b, 0x542788, 0x8073ac, 0xb2abd2, 0xd8daeb, 0xfee0b6, 0xfdb863, 0xe08214, 0xb35806, 0x7f3b08];
exports.PuOr11 = [0x2d004b, 0x542788, 0x8073ac, 0xb2abd2, 0xd8daeb, 0xf7f7f7, 0xfee0b6, 0xfdb863, 0xe08214, 0xb35806, 0x7f3b08];
exports.BrBG3 = [0x5ab4ac, 0xf5f5f5, 0xd8b365];
exports.BrBG4 = [0x018571, 0x80cdc1, 0xdfc27d, 0xa6611a];
exports.BrBG5 = [0x018571, 0x80cdc1, 0xf5f5f5, 0xdfc27d, 0xa6611a];
exports.BrBG6 = [0x01665e, 0x5ab4ac, 0xc7eae5, 0xf6e8c3, 0xd8b365, 0x8c510a];
exports.BrBG7 = [0x01665e, 0x5ab4ac, 0xc7eae5, 0xf5f5f5, 0xf6e8c3, 0xd8b365, 0x8c510a];
exports.BrBG8 = [0x01665e, 0x35978f, 0x80cdc1, 0xc7eae5, 0xf6e8c3, 0xdfc27d, 0xbf812d, 0x8c510a];
exports.BrBG9 = [0x01665e, 0x35978f, 0x80cdc1, 0xc7eae5, 0xf5f5f5, 0xf6e8c3, 0xdfc27d, 0xbf812d, 0x8c510a];
exports.BrBG10 = [0x003c30, 0x01665e, 0x35978f, 0x80cdc1, 0xc7eae5, 0xf6e8c3, 0xdfc27d, 0xbf812d, 0x8c510a, 0x543005];
exports.BrBG11 = [0x003c30, 0x01665e, 0x35978f, 0x80cdc1, 0xc7eae5, 0xf5f5f5, 0xf6e8c3, 0xdfc27d, 0xbf812d, 0x8c510a, 0x543005];
exports.PRGn3 = [0x7fbf7b, 0xf7f7f7, 0xaf8dc3];
exports.PRGn4 = [0x008837, 0xa6dba0, 0xc2a5cf, 0x7b3294];
exports.PRGn5 = [0x008837, 0xa6dba0, 0xf7f7f7, 0xc2a5cf, 0x7b3294];
exports.PRGn6 = [0x1b7837, 0x7fbf7b, 0xd9f0d3, 0xe7d4e8, 0xaf8dc3, 0x762a83];
exports.PRGn7 = [0x1b7837, 0x7fbf7b, 0xd9f0d3, 0xf7f7f7, 0xe7d4e8, 0xaf8dc3, 0x762a83];
exports.PRGn8 = [0x1b7837, 0x5aae61, 0xa6dba0, 0xd9f0d3, 0xe7d4e8, 0xc2a5cf, 0x9970ab, 0x762a83];
exports.PRGn9 = [0x1b7837, 0x5aae61, 0xa6dba0, 0xd9f0d3, 0xf7f7f7, 0xe7d4e8, 0xc2a5cf, 0x9970ab, 0x762a83];
exports.PRGn10 = [0x00441b, 0x1b7837, 0x5aae61, 0xa6dba0, 0xd9f0d3, 0xe7d4e8, 0xc2a5cf, 0x9970ab, 0x762a83, 0x40004b];
exports.PRGn11 = [0x00441b, 0x1b7837, 0x5aae61, 0xa6dba0, 0xd9f0d3, 0xf7f7f7, 0xe7d4e8, 0xc2a5cf, 0x9970ab, 0x762a83, 0x40004b];
exports.PiYG3 = [0xa1d76a, 0xf7f7f7, 0xe9a3c9];
exports.PiYG4 = [0x4dac26, 0xb8e186, 0xf1b6da, 0xd01c8b];
exports.PiYG5 = [0x4dac26, 0xb8e186, 0xf7f7f7, 0xf1b6da, 0xd01c8b];
exports.PiYG6 = [0x4d9221, 0xa1d76a, 0xe6f5d0, 0xfde0ef, 0xe9a3c9, 0xc51b7d];
exports.PiYG7 = [0x4d9221, 0xa1d76a, 0xe6f5d0, 0xf7f7f7, 0xfde0ef, 0xe9a3c9, 0xc51b7d];
exports.PiYG8 = [0x4d9221, 0x7fbc41, 0xb8e186, 0xe6f5d0, 0xfde0ef, 0xf1b6da, 0xde77ae, 0xc51b7d];
exports.PiYG9 = [0x4d9221, 0x7fbc41, 0xb8e186, 0xe6f5d0, 0xf7f7f7, 0xfde0ef, 0xf1b6da, 0xde77ae, 0xc51b7d];
exports.PiYG10 = [0x276419, 0x4d9221, 0x7fbc41, 0xb8e186, 0xe6f5d0, 0xfde0ef, 0xf1b6da, 0xde77ae, 0xc51b7d, 0x8e0152];
exports.PiYG11 = [0x276419, 0x4d9221, 0x7fbc41, 0xb8e186, 0xe6f5d0, 0xf7f7f7, 0xfde0ef, 0xf1b6da, 0xde77ae, 0xc51b7d, 0x8e0152];
exports.RdBu3 = [0x67a9cf, 0xf7f7f7, 0xef8a62];
exports.RdBu4 = [0x0571b0, 0x92c5de, 0xf4a582, 0xca0020];
exports.RdBu5 = [0x0571b0, 0x92c5de, 0xf7f7f7, 0xf4a582, 0xca0020];
exports.RdBu6 = [0x2166ac, 0x67a9cf, 0xd1e5f0, 0xfddbc7, 0xef8a62, 0xb2182b];
exports.RdBu7 = [0x2166ac, 0x67a9cf, 0xd1e5f0, 0xf7f7f7, 0xfddbc7, 0xef8a62, 0xb2182b];
exports.RdBu8 = [0x2166ac, 0x4393c3, 0x92c5de, 0xd1e5f0, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b];
exports.RdBu9 = [0x2166ac, 0x4393c3, 0x92c5de, 0xd1e5f0, 0xf7f7f7, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b];
exports.RdBu10 = [0x053061, 0x2166ac, 0x4393c3, 0x92c5de, 0xd1e5f0, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b, 0x67001f];
exports.RdBu11 = [0x053061, 0x2166ac, 0x4393c3, 0x92c5de, 0xd1e5f0, 0xf7f7f7, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b, 0x67001f];
exports.RdGy3 = [0x999999, 0xffffff, 0xef8a62];
exports.RdGy4 = [0x404040, 0xbababa, 0xf4a582, 0xca0020];
exports.RdGy5 = [0x404040, 0xbababa, 0xffffff, 0xf4a582, 0xca0020];
exports.RdGy6 = [0x4d4d4d, 0x999999, 0xe0e0e0, 0xfddbc7, 0xef8a62, 0xb2182b];
exports.RdGy7 = [0x4d4d4d, 0x999999, 0xe0e0e0, 0xffffff, 0xfddbc7, 0xef8a62, 0xb2182b];
exports.RdGy8 = [0x4d4d4d, 0x878787, 0xbababa, 0xe0e0e0, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b];
exports.RdGy9 = [0x4d4d4d, 0x878787, 0xbababa, 0xe0e0e0, 0xffffff, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b];
exports.RdGy10 = [0x1a1a1a, 0x4d4d4d, 0x878787, 0xbababa, 0xe0e0e0, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b, 0x67001f];
exports.RdGy11 = [0x1a1a1a, 0x4d4d4d, 0x878787, 0xbababa, 0xe0e0e0, 0xffffff, 0xfddbc7, 0xf4a582, 0xd6604d, 0xb2182b, 0x67001f];
exports.RdYlBu3 = [0x91bfdb, 0xffffbf, 0xfc8d59];
exports.RdYlBu4 = [0x2c7bb6, 0xabd9e9, 0xfdae61, 0xd7191c];
exports.RdYlBu5 = [0x2c7bb6, 0xabd9e9, 0xffffbf, 0xfdae61, 0xd7191c];
exports.RdYlBu6 = [0x4575b4, 0x91bfdb, 0xe0f3f8, 0xfee090, 0xfc8d59, 0xd73027];
exports.RdYlBu7 = [0x4575b4, 0x91bfdb, 0xe0f3f8, 0xffffbf, 0xfee090, 0xfc8d59, 0xd73027];
exports.RdYlBu8 = [0x4575b4, 0x74add1, 0xabd9e9, 0xe0f3f8, 0xfee090, 0xfdae61, 0xf46d43, 0xd73027];
exports.RdYlBu9 = [0x4575b4, 0x74add1, 0xabd9e9, 0xe0f3f8, 0xffffbf, 0xfee090, 0xfdae61, 0xf46d43, 0xd73027];
exports.RdYlBu10 = [0x313695, 0x4575b4, 0x74add1, 0xabd9e9, 0xe0f3f8, 0xfee090, 0xfdae61, 0xf46d43, 0xd73027, 0xa50026];
exports.RdYlBu11 = [0x313695, 0x4575b4, 0x74add1, 0xabd9e9, 0xe0f3f8, 0xffffbf, 0xfee090, 0xfdae61, 0xf46d43, 0xd73027, 0xa50026];
exports.Spectral3 = [0x99d594, 0xffffbf, 0xfc8d59];
exports.Spectral4 = [0x2b83ba, 0xabdda4, 0xfdae61, 0xd7191c];
exports.Spectral5 = [0x2b83ba, 0xabdda4, 0xffffbf, 0xfdae61, 0xd7191c];
exports.Spectral6 = [0x3288bd, 0x99d594, 0xe6f598, 0xfee08b, 0xfc8d59, 0xd53e4f];
exports.Spectral7 = [0x3288bd, 0x99d594, 0xe6f598, 0xffffbf, 0xfee08b, 0xfc8d59, 0xd53e4f];
exports.Spectral8 = [0x3288bd, 0x66c2a5, 0xabdda4, 0xe6f598, 0xfee08b, 0xfdae61, 0xf46d43, 0xd53e4f];
exports.Spectral9 = [0x3288bd, 0x66c2a5, 0xabdda4, 0xe6f598, 0xffffbf, 0xfee08b, 0xfdae61, 0xf46d43, 0xd53e4f];
exports.Spectral10 = [0x5e4fa2, 0x3288bd, 0x66c2a5, 0xabdda4, 0xe6f598, 0xfee08b, 0xfdae61, 0xf46d43, 0xd53e4f, 0x9e0142];
exports.Spectral11 = [0x5e4fa2, 0x3288bd, 0x66c2a5, 0xabdda4, 0xe6f598, 0xffffbf, 0xfee08b, 0xfdae61, 0xf46d43, 0xd53e4f, 0x9e0142];
exports.RdYlGn3 = [0x91cf60, 0xffffbf, 0xfc8d59];
exports.RdYlGn4 = [0x1a9641, 0xa6d96a, 0xfdae61, 0xd7191c];
exports.RdYlGn5 = [0x1a9641, 0xa6d96a, 0xffffbf, 0xfdae61, 0xd7191c];
exports.RdYlGn6 = [0x1a9850, 0x91cf60, 0xd9ef8b, 0xfee08b, 0xfc8d59, 0xd73027];
exports.RdYlGn7 = [0x1a9850, 0x91cf60, 0xd9ef8b, 0xffffbf, 0xfee08b, 0xfc8d59, 0xd73027];
exports.RdYlGn8 = [0x1a9850, 0x66bd63, 0xa6d96a, 0xd9ef8b, 0xfee08b, 0xfdae61, 0xf46d43, 0xd73027];
exports.RdYlGn9 = [0x1a9850, 0x66bd63, 0xa6d96a, 0xd9ef8b, 0xffffbf, 0xfee08b, 0xfdae61, 0xf46d43, 0xd73027];
exports.RdYlGn10 = [0x006837, 0x1a9850, 0x66bd63, 0xa6d96a, 0xd9ef8b, 0xfee08b, 0xfdae61, 0xf46d43, 0xd73027, 0xa50026];
exports.RdYlGn11 = [0x006837, 0x1a9850, 0x66bd63, 0xa6d96a, 0xd9ef8b, 0xffffbf, 0xfee08b, 0xfdae61, 0xf46d43, 0xd73027, 0xa50026];
exports.Inferno3 = [0x440154, 0x208f8c, 0xfde724];
exports.Inferno4 = [0x000003, 0x781c6d, 0xed6825, 0xfcfea4];
exports.Inferno5 = [0x000003, 0x550f6d, 0xba3655, 0xf98c09, 0xfcfea4];
exports.Inferno6 = [0x000003, 0x410967, 0x932567, 0xdc5039, 0xfba40a, 0xfcfea4];
exports.Inferno7 = [0x000003, 0x32095d, 0x781c6d, 0xba3655, 0xed6825, 0xfbb318, 0xfcfea4];
exports.Inferno8 = [0x000003, 0x270b52, 0x63146e, 0x9e2963, 0xd24742, 0xf57c15, 0xfabf25, 0xfcfea4];
exports.Inferno9 = [0x000003, 0x1f0c47, 0x550f6d, 0x88216a, 0xba3655, 0xe35832, 0xf98c09, 0xf8c931, 0xfcfea4];
exports.Inferno10 = [0x000003, 0x1a0b40, 0x4a0b6a, 0x781c6d, 0xa42c60, 0xcd4247, 0xed6825, 0xfb9906, 0xf7cf3a, 0xfcfea4];
exports.Inferno11 = [0x000003, 0x160b39, 0x410967, 0x6a176e, 0x932567, 0xba3655, 0xdc5039, 0xf2751a, 0xfba40a, 0xf6d542, 0xfcfea4];
exports.Inferno256 = [0x000003, 0x000004, 0x000006, 0x010007, 0x010109, 0x01010b, 0x02010e, 0x020210, 0x030212, 0x040314, 0x040316, 0x050418,
    0x06041b, 0x07051d, 0x08061f, 0x090621, 0x0a0723, 0x0b0726, 0x0d0828, 0x0e082a, 0x0f092d, 0x10092f, 0x120a32, 0x130a34,
    0x140b36, 0x160b39, 0x170b3b, 0x190b3e, 0x1a0b40, 0x1c0c43, 0x1d0c45, 0x1f0c47, 0x200c4a, 0x220b4c, 0x240b4e, 0x260b50,
    0x270b52, 0x290b54, 0x2b0a56, 0x2d0a58, 0x2e0a5a, 0x300a5c, 0x32095d, 0x34095f, 0x350960, 0x370961, 0x390962, 0x3b0964,
    0x3c0965, 0x3e0966, 0x400966, 0x410967, 0x430a68, 0x450a69, 0x460a69, 0x480b6a, 0x4a0b6a, 0x4b0c6b, 0x4d0c6b, 0x4f0d6c,
    0x500d6c, 0x520e6c, 0x530e6d, 0x550f6d, 0x570f6d, 0x58106d, 0x5a116d, 0x5b116e, 0x5d126e, 0x5f126e, 0x60136e, 0x62146e,
    0x63146e, 0x65156e, 0x66156e, 0x68166e, 0x6a176e, 0x6b176e, 0x6d186e, 0x6e186e, 0x70196e, 0x72196d, 0x731a6d, 0x751b6d,
    0x761b6d, 0x781c6d, 0x7a1c6d, 0x7b1d6c, 0x7d1d6c, 0x7e1e6c, 0x801f6b, 0x811f6b, 0x83206b, 0x85206a, 0x86216a, 0x88216a,
    0x892269, 0x8b2269, 0x8d2369, 0x8e2468, 0x902468, 0x912567, 0x932567, 0x952666, 0x962666, 0x982765, 0x992864, 0x9b2864,
    0x9c2963, 0x9e2963, 0xa02a62, 0xa12b61, 0xa32b61, 0xa42c60, 0xa62c5f, 0xa72d5f, 0xa92e5e, 0xab2e5d, 0xac2f5c, 0xae305b,
    0xaf315b, 0xb1315a, 0xb23259, 0xb43358, 0xb53357, 0xb73456, 0xb83556, 0xba3655, 0xbb3754, 0xbd3753, 0xbe3852, 0xbf3951,
    0xc13a50, 0xc23b4f, 0xc43c4e, 0xc53d4d, 0xc73e4c, 0xc83e4b, 0xc93f4a, 0xcb4049, 0xcc4148, 0xcd4247, 0xcf4446, 0xd04544,
    0xd14643, 0xd24742, 0xd44841, 0xd54940, 0xd64a3f, 0xd74b3e, 0xd94d3d, 0xda4e3b, 0xdb4f3a, 0xdc5039, 0xdd5238, 0xde5337,
    0xdf5436, 0xe05634, 0xe25733, 0xe35832, 0xe45a31, 0xe55b30, 0xe65c2e, 0xe65e2d, 0xe75f2c, 0xe8612b, 0xe9622a, 0xea6428,
    0xeb6527, 0xec6726, 0xed6825, 0xed6a23, 0xee6c22, 0xef6d21, 0xf06f1f, 0xf0701e, 0xf1721d, 0xf2741c, 0xf2751a, 0xf37719,
    0xf37918, 0xf47a16, 0xf57c15, 0xf57e14, 0xf68012, 0xf68111, 0xf78310, 0xf7850e, 0xf8870d, 0xf8880c, 0xf88a0b, 0xf98c09,
    0xf98e08, 0xf99008, 0xfa9107, 0xfa9306, 0xfa9506, 0xfa9706, 0xfb9906, 0xfb9b06, 0xfb9d06, 0xfb9e07, 0xfba007, 0xfba208,
    0xfba40a, 0xfba60b, 0xfba80d, 0xfbaa0e, 0xfbac10, 0xfbae12, 0xfbb014, 0xfbb116, 0xfbb318, 0xfbb51a, 0xfbb71c, 0xfbb91e,
    0xfabb21, 0xfabd23, 0xfabf25, 0xfac128, 0xf9c32a, 0xf9c52c, 0xf9c72f, 0xf8c931, 0xf8cb34, 0xf8cd37, 0xf7cf3a, 0xf7d13c,
    0xf6d33f, 0xf6d542, 0xf5d745, 0xf5d948, 0xf4db4b, 0xf4dc4f, 0xf3de52, 0xf3e056, 0xf3e259, 0xf2e45d, 0xf2e660, 0xf1e864,
    0xf1e968, 0xf1eb6c, 0xf1ed70, 0xf1ee74, 0xf1f079, 0xf1f27d, 0xf2f381, 0xf2f485, 0xf3f689, 0xf4f78d, 0xf5f891, 0xf6fa95,
    0xf7fb99, 0xf9fc9d, 0xfafda0, 0xfcfea4];
exports.Magma3 = [0x000003, 0xb53679, 0xfbfcbf];
exports.Magma4 = [0x000003, 0x711f81, 0xf0605d, 0xfbfcbf];
exports.Magma5 = [0x000003, 0x4f117b, 0xb53679, 0xfb8660, 0xfbfcbf];
exports.Magma6 = [0x000003, 0x3b0f6f, 0x8c2980, 0xdd4968, 0xfd9f6c, 0xfbfcbf];
exports.Magma7 = [0x000003, 0x2b115e, 0x711f81, 0xb53679, 0xf0605d, 0xfeae76, 0xfbfcbf];
exports.Magma8 = [0x000003, 0x221150, 0x5d177e, 0x972c7f, 0xd1426e, 0xf8755c, 0xfeb97f, 0xfbfcbf];
exports.Magma9 = [0x000003, 0x1b1044, 0x4f117b, 0x812581, 0xb53679, 0xe55063, 0xfb8660, 0xfec286, 0xfbfcbf];
exports.Magma10 = [0x000003, 0x170f3c, 0x430f75, 0x711f81, 0x9e2e7e, 0xcb3e71, 0xf0605d, 0xfc9366, 0xfec78b, 0xfbfcbf];
exports.Magma11 = [0x000003, 0x140d35, 0x3b0f6f, 0x63197f, 0x8c2980, 0xb53679, 0xdd4968, 0xf66e5b, 0xfd9f6c, 0xfdcd90, 0xfbfcbf];
exports.Magma256 = [0x000003, 0x000004, 0x000006, 0x010007, 0x010109, 0x01010b, 0x02020d, 0x02020f, 0x030311, 0x040313, 0x040415, 0x050417,
    0x060519, 0x07051b, 0x08061d, 0x09071f, 0x0a0722, 0x0b0824, 0x0c0926, 0x0d0a28, 0x0e0a2a, 0x0f0b2c, 0x100c2f, 0x110c31,
    0x120d33, 0x140d35, 0x150e38, 0x160e3a, 0x170f3c, 0x180f3f, 0x1a1041, 0x1b1044, 0x1c1046, 0x1e1049, 0x1f114b, 0x20114d,
    0x221150, 0x231152, 0x251155, 0x261157, 0x281159, 0x2a115c, 0x2b115e, 0x2d1060, 0x2f1062, 0x301065, 0x321067, 0x341068,
    0x350f6a, 0x370f6c, 0x390f6e, 0x3b0f6f, 0x3c0f71, 0x3e0f72, 0x400f73, 0x420f74, 0x430f75, 0x450f76, 0x470f77, 0x481078,
    0x4a1079, 0x4b1079, 0x4d117a, 0x4f117b, 0x50127b, 0x52127c, 0x53137c, 0x55137d, 0x57147d, 0x58157e, 0x5a157e, 0x5b167e,
    0x5d177e, 0x5e177f, 0x60187f, 0x61187f, 0x63197f, 0x651a80, 0x661a80, 0x681b80, 0x691c80, 0x6b1c80, 0x6c1d80, 0x6e1e81,
    0x6f1e81, 0x711f81, 0x731f81, 0x742081, 0x762181, 0x772181, 0x792281, 0x7a2281, 0x7c2381, 0x7e2481, 0x7f2481, 0x812581,
    0x822581, 0x842681, 0x852681, 0x872781, 0x892881, 0x8a2881, 0x8c2980, 0x8d2980, 0x8f2a80, 0x912a80, 0x922b80, 0x942b80,
    0x952c80, 0x972c7f, 0x992d7f, 0x9a2d7f, 0x9c2e7f, 0x9e2e7e, 0x9f2f7e, 0xa12f7e, 0xa3307e, 0xa4307d, 0xa6317d, 0xa7317d,
    0xa9327c, 0xab337c, 0xac337b, 0xae347b, 0xb0347b, 0xb1357a, 0xb3357a, 0xb53679, 0xb63679, 0xb83778, 0xb93778, 0xbb3877,
    0xbd3977, 0xbe3976, 0xc03a75, 0xc23a75, 0xc33b74, 0xc53c74, 0xc63c73, 0xc83d72, 0xca3e72, 0xcb3e71, 0xcd3f70, 0xce4070,
    0xd0416f, 0xd1426e, 0xd3426d, 0xd4436d, 0xd6446c, 0xd7456b, 0xd9466a, 0xda4769, 0xdc4869, 0xdd4968, 0xde4a67, 0xe04b66,
    0xe14c66, 0xe24d65, 0xe44e64, 0xe55063, 0xe65162, 0xe75262, 0xe85461, 0xea5560, 0xeb5660, 0xec585f, 0xed595f, 0xee5b5e,
    0xee5d5d, 0xef5e5d, 0xf0605d, 0xf1615c, 0xf2635c, 0xf3655c, 0xf3675b, 0xf4685b, 0xf56a5b, 0xf56c5b, 0xf66e5b, 0xf6705b,
    0xf7715b, 0xf7735c, 0xf8755c, 0xf8775c, 0xf9795c, 0xf97b5d, 0xf97d5d, 0xfa7f5e, 0xfa805e, 0xfa825f, 0xfb8460, 0xfb8660,
    0xfb8861, 0xfb8a62, 0xfc8c63, 0xfc8e63, 0xfc9064, 0xfc9265, 0xfc9366, 0xfd9567, 0xfd9768, 0xfd9969, 0xfd9b6a, 0xfd9d6b,
    0xfd9f6c, 0xfda16e, 0xfda26f, 0xfda470, 0xfea671, 0xfea873, 0xfeaa74, 0xfeac75, 0xfeae76, 0xfeaf78, 0xfeb179, 0xfeb37b,
    0xfeb57c, 0xfeb77d, 0xfeb97f, 0xfebb80, 0xfebc82, 0xfebe83, 0xfec085, 0xfec286, 0xfec488, 0xfec689, 0xfec78b, 0xfec98d,
    0xfecb8e, 0xfdcd90, 0xfdcf92, 0xfdd193, 0xfdd295, 0xfdd497, 0xfdd698, 0xfdd89a, 0xfdda9c, 0xfddc9d, 0xfddd9f, 0xfddfa1,
    0xfde1a3, 0xfce3a5, 0xfce5a6, 0xfce6a8, 0xfce8aa, 0xfceaac, 0xfcecae, 0xfceeb0, 0xfcf0b1, 0xfcf1b3, 0xfcf3b5, 0xfcf5b7,
    0xfbf7b9, 0xfbf9bb, 0xfbfabd, 0xfbfcbf];
exports.Plasma3 = [0x0c0786, 0xca4678, 0xeff821];
exports.Plasma4 = [0x0c0786, 0x9b179e, 0xec7853, 0xeff821];
exports.Plasma5 = [0x0c0786, 0x7c02a7, 0xca4678, 0xf79341, 0xeff821];
exports.Plasma6 = [0x0c0786, 0x6a00a7, 0xb02a8f, 0xe06461, 0xfca635, 0xeff821];
exports.Plasma7 = [0x0c0786, 0x5c00a5, 0x9b179e, 0xca4678, 0xec7853, 0xfdb22f, 0xeff821];
exports.Plasma8 = [0x0c0786, 0x5201a3, 0x8908a5, 0xb83289, 0xda5a68, 0xf38748, 0xfdbb2b, 0xeff821];
exports.Plasma9 = [0x0c0786, 0x4a02a0, 0x7c02a7, 0xa82296, 0xca4678, 0xe56b5c, 0xf79341, 0xfdc328, 0xeff821];
exports.Plasma10 = [0x0c0786, 0x45039e, 0x7200a8, 0x9b179e, 0xbc3685, 0xd7566c, 0xec7853, 0xfa9d3a, 0xfcc726, 0xeff821];
exports.Plasma11 = [0x0c0786, 0x40039c, 0x6a00a7, 0x8f0da3, 0xb02a8f, 0xca4678, 0xe06461, 0xf1824c, 0xfca635, 0xfccc25, 0xeff821];
exports.Plasma256 = [0x0c0786, 0x100787, 0x130689, 0x15068a, 0x18068b, 0x1b068c, 0x1d068d, 0x1f058e, 0x21058f, 0x230590, 0x250591, 0x270592,
    0x290593, 0x2b0594, 0x2d0494, 0x2f0495, 0x310496, 0x330497, 0x340498, 0x360498, 0x380499, 0x3a049a, 0x3b039a, 0x3d039b,
    0x3f039c, 0x40039c, 0x42039d, 0x44039e, 0x45039e, 0x47029f, 0x49029f, 0x4a02a0, 0x4c02a1, 0x4e02a1, 0x4f02a2, 0x5101a2,
    0x5201a3, 0x5401a3, 0x5601a3, 0x5701a4, 0x5901a4, 0x5a00a5, 0x5c00a5, 0x5e00a5, 0x5f00a6, 0x6100a6, 0x6200a6, 0x6400a7,
    0x6500a7, 0x6700a7, 0x6800a7, 0x6a00a7, 0x6c00a8, 0x6d00a8, 0x6f00a8, 0x7000a8, 0x7200a8, 0x7300a8, 0x7500a8, 0x7601a8,
    0x7801a8, 0x7901a8, 0x7b02a8, 0x7c02a7, 0x7e03a7, 0x7f03a7, 0x8104a7, 0x8204a7, 0x8405a6, 0x8506a6, 0x8607a6, 0x8807a5,
    0x8908a5, 0x8b09a4, 0x8c0aa4, 0x8e0ca4, 0x8f0da3, 0x900ea3, 0x920fa2, 0x9310a1, 0x9511a1, 0x9612a0, 0x9713a0, 0x99149f,
    0x9a159e, 0x9b179e, 0x9d189d, 0x9e199c, 0x9f1a9b, 0xa01b9b, 0xa21c9a, 0xa31d99, 0xa41e98, 0xa51f97, 0xa72197, 0xa82296,
    0xa92395, 0xaa2494, 0xac2593, 0xad2692, 0xae2791, 0xaf2890, 0xb02a8f, 0xb12b8f, 0xb22c8e, 0xb42d8d, 0xb52e8c, 0xb62f8b,
    0xb7308a, 0xb83289, 0xb93388, 0xba3487, 0xbb3586, 0xbc3685, 0xbd3784, 0xbe3883, 0xbf3982, 0xc03b81, 0xc13c80, 0xc23d80,
    0xc33e7f, 0xc43f7e, 0xc5407d, 0xc6417c, 0xc7427b, 0xc8447a, 0xc94579, 0xca4678, 0xcb4777, 0xcc4876, 0xcd4975, 0xce4a75,
    0xcf4b74, 0xd04d73, 0xd14e72, 0xd14f71, 0xd25070, 0xd3516f, 0xd4526e, 0xd5536d, 0xd6556d, 0xd7566c, 0xd7576b, 0xd8586a,
    0xd95969, 0xda5a68, 0xdb5b67, 0xdc5d66, 0xdc5e66, 0xdd5f65, 0xde6064, 0xdf6163, 0xdf6262, 0xe06461, 0xe16560, 0xe26660,
    0xe3675f, 0xe3685e, 0xe46a5d, 0xe56b5c, 0xe56c5b, 0xe66d5a, 0xe76e5a, 0xe87059, 0xe87158, 0xe97257, 0xea7356, 0xea7455,
    0xeb7654, 0xec7754, 0xec7853, 0xed7952, 0xed7b51, 0xee7c50, 0xef7d4f, 0xef7e4e, 0xf0804d, 0xf0814d, 0xf1824c, 0xf2844b,
    0xf2854a, 0xf38649, 0xf38748, 0xf48947, 0xf48a47, 0xf58b46, 0xf58d45, 0xf68e44, 0xf68f43, 0xf69142, 0xf79241, 0xf79341,
    0xf89540, 0xf8963f, 0xf8983e, 0xf9993d, 0xf99a3c, 0xfa9c3b, 0xfa9d3a, 0xfa9f3a, 0xfaa039, 0xfba238, 0xfba337, 0xfba436,
    0xfca635, 0xfca735, 0xfca934, 0xfcaa33, 0xfcac32, 0xfcad31, 0xfdaf31, 0xfdb030, 0xfdb22f, 0xfdb32e, 0xfdb52d, 0xfdb62d,
    0xfdb82c, 0xfdb92b, 0xfdbb2b, 0xfdbc2a, 0xfdbe29, 0xfdc029, 0xfdc128, 0xfdc328, 0xfdc427, 0xfdc626, 0xfcc726, 0xfcc926,
    0xfccb25, 0xfccc25, 0xfcce25, 0xfbd024, 0xfbd124, 0xfbd324, 0xfad524, 0xfad624, 0xfad824, 0xf9d924, 0xf9db24, 0xf8dd24,
    0xf8df24, 0xf7e024, 0xf7e225, 0xf6e425, 0xf6e525, 0xf5e726, 0xf5e926, 0xf4ea26, 0xf3ec26, 0xf3ee26, 0xf2f026, 0xf2f126,
    0xf1f326, 0xf0f525, 0xf0f623, 0xeff821];
exports.Viridis3 = [0x440154, 0x208f8c, 0xfde724];
exports.Viridis4 = [0x440154, 0x30678d, 0x35b778, 0xfde724];
exports.Viridis5 = [0x440154, 0x3b518a, 0x208f8c, 0x5bc862, 0xfde724];
exports.Viridis6 = [0x440154, 0x404387, 0x29788e, 0x22a784, 0x79d151, 0xfde724];
exports.Viridis7 = [0x440154, 0x443982, 0x30678d, 0x208f8c, 0x35b778, 0x8dd644, 0xfde724];
exports.Viridis8 = [0x440154, 0x46317e, 0x365a8c, 0x277e8e, 0x1ea087, 0x49c16d, 0x9dd93a, 0xfde724];
exports.Viridis9 = [0x440154, 0x472b7a, 0x3b518a, 0x2c718e, 0x208f8c, 0x27ad80, 0x5bc862, 0xaadb32, 0xfde724];
exports.Viridis10 = [0x440154, 0x472777, 0x3e4989, 0x30678d, 0x25828e, 0x1e9c89, 0x35b778, 0x6bcd59, 0xb2dd2c, 0xfde724];
exports.Viridis11 = [0x440154, 0x482374, 0x404387, 0x345e8d, 0x29788e, 0x208f8c, 0x22a784, 0x42be71, 0x79d151, 0xbade27, 0xfde724];
exports.Viridis256 = [0x440154, 0x440255, 0x440357, 0x450558, 0x45065a, 0x45085b, 0x46095c, 0x460b5e, 0x460c5f, 0x460e61, 0x470f62, 0x471163,
    0x471265, 0x471466, 0x471567, 0x471669, 0x47186a, 0x48196b, 0x481a6c, 0x481c6e, 0x481d6f, 0x481e70, 0x482071, 0x482172,
    0x482273, 0x482374, 0x472575, 0x472676, 0x472777, 0x472878, 0x472a79, 0x472b7a, 0x472c7b, 0x462d7c, 0x462f7c, 0x46307d,
    0x46317e, 0x45327f, 0x45347f, 0x453580, 0x453681, 0x443781, 0x443982, 0x433a83, 0x433b83, 0x433c84, 0x423d84, 0x423e85,
    0x424085, 0x414186, 0x414286, 0x404387, 0x404487, 0x3f4587, 0x3f4788, 0x3e4888, 0x3e4989, 0x3d4a89, 0x3d4b89, 0x3d4c89,
    0x3c4d8a, 0x3c4e8a, 0x3b508a, 0x3b518a, 0x3a528b, 0x3a538b, 0x39548b, 0x39558b, 0x38568b, 0x38578c, 0x37588c, 0x37598c,
    0x365a8c, 0x365b8c, 0x355c8c, 0x355d8c, 0x345e8d, 0x345f8d, 0x33608d, 0x33618d, 0x32628d, 0x32638d, 0x31648d, 0x31658d,
    0x31668d, 0x30678d, 0x30688d, 0x2f698d, 0x2f6a8d, 0x2e6b8e, 0x2e6c8e, 0x2e6d8e, 0x2d6e8e, 0x2d6f8e, 0x2c708e, 0x2c718e,
    0x2c728e, 0x2b738e, 0x2b748e, 0x2a758e, 0x2a768e, 0x2a778e, 0x29788e, 0x29798e, 0x287a8e, 0x287a8e, 0x287b8e, 0x277c8e,
    0x277d8e, 0x277e8e, 0x267f8e, 0x26808e, 0x26818e, 0x25828e, 0x25838d, 0x24848d, 0x24858d, 0x24868d, 0x23878d, 0x23888d,
    0x23898d, 0x22898d, 0x228a8d, 0x228b8d, 0x218c8d, 0x218d8c, 0x218e8c, 0x208f8c, 0x20908c, 0x20918c, 0x1f928c, 0x1f938b,
    0x1f948b, 0x1f958b, 0x1f968b, 0x1e978a, 0x1e988a, 0x1e998a, 0x1e998a, 0x1e9a89, 0x1e9b89, 0x1e9c89, 0x1e9d88, 0x1e9e88,
    0x1e9f88, 0x1ea087, 0x1fa187, 0x1fa286, 0x1fa386, 0x20a485, 0x20a585, 0x21a685, 0x21a784, 0x22a784, 0x23a883, 0x23a982,
    0x24aa82, 0x25ab81, 0x26ac81, 0x27ad80, 0x28ae7f, 0x29af7f, 0x2ab07e, 0x2bb17d, 0x2cb17d, 0x2eb27c, 0x2fb37b, 0x30b47a,
    0x32b57a, 0x33b679, 0x35b778, 0x36b877, 0x38b976, 0x39b976, 0x3bba75, 0x3dbb74, 0x3ebc73, 0x40bd72, 0x42be71, 0x44be70,
    0x45bf6f, 0x47c06e, 0x49c16d, 0x4bc26c, 0x4dc26b, 0x4fc369, 0x51c468, 0x53c567, 0x55c666, 0x57c665, 0x59c764, 0x5bc862,
    0x5ec961, 0x60c960, 0x62ca5f, 0x64cb5d, 0x67cc5c, 0x69cc5b, 0x6bcd59, 0x6dce58, 0x70ce56, 0x72cf55, 0x74d054, 0x77d052,
    0x79d151, 0x7cd24f, 0x7ed24e, 0x81d34c, 0x83d34b, 0x86d449, 0x88d547, 0x8bd546, 0x8dd644, 0x90d643, 0x92d741, 0x95d73f,
    0x97d83e, 0x9ad83c, 0x9dd93a, 0x9fd938, 0xa2da37, 0xa5da35, 0xa7db33, 0xaadb32, 0xaddc30, 0xafdc2e, 0xb2dd2c, 0xb5dd2b,
    0xb7dd29, 0xbade27, 0xbdde26, 0xbfdf24, 0xc2df22, 0xc5df21, 0xc7e01f, 0xcae01e, 0xcde01d, 0xcfe11c, 0xd2e11b, 0xd4e11a,
    0xd7e219, 0xdae218, 0xdce218, 0xdfe318, 0xe1e318, 0xe4e318, 0xe7e419, 0xe9e419, 0xece41a, 0xeee51b, 0xf1e51c, 0xf3e51e,
    0xf6e61f, 0xf8e621, 0xfae622, 0xfde724];
exports.Accent3 = [0x7fc97f, 0xbeaed4, 0xfdc086];
exports.Accent4 = [0x7fc97f, 0xbeaed4, 0xfdc086, 0xffff99];
exports.Accent5 = [0x7fc97f, 0xbeaed4, 0xfdc086, 0xffff99, 0x386cb0];
exports.Accent6 = [0x7fc97f, 0xbeaed4, 0xfdc086, 0xffff99, 0x386cb0, 0xf0027f];
exports.Accent7 = [0x7fc97f, 0xbeaed4, 0xfdc086, 0xffff99, 0x386cb0, 0xf0027f, 0xbf5b17];
exports.Accent8 = [0x7fc97f, 0xbeaed4, 0xfdc086, 0xffff99, 0x386cb0, 0xf0027f, 0xbf5b17, 0x666666];
exports.Dark2_3 = [0x1b9e77, 0xd95f02, 0x7570b3];
exports.Dark2_4 = [0x1b9e77, 0xd95f02, 0x7570b3, 0xe7298a];
exports.Dark2_5 = [0x1b9e77, 0xd95f02, 0x7570b3, 0xe7298a, 0x66a61e];
exports.Dark2_6 = [0x1b9e77, 0xd95f02, 0x7570b3, 0xe7298a, 0x66a61e, 0xe6ab02];
exports.Dark2_7 = [0x1b9e77, 0xd95f02, 0x7570b3, 0xe7298a, 0x66a61e, 0xe6ab02, 0xa6761d];
exports.Dark2_8 = [0x1b9e77, 0xd95f02, 0x7570b3, 0xe7298a, 0x66a61e, 0xe6ab02, 0xa6761d, 0x666666];
exports.Paired3 = [0xa6cee3, 0x1f78b4, 0xb2df8a];
exports.Paired4 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c];
exports.Paired5 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99];
exports.Paired6 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c];
exports.Paired7 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f];
exports.Paired8 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00];
exports.Paired9 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6];
exports.Paired10 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a];
exports.Paired11 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a, 0xffff99];
exports.Paired12 = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a, 0xffff99, 0xb15928];
exports.Pastel1_3 = [0xfbb4ae, 0xb3cde3, 0xccebc5];
exports.Pastel1_4 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4];
exports.Pastel1_5 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4, 0xfed9a6];
exports.Pastel1_6 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4, 0xfed9a6, 0xffffcc];
exports.Pastel1_7 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4, 0xfed9a6, 0xffffcc, 0xe5d8bd];
exports.Pastel1_8 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4, 0xfed9a6, 0xffffcc, 0xe5d8bd, 0xfddaec];
exports.Pastel1_9 = [0xfbb4ae, 0xb3cde3, 0xccebc5, 0xdecbe4, 0xfed9a6, 0xffffcc, 0xe5d8bd, 0xfddaec, 0xf2f2f2];
exports.Pastel2_3 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8];
exports.Pastel2_4 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8, 0xf4cae4];
exports.Pastel2_5 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8, 0xf4cae4, 0xe6f5c9];
exports.Pastel2_6 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8, 0xf4cae4, 0xe6f5c9, 0xfff2ae];
exports.Pastel2_7 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8, 0xf4cae4, 0xe6f5c9, 0xfff2ae, 0xf1e2cc];
exports.Pastel2_8 = [0xb3e2cd, 0xfdcdac, 0xcbd5e8, 0xf4cae4, 0xe6f5c9, 0xfff2ae, 0xf1e2cc, 0xcccccc];
exports.Set1_3 = [0xe41a1c, 0x377eb8, 0x4daf4a];
exports.Set1_4 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3];
exports.Set1_5 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3, 0xff7f00];
exports.Set1_6 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3, 0xff7f00, 0xffff33];
exports.Set1_7 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3, 0xff7f00, 0xffff33, 0xa65628];
exports.Set1_8 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3, 0xff7f00, 0xffff33, 0xa65628, 0xf781bf];
exports.Set1_9 = [0xe41a1c, 0x377eb8, 0x4daf4a, 0x984ea3, 0xff7f00, 0xffff33, 0xa65628, 0xf781bf, 0x999999];
exports.Set2_3 = [0x66c2a5, 0xfc8d62, 0x8da0cb];
exports.Set2_4 = [0x66c2a5, 0xfc8d62, 0x8da0cb, 0xe78ac3];
exports.Set2_5 = [0x66c2a5, 0xfc8d62, 0x8da0cb, 0xe78ac3, 0xa6d854];
exports.Set2_6 = [0x66c2a5, 0xfc8d62, 0x8da0cb, 0xe78ac3, 0xa6d854, 0xffd92f];
exports.Set2_7 = [0x66c2a5, 0xfc8d62, 0x8da0cb, 0xe78ac3, 0xa6d854, 0xffd92f, 0xe5c494];
exports.Set2_8 = [0x66c2a5, 0xfc8d62, 0x8da0cb, 0xe78ac3, 0xa6d854, 0xffd92f, 0xe5c494, 0xb3b3b3];
exports.Set3_3 = [0x8dd3c7, 0xffffb3, 0xbebada];
exports.Set3_4 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072];
exports.Set3_5 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3];
exports.Set3_6 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462];
exports.Set3_7 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69];
exports.Set3_8 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69, 0xfccde5];
exports.Set3_9 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69, 0xfccde5, 0xd9d9d9];
exports.Set3_10 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69, 0xfccde5, 0xd9d9d9, 0xbc80bd];
exports.Set3_11 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69, 0xfccde5, 0xd9d9d9, 0xbc80bd, 0xccebc5];
exports.Set3_12 = [0x8dd3c7, 0xffffb3, 0xbebada, 0xfb8072, 0x80b1d3, 0xfdb462, 0xb3de69, 0xfccde5, 0xd9d9d9, 0xbc80bd, 0xccebc5, 0xffed6f];
exports.Category10_3 = [0x1f77b4, 0xff7f0e, 0x2ca02c];
exports.Category10_4 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728];
exports.Category10_5 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd];
exports.Category10_6 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b];
exports.Category10_7 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b, 0xe377c2];
exports.Category10_8 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b, 0xe377c2, 0x7f7f7f];
exports.Category10_9 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22];
exports.Category10_10 = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf];
exports.Category20_3 = [0x1f77b4, 0xaec7e8, 0xff7f0e];
exports.Category20_4 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78];
exports.Category20_5 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c];
exports.Category20_6 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a];
exports.Category20_7 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728];
exports.Category20_8 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896];
exports.Category20_9 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd];
exports.Category20_10 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5];
exports.Category20_11 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b];
exports.Category20_12 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94];
exports.Category20_13 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2];
exports.Category20_14 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2];
exports.Category20_15 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f];
exports.Category20_16 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7];
exports.Category20_17 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7, 0xbcbd22];
exports.Category20_18 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7, 0xbcbd22, 0xdbdb8d];
exports.Category20_19 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7, 0xbcbd22, 0xdbdb8d, 0x17becf];
exports.Category20_20 = [0x1f77b4, 0xaec7e8, 0xff7f0e, 0xffbb78, 0x2ca02c, 0x98df8a, 0xd62728, 0xff9896, 0x9467bd, 0xc5b0d5,
    0x8c564b, 0xc49c94, 0xe377c2, 0xf7b6d2, 0x7f7f7f, 0xc7c7c7, 0xbcbd22, 0xdbdb8d, 0x17becf, 0x9edae5];
exports.Category20b_3 = [0x393b79, 0x5254a3, 0x6b6ecf];
exports.Category20b_4 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede];
exports.Category20b_5 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939];
exports.Category20b_6 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252];
exports.Category20b_7 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b];
exports.Category20b_8 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c];
exports.Category20b_9 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31];
exports.Category20b_10 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39];
exports.Category20b_11 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52];
exports.Category20b_12 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94];
exports.Category20b_13 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39];
exports.Category20b_14 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a];
exports.Category20b_15 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b];
exports.Category20b_16 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b, 0xe7969c];
exports.Category20b_17 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b, 0xe7969c, 0x7b4173];
exports.Category20b_18 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b, 0xe7969c, 0x7b4173, 0xa55194];
exports.Category20b_19 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b, 0xe7969c, 0x7b4173, 0xa55194, 0xce6dbd];
exports.Category20b_20 = [0x393b79, 0x5254a3, 0x6b6ecf, 0x9c9ede, 0x637939, 0x8ca252, 0xb5cf6b, 0xcedb9c, 0x8c6d31, 0xbd9e39,
    0xe7ba52, 0xe7cb94, 0x843c39, 0xad494a, 0xd6616b, 0xe7969c, 0x7b4173, 0xa55194, 0xce6dbd, 0xde9ed6];
exports.Category20c_3 = [0x3182bd, 0x6baed6, 0x9ecae1];
exports.Category20c_4 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef];
exports.Category20c_5 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d];
exports.Category20c_6 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c];
exports.Category20c_7 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b];
exports.Category20c_8 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2];
exports.Category20c_9 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354];
exports.Category20c_10 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476];
exports.Category20c_11 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b];
exports.Category20c_12 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0];
exports.Category20c_13 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1];
exports.Category20c_14 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8];
exports.Category20c_15 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc];
exports.Category20c_16 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb];
exports.Category20c_17 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0x636363];
exports.Category20c_18 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0x636363, 0x969696];
exports.Category20c_19 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0x636363, 0x969696, 0xbdbdbd];
exports.Category20c_20 = [0x3182bd, 0x6baed6, 0x9ecae1, 0xc6dbef, 0xe6550d, 0xfd8d3c, 0xfdae6b, 0xfdd0a2, 0x31a354, 0x74c476,
    0xa1d99b, 0xc7e9c0, 0x756bb1, 0x9e9ac8, 0xbcbddc, 0xdadaeb, 0x636363, 0x969696, 0xbdbdbd, 0xd9d9d9];
exports.Colorblind3 = [0x0072b2, 0xe69f00, 0xf0e442];
exports.Colorblind4 = [0x0072b2, 0xe69f00, 0xf0e442, 0x009e73];
exports.Colorblind5 = [0x0072b2, 0xe69f00, 0xf0e442, 0x009e73, 0x56b4e9];
exports.Colorblind6 = [0x0072b2, 0xe69f00, 0xf0e442, 0x009e73, 0x56b4e9, 0xd55e00];
exports.Colorblind7 = [0x0072b2, 0xe69f00, 0xf0e442, 0x009e73, 0x56b4e9, 0xd55e00, 0xcc79a7];
exports.Colorblind8 = [0x0072b2, 0xe69f00, 0xf0e442, 0x009e73, 0x56b4e9, 0xd55e00, 0xcc79a7, 0x000000];
exports.YlGn = { YlGn3: exports.YlGn3, YlGn4: exports.YlGn4, YlGn5: exports.YlGn5, YlGn6: exports.YlGn6, YlGn7: exports.YlGn7, YlGn8: exports.YlGn8, YlGn9: exports.YlGn9 };
exports.YlGnBu = { YlGnBu3: exports.YlGnBu3, YlGnBu4: exports.YlGnBu4, YlGnBu5: exports.YlGnBu5, YlGnBu6: exports.YlGnBu6, YlGnBu7: exports.YlGnBu7, YlGnBu8: exports.YlGnBu8, YlGnBu9: exports.YlGnBu9 };
exports.GnBu = { GnBu3: exports.GnBu3, GnBu4: exports.GnBu4, GnBu5: exports.GnBu5, GnBu6: exports.GnBu6, GnBu7: exports.GnBu7, GnBu8: exports.GnBu8, GnBu9: exports.GnBu9 };
exports.BuGn = { BuGn3: exports.BuGn3, BuGn4: exports.BuGn4, BuGn5: exports.BuGn5, BuGn6: exports.BuGn6, BuGn7: exports.BuGn7, BuGn8: exports.BuGn8, BuGn9: exports.BuGn9 };
exports.PuBuGn = { PuBuGn3: exports.PuBuGn3, PuBuGn4: exports.PuBuGn4, PuBuGn5: exports.PuBuGn5, PuBuGn6: exports.PuBuGn6, PuBuGn7: exports.PuBuGn7, PuBuGn8: exports.PuBuGn8, PuBuGn9: exports.PuBuGn9 };
exports.PuBu = { PuBu3: exports.PuBu3, PuBu4: exports.PuBu4, PuBu5: exports.PuBu5, PuBu6: exports.PuBu6, PuBu7: exports.PuBu7, PuBu8: exports.PuBu8, PuBu9: exports.PuBu9 };
exports.BuPu = { BuPu3: exports.BuPu3, BuPu4: exports.BuPu4, BuPu5: exports.BuPu5, BuPu6: exports.BuPu6, BuPu7: exports.BuPu7, BuPu8: exports.BuPu8, BuPu9: exports.BuPu9 };
exports.RdPu = { RdPu3: exports.RdPu3, RdPu4: exports.RdPu4, RdPu5: exports.RdPu5, RdPu6: exports.RdPu6, RdPu7: exports.RdPu7, RdPu8: exports.RdPu8, RdPu9: exports.RdPu9 };
exports.PuRd = { PuRd3: exports.PuRd3, PuRd4: exports.PuRd4, PuRd5: exports.PuRd5, PuRd6: exports.PuRd6, PuRd7: exports.PuRd7, PuRd8: exports.PuRd8, PuRd9: exports.PuRd9 };
exports.OrRd = { OrRd3: exports.OrRd3, OrRd4: exports.OrRd4, OrRd5: exports.OrRd5, OrRd6: exports.OrRd6, OrRd7: exports.OrRd7, OrRd8: exports.OrRd8, OrRd9: exports.OrRd9 };
exports.YlOrRd = { YlOrRd3: exports.YlOrRd3, YlOrRd4: exports.YlOrRd4, YlOrRd5: exports.YlOrRd5, YlOrRd6: exports.YlOrRd6, YlOrRd7: exports.YlOrRd7, YlOrRd8: exports.YlOrRd8, YlOrRd9: exports.YlOrRd9 };
exports.YlOrBr = { YlOrBr3: exports.YlOrBr3, YlOrBr4: exports.YlOrBr4, YlOrBr5: exports.YlOrBr5, YlOrBr6: exports.YlOrBr6, YlOrBr7: exports.YlOrBr7, YlOrBr8: exports.YlOrBr8, YlOrBr9: exports.YlOrBr9 };
exports.Purples = { Purples3: exports.Purples3, Purples4: exports.Purples4, Purples5: exports.Purples5, Purples6: exports.Purples6, Purples7: exports.Purples7, Purples8: exports.Purples8, Purples9: exports.Purples9 };
exports.Blues = { Blues3: exports.Blues3, Blues4: exports.Blues4, Blues5: exports.Blues5, Blues6: exports.Blues6, Blues7: exports.Blues7, Blues8: exports.Blues8, Blues9: exports.Blues9 };
exports.Greens = { Greens3: exports.Greens3, Greens4: exports.Greens4, Greens5: exports.Greens5, Greens6: exports.Greens6, Greens7: exports.Greens7, Greens8: exports.Greens8, Greens9: exports.Greens9 };
exports.Oranges = { Oranges3: exports.Oranges3, Oranges4: exports.Oranges4, Oranges5: exports.Oranges5, Oranges6: exports.Oranges6, Oranges7: exports.Oranges7, Oranges8: exports.Oranges8, Oranges9: exports.Oranges9 };
exports.Reds = { Reds3: exports.Reds3, Reds4: exports.Reds4, Reds5: exports.Reds5, Reds6: exports.Reds6, Reds7: exports.Reds7, Reds8: exports.Reds8, Reds9: exports.Reds9 };
exports.Greys = { Greys3: exports.Greys3, Greys4: exports.Greys4, Greys5: exports.Greys5, Greys6: exports.Greys6, Greys7: exports.Greys7, Greys8: exports.Greys8, Greys9: exports.Greys9, Greys10: exports.Greys10, Greys11: exports.Greys11, Greys256: exports.Greys256 };
exports.PuOr = { PuOr3: exports.PuOr3, PuOr4: exports.PuOr4, PuOr5: exports.PuOr5, PuOr6: exports.PuOr6, PuOr7: exports.PuOr7, PuOr8: exports.PuOr8, PuOr9: exports.PuOr9, PuOr10: exports.PuOr10, PuOr11: exports.PuOr11 };
exports.BrBG = { BrBG3: exports.BrBG3, BrBG4: exports.BrBG4, BrBG5: exports.BrBG5, BrBG6: exports.BrBG6, BrBG7: exports.BrBG7, BrBG8: exports.BrBG8, BrBG9: exports.BrBG9, BrBG10: exports.BrBG10, BrBG11: exports.BrBG11 };
exports.PRGn = { PRGn3: exports.PRGn3, PRGn4: exports.PRGn4, PRGn5: exports.PRGn5, PRGn6: exports.PRGn6, PRGn7: exports.PRGn7, PRGn8: exports.PRGn8, PRGn9: exports.PRGn9, PRGn10: exports.PRGn10, PRGn11: exports.PRGn11 };
exports.PiYG = { PiYG3: exports.PiYG3, PiYG4: exports.PiYG4, PiYG5: exports.PiYG5, PiYG6: exports.PiYG6, PiYG7: exports.PiYG7, PiYG8: exports.PiYG8, PiYG9: exports.PiYG9, PiYG10: exports.PiYG10, PiYG11: exports.PiYG11 };
exports.RdBu = { RdBu3: exports.RdBu3, RdBu4: exports.RdBu4, RdBu5: exports.RdBu5, RdBu6: exports.RdBu6, RdBu7: exports.RdBu7, RdBu8: exports.RdBu8, RdBu9: exports.RdBu9, RdBu10: exports.RdBu10, RdBu11: exports.RdBu11 };
exports.RdGy = { RdGy3: exports.RdGy3, RdGy4: exports.RdGy4, RdGy5: exports.RdGy5, RdGy6: exports.RdGy6, RdGy7: exports.RdGy7, RdGy8: exports.RdGy8, RdGy9: exports.RdGy9, RdGy10: exports.RdGy10, RdGy11: exports.RdGy11 };
exports.RdYlBu = { RdYlBu3: exports.RdYlBu3, RdYlBu4: exports.RdYlBu4, RdYlBu5: exports.RdYlBu5, RdYlBu6: exports.RdYlBu6, RdYlBu7: exports.RdYlBu7, RdYlBu8: exports.RdYlBu8, RdYlBu9: exports.RdYlBu9, RdYlBu10: exports.RdYlBu10, RdYlBu11: exports.RdYlBu11 };
exports.Spectral = { Spectral3: exports.Spectral3, Spectral4: exports.Spectral4, Spectral5: exports.Spectral5, Spectral6: exports.Spectral6, Spectral7: exports.Spectral7, Spectral8: exports.Spectral8, Spectral9: exports.Spectral9, Spectral10: exports.Spectral10, Spectral11: exports.Spectral11 };
exports.RdYlGn = { RdYlGn3: exports.RdYlGn3, RdYlGn4: exports.RdYlGn4, RdYlGn5: exports.RdYlGn5, RdYlGn6: exports.RdYlGn6, RdYlGn7: exports.RdYlGn7, RdYlGn8: exports.RdYlGn8, RdYlGn9: exports.RdYlGn9, RdYlGn10: exports.RdYlGn10, RdYlGn11: exports.RdYlGn11 };
exports.Inferno = { Inferno3: exports.Inferno3, Inferno4: exports.Inferno4, Inferno5: exports.Inferno5, Inferno6: exports.Inferno6, Inferno7: exports.Inferno7, Inferno8: exports.Inferno8, Inferno9: exports.Inferno9, Inferno10: exports.Inferno10, Inferno11: exports.Inferno11, Inferno256: exports.Inferno256 };
exports.Magma = { Magma3: exports.Magma3, Magma4: exports.Magma4, Magma5: exports.Magma5, Magma6: exports.Magma6, Magma7: exports.Magma7, Magma8: exports.Magma8, Magma9: exports.Magma9, Magma10: exports.Magma10, Magma11: exports.Magma11, Magma256: exports.Magma256 };
exports.Plasma = { Plasma3: exports.Plasma3, Plasma4: exports.Plasma4, Plasma5: exports.Plasma5, Plasma6: exports.Plasma6, Plasma7: exports.Plasma7, Plasma8: exports.Plasma8, Plasma9: exports.Plasma9, Plasma10: exports.Plasma10, Plasma11: exports.Plasma11, Plasma256: exports.Plasma256 };
exports.Viridis = { Viridis3: exports.Viridis3, Viridis4: exports.Viridis4, Viridis5: exports.Viridis5, Viridis6: exports.Viridis6, Viridis7: exports.Viridis7, Viridis8: exports.Viridis8, Viridis9: exports.Viridis9, Viridis10: exports.Viridis10, Viridis11: exports.Viridis11, Viridis256: exports.Viridis256 };
exports.Accent = { Accent3: exports.Accent3, Accent4: exports.Accent4, Accent5: exports.Accent5, Accent6: exports.Accent6, Accent7: exports.Accent7, Accent8: exports.Accent8 };
exports.Dark2 = { Dark2_3: exports.Dark2_3, Dark2_4: exports.Dark2_4, Dark2_5: exports.Dark2_5, Dark2_6: exports.Dark2_6, Dark2_7: exports.Dark2_7, Dark2_8: exports.Dark2_8 };
exports.Paired = { Paired3: exports.Paired3, Paired4: exports.Paired4, Paired5: exports.Paired5, Paired6: exports.Paired6, Paired7: exports.Paired7, Paired8: exports.Paired8, Paired9: exports.Paired9, Paired10: exports.Paired10, Paired11: exports.Paired11, Paired12: exports.Paired12 };
exports.Pastel1 = { Pastel1_3: exports.Pastel1_3, Pastel1_4: exports.Pastel1_4, Pastel1_5: exports.Pastel1_5, Pastel1_6: exports.Pastel1_6, Pastel1_7: exports.Pastel1_7, Pastel1_8: exports.Pastel1_8, Pastel1_9: exports.Pastel1_9 };
exports.Pastel2 = { Pastel2_3: exports.Pastel2_3, Pastel2_4: exports.Pastel2_4, Pastel2_5: exports.Pastel2_5, Pastel2_6: exports.Pastel2_6, Pastel2_7: exports.Pastel2_7, Pastel2_8: exports.Pastel2_8 };
exports.Set1 = { Set1_3: exports.Set1_3, Set1_4: exports.Set1_4, Set1_5: exports.Set1_5, Set1_6: exports.Set1_6, Set1_7: exports.Set1_7, Set1_8: exports.Set1_8, Set1_9: exports.Set1_9 };
exports.Set2 = { Set2_3: exports.Set2_3, Set2_4: exports.Set2_4, Set2_5: exports.Set2_5, Set2_6: exports.Set2_6, Set2_7: exports.Set2_7, Set2_8: exports.Set2_8 };
exports.Set3 = { Set3_3: exports.Set3_3, Set3_4: exports.Set3_4, Set3_5: exports.Set3_5, Set3_6: exports.Set3_6, Set3_7: exports.Set3_7, Set3_8: exports.Set3_8, Set3_9: exports.Set3_9, Set3_10: exports.Set3_10, Set3_11: exports.Set3_11, Set3_12: exports.Set3_12 };
exports.Category10 = { Category10_3: exports.Category10_3, Category10_4: exports.Category10_4, Category10_5: exports.Category10_5, Category10_6: exports.Category10_6, Category10_7: exports.Category10_7, Category10_8: exports.Category10_8, Category10_9: exports.Category10_9, Category10_10: exports.Category10_10 };
exports.Category20 = { Category20_3: exports.Category20_3, Category20_4: exports.Category20_4, Category20_5: exports.Category20_5, Category20_6: exports.Category20_6, Category20_7: exports.Category20_7, Category20_8: exports.Category20_8, Category20_9: exports.Category20_9, Category20_10: exports.Category20_10, Category20_11: exports.Category20_11, Category20_12: exports.Category20_12, Category20_13: exports.Category20_13, Category20_14: exports.Category20_14, Category20_15: exports.Category20_15, Category20_16: exports.Category20_16, Category20_17: exports.Category20_17, Category20_18: exports.Category20_18, Category20_19: exports.Category20_19, Category20_20: exports.Category20_20 };
exports.Category20b = { Category20b_3: exports.Category20b_3, Category20b_4: exports.Category20b_4, Category20b_5: exports.Category20b_5, Category20b_6: exports.Category20b_6, Category20b_7: exports.Category20b_7, Category20b_8: exports.Category20b_8, Category20b_9: exports.Category20b_9, Category20b_10: exports.Category20b_10, Category20b_11: exports.Category20b_11, Category20b_12: exports.Category20b_12, Category20b_13: exports.Category20b_13, Category20b_14: exports.Category20b_14, Category20b_15: exports.Category20b_15, Category20b_16: exports.Category20b_16, Category20b_17: exports.Category20b_17, Category20b_18: exports.Category20b_18, Category20b_19: exports.Category20b_19, Category20b_20: exports.Category20b_20 };
exports.Category20c = { Category20c_3: exports.Category20c_3, Category20c_4: exports.Category20c_4, Category20c_5: exports.Category20c_5, Category20c_6: exports.Category20c_6, Category20c_7: exports.Category20c_7, Category20c_8: exports.Category20c_8, Category20c_9: exports.Category20c_9, Category20c_10: exports.Category20c_10, Category20c_11: exports.Category20c_11, Category20c_12: exports.Category20c_12, Category20c_13: exports.Category20c_13, Category20c_14: exports.Category20c_14, Category20c_15: exports.Category20c_15, Category20c_16: exports.Category20c_16, Category20c_17: exports.Category20c_17, Category20c_18: exports.Category20c_18, Category20c_19: exports.Category20c_19, Category20c_20: exports.Category20c_20 };
exports.Colorblind = { Colorblind3: exports.Colorblind3, Colorblind4: exports.Colorblind4, Colorblind5: exports.Colorblind5, Colorblind6: exports.Colorblind6, Colorblind7: exports.Colorblind7, Colorblind8: exports.Colorblind8 };
/****************************************************************************
 * License regarding the Viridis, Magma, Plasma and Inferno colormaps
 * New matplotlib colormaps by Nathaniel J. Smith, Stefan van der Walt,
 * and (in the case of viridis) Eric Firing.
 *
 * The Viridis, Magma, Plasma, and Inferno color maps are released under the
 * CC0 license / public domain dedication. We would appreciate credit if you
 * use or redistribute these colormaps, but do not impose any legal
 * restrictions.
 *
 * To the extent possible under law, the persons who associated CC0 with
 * mpl-colormaps have waived all copyright and related or neighboring rights
 * to mpl-colormaps.
 *
 * You should have received a copy of the CC0 legalcode along with this
 * work.  If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 ****************************************************************************
 * This product includes color specifications and designs developed by
 * Cynthia Brewer (http://colorbrewer2.org/).  The Brewer colormaps are
 * licensed under the Apache v2 license. You may obtain a copy of the
 * License at http://www.apache.org/licenses/LICENSE-2.0
 ****************************************************************************
 * License regarding the D3 color palettes (Category10, Category20,
 * Category20b, and Category 20c):
 *
 * Copyright 2010-2015 Mike Bostock
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * * Neither the name of the author nor the names of contributors may be used to
 *   endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ****************************************************************************
 */

},{}],"api/plotting":[function(require,module,exports){
"use strict";
var _default_tools, _default_tooltips, _known_tools, _with_default, extend = function (child, parent) { for (var key in parent) {
    if (hasProp.call(parent, key))
        child[key] = parent[key];
} function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }, hasProp = {}.hasOwnProperty, slice = [].slice, indexOf = [].indexOf || function (item) { for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item)
        return i;
} return -1; };
var _ = require("underscore");
var $ = require("jquery");
var sprintf = require("sprintf");
var document_1 = require("../document");
var embed = require("../embed");
var embed_1 = require("../embed");
var models = require("./models");
var string_1 = require("../core/util/string");
_default_tooltips = [["index", "$index"], ["data (x, y)", "($x, $y)"], ["canvas (x, y)", "($sx, $sy)"]];
_default_tools = "pan,wheel_zoom,box_zoom,save,reset,help";
_known_tools = {
    pan: function (plot) {
        return new models.PanTool({
            plot: plot,
            dimensions: 'both'
        });
    },
    xpan: function (plot) {
        return new models.PanTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    ypan: function (plot) {
        return new models.PanTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    wheel_zoom: function (plot) {
        return new models.WheelZoomTool({
            plot: plot,
            dimensions: 'both'
        });
    },
    xwheel_zoom: function (plot) {
        return new models.WheelZoomTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    ywheel_zoom: function (plot) {
        return new models.WheelZoomTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    zoom_in: function (plot) {
        return new models.ZoomInTool({
            plot: plot,
            dimensions: 'both'
        });
    },
    xzoom_in: function (plot) {
        return new models.ZoomInTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    yzoom_in: function (plot) {
        return new models.ZoomInTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    zoom_out: function (plot) {
        return new models.ZoomOutTool({
            plot: plot,
            dimensions: 'both'
        });
    },
    xzoom_out: function (plot) {
        return new models.ZoomOutTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    yzoom_out: function (plot) {
        return new models.ZoomOutTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    resize: function (plot) {
        return new models.ResizeTool({
            plot: plot
        });
    },
    click: function (plot) {
        return new models.TapTool({
            plot: plot,
            behavior: "inspect"
        });
    },
    tap: function (plot) {
        return new models.TapTool({
            plot: plot
        });
    },
    crosshair: function (plot) {
        return new models.CrosshairTool({
            plot: plot
        });
    },
    box_select: function (plot) {
        return new models.BoxSelectTool({
            plot: plot
        });
    },
    xbox_select: function (plot) {
        return new models.BoxSelectTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    ybox_select: function (plot) {
        return new models.BoxSelectTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    poly_select: function (plot) {
        return new models.PolySelectTool({
            plot: plot
        });
    },
    lasso_select: function (plot) {
        return new models.LassoSelectTool({
            plot: plot
        });
    },
    box_zoom: function (plot) {
        return new models.BoxZoomTool({
            plot: plot,
            dimensions: 'both'
        });
    },
    xbox_zoom: function (plot) {
        return new models.BoxZoomTool({
            plot: plot,
            dimensions: 'width'
        });
    },
    ybox_zoom: function (plot) {
        return new models.BoxZoomTool({
            plot: plot,
            dimensions: 'height'
        });
    },
    hover: function (plot) {
        return new models.HoverTool({
            plot: plot,
            tooltips: _default_tooltips
        });
    },
    save: function (plot) {
        return new models.SaveTool({
            plot: plot
        });
    },
    previewsave: function (plot) {
        return new models.SaveTool({
            plot: plot
        });
    },
    undo: function (plot) {
        return new models.UndoTool({
            plot: plot
        });
    },
    redo: function (plot) {
        return new models.RedoTool({
            plot: plot
        });
    },
    reset: function (plot) {
        return new models.ResetTool({
            plot: plot
        });
    },
    help: function (plot) {
        return new models.HelpTool({
            plot: plot
        });
    }
};
_with_default = function (value, default_value) {
    if (value === void 0) {
        return default_value;
    }
    else {
        return value;
    }
};
exports.Figure = (function (superClass) {
    extend(Figure, superClass);
    function Figure(attributes, options) {
        var attrs, ref, ref1, ref2, ref3, ref4, ref5, tools, x_axis_label, x_axis_location, x_axis_type, x_minor_ticks, y_axis_label, y_axis_location, y_axis_type, y_minor_ticks;
        if (attributes == null) {
            attributes = {};
        }
        if (options == null) {
            options = {};
        }
        attrs = _.clone(attributes);
        tools = _with_default(attrs.tools, _default_tools);
        delete attrs.tools;
        attrs.x_range = this._get_range(attrs.x_range);
        attrs.y_range = this._get_range(attrs.y_range);
        x_axis_type = _.isUndefined(attrs.x_axis_type) ? "auto" : attrs.x_axis_type;
        y_axis_type = _.isUndefined(attrs.y_axis_type) ? "auto" : attrs.y_axis_type;
        delete attrs.x_axis_type;
        delete attrs.y_axis_type;
        x_minor_ticks = (ref = attrs.x_minor_ticks) != null ? ref : "auto";
        y_minor_ticks = (ref1 = attrs.y_minor_ticks) != null ? ref1 : "auto";
        delete attrs.x_minor_ticks;
        delete attrs.y_minor_ticks;
        x_axis_location = (ref2 = attrs.x_axis_location) != null ? ref2 : "below";
        y_axis_location = (ref3 = attrs.y_axis_location) != null ? ref3 : "left";
        delete attrs.x_axis_location;
        delete attrs.y_axis_location;
        x_axis_label = (ref4 = attrs.x_axis_label) != null ? ref4 : "";
        y_axis_label = (ref5 = attrs.y_axis_label) != null ? ref5 : "";
        delete attrs.x_axis_label;
        delete attrs.y_axis_label;
        if (!_.isUndefined(attrs.width)) {
            if (_.isUndefined(attrs.plot_width)) {
                attrs.plot_width = attrs.width;
            }
            else {
                throw new Error("both 'width' and 'plot_width' can't be given at the same time");
            }
            delete attrs.width;
        }
        if (!_.isUndefined(attrs.height)) {
            if (_.isUndefined(attrs.plot_height)) {
                attrs.plot_height = attrs.height;
            }
            else {
                throw new Error("both 'height' and 'plot_height' can't be given at the same time");
            }
            delete attrs.height;
        }
        Figure.__super__.constructor.call(this, attrs, options);
        this._process_guides(0, x_axis_type, x_axis_location, x_minor_ticks, x_axis_label);
        this._process_guides(1, y_axis_type, y_axis_location, y_minor_ticks, y_axis_label);
        this.add_tools.apply(this, this._process_tools(tools));
        this._legend = new models.Legend({
            plot: this,
            items: []
        });
        this.add_renderers(this._legend);
    }
    Object.defineProperty(Figure.prototype, "xgrid", {
        get: function () {
            return this.renderers.filter(function (r) {
                return r instanceof models.Grid && r.dimension === 0;
            })[0];
        }
    });
    Object.defineProperty(Figure.prototype, "ygrid", {
        get: function () {
            return this.renderers.filter(function (r) {
                return r instanceof models.Grid && r.dimension === 1;
            })[0];
        }
    });
    Object.defineProperty(Figure.prototype, "xaxis", {
        get: function () {
            return this.below.concat(this.above).filter(function (r) {
                return r instanceof models.Axis;
            })[0];
        }
    });
    Object.defineProperty(Figure.prototype, "yaxis", {
        get: function () {
            return this.left.concat(this.right).filter(function (r) {
                return r instanceof models.Axis;
            })[0];
        }
    });
    Figure.prototype.annular_wedge = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args);
    };
    Figure.prototype.annulus = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Annulus, "x,y,inner_radius,outer_radius", args);
    };
    Figure.prototype.arc = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Arc, "x,y,radius,start_angle,end_angle", args);
    };
    Figure.prototype.bezier = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Bezier, "x0,y0,x1,y1,cx0,cy0,cx1,cy1", args);
    };
    Figure.prototype.circle = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Circle, "x,y", args);
    };
    Figure.prototype.ellipse = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Ellipse, "x,y,width,height", args);
    };
    Figure.prototype.image = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Image, "color_mapper,image,rows,cols,x,y,dw,dh", args);
    };
    Figure.prototype.image_rgba = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.ImageRGBA, "image,rows,cols,x,y,dw,dh", args);
    };
    Figure.prototype.image_url = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.ImageURL, "url,x,y,w,h", args);
    };
    Figure.prototype.line = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Line, "x,y", args);
    };
    Figure.prototype.multi_line = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.MultiLine, "xs,ys", args);
    };
    Figure.prototype.oval = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Oval, "x,y,width,height", args);
    };
    Figure.prototype.patch = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Patch, "x,y", args);
    };
    Figure.prototype.patches = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Patches, "xs,ys", args);
    };
    Figure.prototype.quad = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Quad, "left,right,bottom,top", args);
    };
    Figure.prototype.quadratic = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Quadratic, "x0,y0,x1,y1,cx,cy", args);
    };
    Figure.prototype.ray = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Ray, "x,y,length", args);
    };
    Figure.prototype.rect = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Rect, "x,y,width,height", args);
    };
    Figure.prototype.segment = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Segment, "x0,y0,x1,y1", args);
    };
    Figure.prototype.text = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Text, "x,y,text", args);
    };
    Figure.prototype.wedge = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._glyph(models.Wedge, "x,y,radius,start_angle,end_angle", args);
    };
    Figure.prototype.asterisk = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.Asterisk, args);
    };
    Figure.prototype.circle_cross = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.CircleCross, args);
    };
    Figure.prototype.circle_x = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.CircleX, args);
    };
    Figure.prototype.cross = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.Cross, args);
    };
    Figure.prototype.diamond = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.Diamond, args);
    };
    Figure.prototype.diamond_cross = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.DiamondCross, args);
    };
    Figure.prototype.inverted_triangle = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.InvertedTriangle, args);
    };
    Figure.prototype.square = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.Square, args);
    };
    Figure.prototype.square_cross = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.SquareCross, args);
    };
    Figure.prototype.square_x = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.SquareX, args);
    };
    Figure.prototype.triangle = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.Triangle, args);
    };
    Figure.prototype.x = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this._marker(models.X, args);
    };
    Figure.prototype._vectorable = ["fill_color", "fill_alpha", "line_color", "line_alpha", "line_width", "text_color", "text_alpha", "text_font_size"];
    Figure.prototype._default_color = "#1f77b4";
    Figure.prototype._default_alpha = 1.0;
    Figure.prototype._pop_colors_and_alpha = function (cls, attrs, prefix, default_color, default_alpha) {
        var _update_with, alpha, color, result;
        if (prefix == null) {
            prefix = "";
        }
        if (default_color == null) {
            default_color = this._default_color;
        }
        if (default_alpha == null) {
            default_alpha = this._default_alpha;
        }
        result = {};
        color = _with_default(attrs[prefix + "color"], default_color);
        alpha = _with_default(attrs[prefix + "alpha"], default_alpha);
        delete attrs[prefix + "color"];
        delete attrs[prefix + "alpha"];
        _update_with = function (name, default_value) {
            if (cls.prototype.props[name] != null) {
                result[name] = _with_default(attrs[prefix + name], default_value);
                return delete attrs[prefix + name];
            }
        };
        _update_with("fill_color", color);
        _update_with("line_color", color);
        _update_with("text_color", "black");
        _update_with("fill_alpha", alpha);
        _update_with("line_alpha", alpha);
        _update_with("text_alpha", alpha);
        return result;
    };
    Figure.prototype._find_uniq_name = function (data, name) {
        var i, new_name;
        i = 1;
        while (true) {
            new_name = name + "__" + i;
            if (data[new_name] != null) {
                i += 1;
            }
            else {
                return new_name;
            }
        }
    };
    Figure.prototype._fixup_values = function (cls, data, attrs) {
        var name, results, value;
        results = [];
        for (name in attrs) {
            value = attrs[name];
            results.push((function (_this) {
                return function (name, value) {
                    var field, prop;
                    prop = cls.prototype.props[name];
                    if (prop != null) {
                        if (prop.type.prototype.dataspec) {
                            if (value != null) {
                                if (_.isArray(value)) {
                                    if (data[name] != null) {
                                        if (data[name] !== value) {
                                            field = _this._find_uniq_name(data, name);
                                            data[field] = value;
                                        }
                                        else {
                                            field = name;
                                        }
                                    }
                                    else {
                                        field = name;
                                        data[field] = value;
                                    }
                                    return attrs[name] = {
                                        field: field
                                    };
                                }
                                else if (_.isNumber(value) || _.isString(value)) {
                                    return attrs[name] = {
                                        value: value
                                    };
                                }
                            }
                        }
                    }
                };
            })(this)(name, value));
        }
        return results;
    };
    Figure.prototype._glyph = function (cls, params, args) {
        var _make_glyph, attrs, data, fn, glyph, glyph_ca, glyph_renderer, has_hglyph, has_sglyph, hglyph, hglyph_ca, i, j, k, legend, len, nsglyph, nsglyph_ca, opts, param, ref, ref1, sglyph, sglyph_ca, source;
        params = params.split(",");
        if (args.length === 1) {
            attrs = args[0];
            attrs = _.clone(attrs);
        }
        else {
            ref = args, args = 2 <= ref.length ? slice.call(ref, 0, j = ref.length - 1) : (j = 0, []), opts = ref[j++];
            attrs = _.clone(opts);
            fn = function (param, i) {
                return attrs[param] = args[i];
            };
            for (i = k = 0, len = params.length; k < len; i = ++k) {
                param = params[i];
                fn(param, i);
            }
        }
        legend = this._process_legend(attrs.legend, attrs.source);
        delete attrs.legend;
        has_sglyph = _.any(_.keys(attrs), function (key) {
            return string_1.startsWith(key, "selection_");
        });
        has_hglyph = _.any(_.keys(attrs), function (key) {
            return string_1.startsWith(key, "hover_");
        });
        glyph_ca = this._pop_colors_and_alpha(cls, attrs);
        nsglyph_ca = this._pop_colors_and_alpha(cls, attrs, "nonselection_", void 0, 0.1);
        sglyph_ca = has_sglyph ? this._pop_colors_and_alpha(cls, attrs, "selection_") : {};
        hglyph_ca = has_hglyph ? this._pop_colors_and_alpha(cls, attrs, "hover_") : {};
        source = (ref1 = attrs.source) != null ? ref1 : new models.ColumnDataSource();
        data = _.clone(source.data);
        delete attrs.source;
        this._fixup_values(cls, data, glyph_ca);
        this._fixup_values(cls, data, nsglyph_ca);
        this._fixup_values(cls, data, sglyph_ca);
        this._fixup_values(cls, data, hglyph_ca);
        this._fixup_values(cls, data, attrs);
        source.data = data;
        _make_glyph = (function (_this) {
            return function (cls, attrs, extra_attrs) {
                return new cls(_.extend({}, attrs, extra_attrs));
            };
        })(this);
        glyph = _make_glyph(cls, attrs, glyph_ca);
        nsglyph = _make_glyph(cls, attrs, nsglyph_ca);
        sglyph = has_sglyph ? _make_glyph(cls, attrs, sglyph_ca) : null;
        hglyph = has_hglyph ? _make_glyph(cls, attrs, hglyph_ca) : null;
        glyph_renderer = new models.GlyphRenderer({
            data_source: source,
            glyph: glyph,
            nonselection_glyph: nsglyph,
            selection_glyph: sglyph,
            hover_glyph: hglyph
        });
        if (legend != null) {
            this._update_legend(legend, glyph_renderer);
        }
        this.add_renderers(glyph_renderer);
        return glyph_renderer;
    };
    Figure.prototype._marker = function (cls, args) {
        return this._glyph(cls, "x,y", args);
    };
    Figure.prototype._get_range = function (range) {
        if (range == null) {
            return new models.DataRange1d();
        }
        if (range instanceof models.Range) {
            return range;
        }
        if (_.isArray(range)) {
            if (_.all(function (x) {
                var j, len, results;
                results = [];
                for (j = 0, len = range.length; j < len; j++) {
                    x = range[j];
                    results.push(_.isString(x));
                }
                return results;
            })) {
                return new models.FactorRange({
                    factors: range
                });
            }
            if (range.length === 2) {
                return new models.Range1d({
                    start: range[0],
                    end: range[1]
                });
            }
        }
    };
    Figure.prototype._process_guides = function (dim, axis_type, axis_location, minor_ticks, axis_label) {
        var axis, axiscls, grid, range;
        range = dim === 0 ? this.x_range : this.y_range;
        axiscls = this._get_axis_class(axis_type, range);
        if (axiscls != null) {
            if (axiscls === models.LogAxis) {
                if (dim === 0) {
                    this.x_mapper_type = 'log';
                }
                else {
                    this.y_mapper_type = 'log';
                }
            }
            axis = new axiscls();
            if (axis.ticker instanceof models.ContinuousTicker) {
                axis.ticker.num_minor_ticks = this._get_num_minor_ticks(axiscls, minor_ticks);
            }
            if (axis_label.length !== 0) {
                axis.axis_label = axis_label;
            }
            grid = new models.Grid({
                dimension: dim,
                ticker: axis.ticker
            });
            this.add_layout(axis, axis_location);
            return this.add_layout(grid);
        }
    };
    Figure.prototype._get_axis_class = function (axis_type, range) {
        if (axis_type == null) {
            return null;
        }
        if (axis_type === "linear") {
            return models.LinearAxis;
        }
        if (axis_type === "log") {
            return models.LogAxis;
        }
        if (axis_type === "datetime") {
            return models.DatetimeAxis;
        }
        if (axis_type === "auto") {
            if (range instanceof models.FactorRange) {
                return models.CategoricalAxis;
            }
            else {
                return models.LinearAxis;
            }
        }
    };
    Figure.prototype._get_num_minor_ticks = function (axis_class, num_minor_ticks) {
        if (_.isNumber(num_minor_ticks)) {
            if (num_minor_ticks <= 1) {
                throw new Error("num_minor_ticks must be > 1");
            }
            return num_minor_ticks;
        }
        if (num_minor_ticks == null) {
            return 0;
        }
        if (num_minor_ticks === 'auto') {
            if (axis_class === models.LogAxis) {
                return 10;
            }
            return 5;
        }
    };
    Figure.prototype._process_tools = function (tools) {
        var objs, tool;
        if (_.isString(tools)) {
            tools = tools.split(/\s*,\s*/);
        }
        objs = (function () {
            var j, len, results;
            results = [];
            for (j = 0, len = tools.length; j < len; j++) {
                tool = tools[j];
                if (_.isString(tool)) {
                    results.push(_known_tools[tool](this));
                }
                else {
                    results.push(tool);
                }
            }
            return results;
        }).call(this);
        return objs;
    };
    Figure.prototype._process_legend = function (legend, source) {
        var legend_item_label;
        legend_item_label = null;
        if (legend != null) {
            if (_.isString(legend)) {
                legend_item_label = {
                    value: legend
                };
                if ((source != null) && (source.column_names != null)) {
                    if (indexOf.call(source.column_names, legend) >= 0) {
                        legend_item_label = {
                            field: legend
                        };
                    }
                }
            }
            else {
                legend_item_label = legend;
            }
        }
        return legend_item_label;
    };
    Figure.prototype._update_legend = function (legend_item_label, glyph_renderer) {
        var added, item, j, len, new_item, ref;
        added = false;
        ref = this._legend.items;
        for (j = 0, len = ref.length; j < len; j++) {
            item = ref[j];
            if (_.isEqual(item.label, legend_item_label)) {
                if (item.label.value != null) {
                    item.renderers.push(glyph_renderer);
                    added = true;
                    break;
                }
                if ((item.label.field != null) && glyph_renderer.data_source === item.renderers[0].data_source) {
                    item.renderers.push(glyph_renderer);
                    added = true;
                    break;
                }
            }
        }
        if (!added) {
            new_item = new models.LegendItem({
                label: legend_item_label,
                renderers: [glyph_renderer]
            });
            return this._legend.items.push(new_item);
        }
    };
    return Figure;
})(models.Plot);
exports.figure = function (attributes, options) {
    if (attributes == null) {
        attributes = {};
    }
    if (options == null) {
        options = {};
    }
    return new exports.Figure(attributes, options);
};
exports.show = function (obj, target) {
    var _obj, div, doc, j, len, multiple, views;
    multiple = _.isArray(obj);
    doc = new document_1.Document();
    if (!multiple) {
        doc.add_root(obj);
    }
    else {
        for (j = 0, len = obj.length; j < len; j++) {
            _obj = obj[j];
            doc.add_root(_obj);
        }
    }
    div = $("<div class=" + embed_1.BOKEH_ROOT + ">");
    $(target != null ? target : "body").append(div);
    views = embed.add_document_standalone(doc, div);
    if (!multiple) {
        return views[obj.id];
    }
    else {
        return views;
    }
};
exports.color = function (r, g, b) {
    return sprintf("#%02x%02x%02x", r, g, b);
};
exports.gridplot = function (children, options) {
    var grid, item, j, k, l, layout, len, len1, len2, neighbor, row, row_children, row_tools, rows, sizing_mode, toolbar, toolbar_location, toolbar_sizing_mode, tools;
    if (options == null) {
        options = {};
    }
    toolbar_location = _.isUndefined(options.toolbar_location) ? 'above' : options.toolbar_location;
    sizing_mode = _.isUndefined(options.sizing_mode) ? 'fixed' : options.sizing_mode;
    toolbar_sizing_mode = options.sizing_mode === 'fixed' ? 'scale_width' : sizing_mode;
    tools = [];
    rows = [];
    for (j = 0, len = children.length; j < len; j++) {
        row = children[j];
        row_tools = [];
        row_children = [];
        for (k = 0, len1 = row.length; k < len1; k++) {
            item = row[k];
            if (item instanceof models.Plot) {
                row_tools = row_tools.concat(item.toolbar.tools);
                item.toolbar_location = null;
            }
            if (item === null) {
                for (l = 0, len2 = row.length; l < len2; l++) {
                    neighbor = row[l];
                    if (neighbor instanceof models.Plot) {
                        break;
                    }
                }
                item = new models.Spacer({
                    width: neighbor.plot_width,
                    height: neighbor.plot_height
                });
            }
            if (item instanceof models.LayoutDOM) {
                item.sizing_mode = sizing_mode;
                row_children.push(item);
            }
            else {
                throw new Error("only LayoutDOM items can be inserted into Grid");
            }
        }
        tools = tools.concat(row_tools);
        row = new models.Row({
            children: row_children,
            sizing_mode: sizing_mode
        });
        rows.push(row);
    }
    grid = new models.Column({
        children: rows,
        sizing_mode: sizing_mode
    });
    layout = (function () {
        if (toolbar_location) {
            toolbar = new models.ToolbarBox({
                tools: tools,
                sizing_mode: toolbar_sizing_mode,
                toolbar_location: toolbar_location
            });
            switch (toolbar_location) {
                case 'above':
                    return new models.Column({
                        children: [toolbar, grid],
                        sizing_mode: sizing_mode
                    });
                case 'below':
                    return new models.Column({
                        children: [grid, toolbar],
                        sizing_mode: sizing_mode
                    });
                case 'left':
                    return new models.Row({
                        children: [toolbar, grid],
                        sizing_mode: sizing_mode
                    });
                case 'right':
                    return new models.Row({
                        children: [grid, toolbar],
                        sizing_mode: sizing_mode
                    });
            }
        }
        else {
            return grid;
        }
    })();
    return layout;
};

},{"../core/util/string":"core/util/string","../document":"document","../embed":"embed","./models":"api/models","jquery":"jquery","sprintf":"sprintf","underscore":"underscore"}],"core/util/string":[function(require,module,exports){
"use strict";
exports.startsWith = function (str, searchString, position) {
    if (position == null) {
        position = 0;
    }
    return str.substr(position, searchString.length) === searchString;
};

},{}]},{},["api"])

 })()/*
Copyright (c) 2012, Continuum Analytics, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

Neither the name of Continuum Analytics nor the names of any contributors
may be used to endorse or promote products derived from this software 
without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF 
THE POSSIBILITY OF SUCH DAMAGE.
*/
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9icnlhbi93b3JrL2Jva2VoL2Jva2VoanMvc3JjL2pzL3BsdWdpbi1wcmVsdWRlLmpzIiwiYnVpbGQvanMvdHJlZS9hcGkuanMiLCJidWlsZC9qcy90cmVlL2FwaS9jaGFydHMuanMiLCJidWlsZC9qcy90cmVlL2FwaS9saW5hbGcuanMiLCJidWlsZC9qcy90cmVlL2FwaS9tb2RlbHMuanMiLCJidWlsZC9qcy90cmVlL2FwaS9wYWxldHRlcy5qcyIsImJ1aWxkL2pzL3RyZWUvYXBpL3Bsb3R0aW5nLmpzIiwiYnVpbGQvanMvdHJlZS9jb3JlL3V0aWwvc3RyaW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBvdXRlcihtb2R1bGVzLCBjYWNoZSwgZW50cnkpIHtcbiAgaWYgKEJva2VoICE9IG51bGwpIHtcbiAgICBmb3IgKHZhciBuYW1lIGluIG1vZHVsZXMpIHtcbiAgICAgIEJva2VoLnJlcXVpcmUubW9kdWxlc1tuYW1lXSA9IG1vZHVsZXNbbmFtZV07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBsdWdpbiA9IEJva2VoLnJlcXVpcmUoZW50cnlbMF0pO1xuICAgICAgQm9rZWguTW9kZWxzLnJlZ2lzdGVyX21vZGVscyhwbHVnaW4ubW9kZWxzKTtcblxuICAgICAgZm9yICh2YXIgbmFtZSBpbiBwbHVnaW4pIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IFwibW9kZWxzXCIpIHtcbiAgICAgICAgICBCb2tlaFtuYW1lXSA9IHBsdWdpbltuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBCb2tlaC4gWW91IGhhdmUgdG8gbG9hZCBpdCBwcmlvciB0byBsb2FkaW5nIHBsdWdpbnMuXCIpO1xuICB9XG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxudmFyIExpbkFsZyA9IHJlcXVpcmUoXCIuL2FwaS9saW5hbGdcIik7XG5leHBvcnRzLkxpbkFsZyA9IExpbkFsZztcbnZhciBDaGFydHMgPSByZXF1aXJlKFwiLi9hcGkvY2hhcnRzXCIpO1xuZXhwb3J0cy5DaGFydHMgPSBDaGFydHM7XG52YXIgUGxvdHRpbmcgPSByZXF1aXJlKFwiLi9hcGkvcGxvdHRpbmdcIik7XG5leHBvcnRzLlBsb3R0aW5nID0gUGxvdHRpbmc7XG52YXIgZG9jdW1lbnRfMSA9IHJlcXVpcmUoXCIuL2RvY3VtZW50XCIpO1xuZXhwb3J0cy5Eb2N1bWVudCA9IGRvY3VtZW50XzEuRG9jdW1lbnQ7XG52YXIgc3ByaW50ZiA9IHJlcXVpcmUoXCJzcHJpbnRmXCIpO1xuZXhwb3J0cy5zcHJpbnRmID0gc3ByaW50Zjtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL2FwaS9tb2RlbHNcIikpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY3Vtc3VtLCBoZXhjb2xvcjJyZ2IsIGlzX2RhcmssIG51bTJoZXhjb2xvciwgc3VtO1xudmFyIF8gPSByZXF1aXJlKFwidW5kZXJzY29yZVwiKTtcbnZhciBzcHJpbnRmID0gcmVxdWlyZShcInNwcmludGZcIik7XG52YXIgbW9kZWxzID0gcmVxdWlyZShcIi4vbW9kZWxzXCIpO1xudmFyIHBhbGV0dGVzID0gcmVxdWlyZShcIi4vcGFsZXR0ZXNcIik7XG5zdW0gPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXkucmVkdWNlKCgoZnVuY3Rpb24gKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgKyBiO1xuICAgICAgICB9O1xuICAgIH0pKHRoaXMpKSwgMCk7XG59O1xuY3Vtc3VtID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICByZXN1bHQgPSBbXTtcbiAgICBhcnJheS5yZWR1Y2UoKGZ1bmN0aW9uIChhLCBiLCBpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRbaV0gPSBhICsgYjtcbiAgICB9KSwgMCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5udW0yaGV4Y29sb3IgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIHNwcmludGYoXCIjJTA2eFwiLCBudW0pO1xufTtcbmhleGNvbG9yMnJnYiA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgIHZhciBiLCBnLCByO1xuICAgIHIgPSBwYXJzZUludChjb2xvci5zdWJzdHIoMSwgMiksIDE2KTtcbiAgICBnID0gcGFyc2VJbnQoY29sb3Iuc3Vic3RyKDMsIDIpLCAxNik7XG4gICAgYiA9IHBhcnNlSW50KGNvbG9yLnN1YnN0cig1LCAyKSwgMTYpO1xuICAgIHJldHVybiBbciwgZywgYl07XG59O1xuaXNfZGFyayA9IGZ1bmN0aW9uIChhcmcpIHtcbiAgICB2YXIgYiwgZywgbCwgcjtcbiAgICByID0gYXJnWzBdLCBnID0gYXJnWzFdLCBiID0gYXJnWzJdO1xuICAgIGwgPSAxIC0gKDAuMjk5ICogciArIDAuNTg3ICogZyArIDAuMTE0ICogYikgLyAyNTU7XG4gICAgcmV0dXJuIGwgPj0gMC42O1xufTtcbmV4cG9ydHMucGllID0gZnVuY3Rpb24gKGRhdGEsIG9wdHMpIHtcbiAgICB2YXIgYW5nbGVfc3BhbiwgY29sb3JzLCBjdW11bGF0aXZlX3ZhbHVlcywgY3gsIGN5LCBlbmRfYW5nbGUsIGVuZF9hbmdsZXMsIGcxLCBnMiwgaDEsIGhhbGZfYW5nbGVzLCBoYWxmX3JhZGl1cywgaG92ZXIsIGksIGlubmVyX3JhZGl1cywgaywgbGFiZWxzLCBub3JtYWxpemVkX3ZhbHVlcywgb3V0ZXJfcmFkaXVzLCBwYWxldHRlLCBwbG90LCByMSwgcjIsIHJlZiwgcmVmMSwgcmVmMiwgcmVmMywgcmVmNCwgcmVmNSwgcmVmNiwgcmVmNywgc291cmNlLCBzdGFydF9hbmdsZSwgc3RhcnRfYW5nbGVzLCB0ZXh0X2FuZ2xlcywgdGV4dF9jb2xvcnMsIHRleHRfY3gsIHRleHRfY3ksIHRvX2NhcnRlc2lhbiwgdG9fcmFkaWFucywgdG9vbHRpcCwgdG90YWxfdmFsdWUsIHZhbHVlcywgeGRyLCB5ZHI7XG4gICAgaWYgKG9wdHMgPT0gbnVsbCkge1xuICAgICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIGxhYmVscyA9IFtdO1xuICAgIHZhbHVlcyA9IFtdO1xuICAgIGZvciAoaSA9IGsgPSAwLCByZWYgPSBNYXRoLm1pbihkYXRhLmxhYmVscy5sZW5ndGgsIGRhdGEudmFsdWVzLmxlbmd0aCk7IDAgPD0gcmVmID8gayA8IHJlZiA6IGsgPiByZWY7IGkgPSAwIDw9IHJlZiA/ICsrayA6IC0taykge1xuICAgICAgICBpZiAoZGF0YS52YWx1ZXNbaV0gPiAwKSB7XG4gICAgICAgICAgICBsYWJlbHMucHVzaChkYXRhLmxhYmVsc1tpXSk7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaChkYXRhLnZhbHVlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhcnRfYW5nbGUgPSAocmVmMSA9IG9wdHMuc3RhcnRfYW5nbGUpICE9IG51bGwgPyByZWYxIDogMDtcbiAgICBlbmRfYW5nbGUgPSAocmVmMiA9IG9wdHMuZW5kX2FuZ2xlKSAhPSBudWxsID8gcmVmMiA6IHN0YXJ0X2FuZ2xlICsgMiAqIE1hdGguUEk7XG4gICAgYW5nbGVfc3BhbiA9IE1hdGguYWJzKGVuZF9hbmdsZSAtIHN0YXJ0X2FuZ2xlKTtcbiAgICB0b19yYWRpYW5zID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIGFuZ2xlX3NwYW4gKiB4O1xuICAgIH07XG4gICAgdG90YWxfdmFsdWUgPSBzdW0odmFsdWVzKTtcbiAgICBub3JtYWxpemVkX3ZhbHVlcyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgcmV0dXJuIHYgLyB0b3RhbF92YWx1ZTtcbiAgICB9KTtcbiAgICBjdW11bGF0aXZlX3ZhbHVlcyA9IGN1bXN1bShub3JtYWxpemVkX3ZhbHVlcyk7XG4gICAgZW5kX2FuZ2xlcyA9IGN1bXVsYXRpdmVfdmFsdWVzLm1hcChmdW5jdGlvbiAodikge1xuICAgICAgICByZXR1cm4gc3RhcnRfYW5nbGUgKyB0b19yYWRpYW5zKHYpO1xuICAgIH0pO1xuICAgIHN0YXJ0X2FuZ2xlcyA9IFtzdGFydF9hbmdsZV0uY29uY2F0KGVuZF9hbmdsZXMuc2xpY2UoMCwgLTEpKTtcbiAgICBoYWxmX2FuZ2xlcyA9IF8uemlwKHN0YXJ0X2FuZ2xlcywgZW5kX2FuZ2xlcykubWFwKChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgICAgIHZhciBlbmQsIHN0YXJ0O1xuICAgICAgICAgICAgc3RhcnQgPSBhcmdbMF0sIGVuZCA9IGFyZ1sxXTtcbiAgICAgICAgICAgIHJldHVybiAoc3RhcnQgKyBlbmQpIC8gMjtcbiAgICAgICAgfTtcbiAgICB9KSh0aGlzKSk7XG4gICAgaWYgKG9wdHMuY2VudGVyID09IG51bGwpIHtcbiAgICAgICAgY3ggPSAwO1xuICAgICAgICBjeSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKF8uaXNBcnJheShvcHRzLmNlbnRlcikpIHtcbiAgICAgICAgY3ggPSBvcHRzLmNlbnRlclswXTtcbiAgICAgICAgY3kgPSBvcHRzLmNlbnRlclsxXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGN4ID0gb3B0cy5jZW50ZXIueDtcbiAgICAgICAgY3kgPSBvcHRzLmNlbnRlci55O1xuICAgIH1cbiAgICBpbm5lcl9yYWRpdXMgPSAocmVmMyA9IG9wdHMuaW5uZXJfcmFkaXVzKSAhPSBudWxsID8gcmVmMyA6IDA7XG4gICAgb3V0ZXJfcmFkaXVzID0gKHJlZjQgPSBvcHRzLm91dGVyX3JhZGl1cykgIT0gbnVsbCA/IHJlZjQgOiAxO1xuICAgIGlmIChfLmlzQXJyYXkob3B0cy5wYWxldHRlKSkge1xuICAgICAgICBwYWxldHRlID0gb3B0cy5wYWxldHRlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcGFsZXR0ZSA9IHBhbGV0dGVzWyhyZWY1ID0gb3B0cy5wYWxldHRlKSAhPSBudWxsID8gcmVmNSA6IFwiU3BlY3RyYWwxMVwiXS5tYXAobnVtMmhleGNvbG9yKTtcbiAgICB9XG4gICAgY29sb3JzID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0sIHJlZjYsIHJlc3VsdHM7XG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChpID0gbSA9IDAsIHJlZjYgPSBub3JtYWxpemVkX3ZhbHVlcy5sZW5ndGg7IDAgPD0gcmVmNiA/IG0gPCByZWY2IDogbSA+IHJlZjY7IGkgPSAwIDw9IHJlZjYgPyArK20gOiAtLW0pIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChwYWxldHRlW2kgJSBwYWxldHRlLmxlbmd0aF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pKCk7XG4gICAgdGV4dF9jb2xvcnMgPSBjb2xvcnMubWFwKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGlmIChpc19kYXJrKGhleGNvbG9yMnJnYihjKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBcIndoaXRlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJibGFja1wiO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdG9fY2FydGVzaWFuID0gZnVuY3Rpb24gKHIsIGFscGhhKSB7XG4gICAgICAgIHJldHVybiBbciAqIE1hdGguY29zKGFscGhhKSwgciAqIE1hdGguc2luKGFscGhhKV07XG4gICAgfTtcbiAgICBoYWxmX3JhZGl1cyA9IChpbm5lcl9yYWRpdXMgKyBvdXRlcl9yYWRpdXMpIC8gMjtcbiAgICByZWY2ID0gXy51bnppcChoYWxmX2FuZ2xlcy5tYXAoKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGhhbGZfYW5nbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0b19jYXJ0ZXNpYW4oaGFsZl9yYWRpdXMsIGhhbGZfYW5nbGUpO1xuICAgICAgICB9O1xuICAgIH0pKHRoaXMpKSksIHRleHRfY3ggPSByZWY2WzBdLCB0ZXh0X2N5ID0gcmVmNlsxXTtcbiAgICB0ZXh0X2N4ID0gdGV4dF9jeC5tYXAoZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggKyBjeDtcbiAgICB9KTtcbiAgICB0ZXh0X2N5ID0gdGV4dF9jeS5tYXAoZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgcmV0dXJuIHkgKyBjeTtcbiAgICB9KTtcbiAgICB0ZXh0X2FuZ2xlcyA9IGhhbGZfYW5nbGVzLm1hcChmdW5jdGlvbiAoYSkge1xuICAgICAgICBpZiAoYSA+PSBNYXRoLlBJIC8gMiAmJiBhIDw9IDMgKiBNYXRoLlBJIC8gMikge1xuICAgICAgICAgICAgcmV0dXJuIGEgKyBNYXRoLlBJO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzb3VyY2UgPSBuZXcgQm9rZWguQ29sdW1uRGF0YVNvdXJjZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxhYmVsczogbGFiZWxzLFxuICAgICAgICAgICAgdmFsdWVzOiB2YWx1ZXMsXG4gICAgICAgICAgICBwZXJjZW50YWdlczogbm9ybWFsaXplZF92YWx1ZXMubWFwKChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwcmludGYoXCIlLjJmJSVcIiwgdiAqIDEwMCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKHRoaXMpKSxcbiAgICAgICAgICAgIHN0YXJ0X2FuZ2xlczogc3RhcnRfYW5nbGVzLFxuICAgICAgICAgICAgZW5kX2FuZ2xlczogZW5kX2FuZ2xlcyxcbiAgICAgICAgICAgIHRleHRfYW5nbGVzOiB0ZXh0X2FuZ2xlcyxcbiAgICAgICAgICAgIGNvbG9yczogY29sb3JzLFxuICAgICAgICAgICAgdGV4dF9jb2xvcnM6IHRleHRfY29sb3JzLFxuICAgICAgICAgICAgdGV4dF9jeDogdGV4dF9jeCxcbiAgICAgICAgICAgIHRleHRfY3k6IHRleHRfY3lcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGcxID0gbmV3IG1vZGVscy5Bbm51bGFyV2VkZ2Uoe1xuICAgICAgICB4OiBjeCxcbiAgICAgICAgeTogY3ksXG4gICAgICAgIGlubmVyX3JhZGl1czogaW5uZXJfcmFkaXVzLFxuICAgICAgICBvdXRlcl9yYWRpdXM6IG91dGVyX3JhZGl1cyxcbiAgICAgICAgc3RhcnRfYW5nbGU6IHtcbiAgICAgICAgICAgIGZpZWxkOiBcInN0YXJ0X2FuZ2xlc1wiXG4gICAgICAgIH0sXG4gICAgICAgIGVuZF9hbmdsZToge1xuICAgICAgICAgICAgZmllbGQ6IFwiZW5kX2FuZ2xlc1wiXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVfY29sb3I6IG51bGwsXG4gICAgICAgIGxpbmVfd2lkdGg6IDEsXG4gICAgICAgIGZpbGxfY29sb3I6IHtcbiAgICAgICAgICAgIGZpZWxkOiBcImNvbG9yc1wiXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBoMSA9IG5ldyBtb2RlbHMuQW5udWxhcldlZGdlKHtcbiAgICAgICAgeDogY3gsXG4gICAgICAgIHk6IGN5LFxuICAgICAgICBpbm5lcl9yYWRpdXM6IGlubmVyX3JhZGl1cyxcbiAgICAgICAgb3V0ZXJfcmFkaXVzOiBvdXRlcl9yYWRpdXMsXG4gICAgICAgIHN0YXJ0X2FuZ2xlOiB7XG4gICAgICAgICAgICBmaWVsZDogXCJzdGFydF9hbmdsZXNcIlxuICAgICAgICB9LFxuICAgICAgICBlbmRfYW5nbGU6IHtcbiAgICAgICAgICAgIGZpZWxkOiBcImVuZF9hbmdsZXNcIlxuICAgICAgICB9LFxuICAgICAgICBsaW5lX2NvbG9yOiBudWxsLFxuICAgICAgICBsaW5lX3dpZHRoOiAxLFxuICAgICAgICBmaWxsX2NvbG9yOiB7XG4gICAgICAgICAgICBmaWVsZDogXCJjb2xvcnNcIlxuICAgICAgICB9LFxuICAgICAgICBmaWxsX2FscGhhOiAwLjhcbiAgICB9KTtcbiAgICByMSA9IG5ldyBtb2RlbHMuR2x5cGhSZW5kZXJlcih7XG4gICAgICAgIGRhdGFfc291cmNlOiBzb3VyY2UsXG4gICAgICAgIGdseXBoOiBnMSxcbiAgICAgICAgaG92ZXJfZ2x5cGg6IGgxXG4gICAgfSk7XG4gICAgZzIgPSBuZXcgbW9kZWxzLlRleHQoe1xuICAgICAgICB4OiB7XG4gICAgICAgICAgICBmaWVsZDogXCJ0ZXh0X2N4XCJcbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgICAgZmllbGQ6IFwidGV4dF9jeVwiXG4gICAgICAgIH0sXG4gICAgICAgIHRleHQ6IHtcbiAgICAgICAgICAgIGZpZWxkOiAocmVmNyA9IG9wdHMuc2xpY2VfbGFiZWxzKSAhPSBudWxsID8gcmVmNyA6IFwibGFiZWxzXCJcbiAgICAgICAgfSxcbiAgICAgICAgYW5nbGU6IHtcbiAgICAgICAgICAgIGZpZWxkOiBcInRleHRfYW5nbGVzXCJcbiAgICAgICAgfSxcbiAgICAgICAgdGV4dF9hbGlnbjogXCJjZW50ZXJcIixcbiAgICAgICAgdGV4dF9iYXNlbGluZTogXCJtaWRkbGVcIixcbiAgICAgICAgdGV4dF9jb2xvcjoge1xuICAgICAgICAgICAgZmllbGQ6IFwidGV4dF9jb2xvcnNcIlxuICAgICAgICB9LFxuICAgICAgICB0ZXh0X2ZvbnRfc2l6ZTogXCI5cHRcIlxuICAgIH0pO1xuICAgIHIyID0gbmV3IG1vZGVscy5HbHlwaFJlbmRlcmVyKHtcbiAgICAgICAgZGF0YV9zb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgZ2x5cGg6IGcyXG4gICAgfSk7XG4gICAgeGRyID0gbmV3IG1vZGVscy5EYXRhUmFuZ2UxZCh7XG4gICAgICAgIHJlbmRlcmVyczogW3IxXSxcbiAgICAgICAgcmFuZ2VfcGFkZGluZzogMC4yXG4gICAgfSk7XG4gICAgeWRyID0gbmV3IG1vZGVscy5EYXRhUmFuZ2UxZCh7XG4gICAgICAgIHJlbmRlcmVyczogW3IxXSxcbiAgICAgICAgcmFuZ2VfcGFkZGluZzogMC4yXG4gICAgfSk7XG4gICAgcGxvdCA9IG5ldyBtb2RlbHMuUGxvdCh7XG4gICAgICAgIHhfcmFuZ2U6IHhkcixcbiAgICAgICAgeV9yYW5nZTogeWRyXG4gICAgfSk7XG4gICAgaWYgKG9wdHMud2lkdGggIT0gbnVsbCkge1xuICAgICAgICBwbG90LnBsb3Rfd2lkdGggPSBvcHRzLndpZHRoO1xuICAgIH1cbiAgICBpZiAob3B0cy5oZWlnaHQgIT0gbnVsbCkge1xuICAgICAgICBwbG90LnBsb3RfaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgfVxuICAgIHBsb3QuYWRkX3JlbmRlcmVycyhyMSwgcjIpO1xuICAgIHRvb2x0aXAgPSBcIjxkaXY+QGxhYmVsczwvZGl2PjxkaXY+PGI+QHZhbHVlczwvYj4gKEBwZXJjZW50YWdlcyk8L2Rpdj5cIjtcbiAgICBob3ZlciA9IG5ldyBtb2RlbHMuSG92ZXJUb29sKHtcbiAgICAgICAgcmVuZGVyZXJzOiBbcjFdLFxuICAgICAgICB0b29sdGlwczogdG9vbHRpcFxuICAgIH0pO1xuICAgIHBsb3QuYWRkX3Rvb2xzKGhvdmVyKTtcbiAgICByZXR1cm4gcGxvdDtcbn07XG5leHBvcnRzLmJhciA9IGZ1bmN0aW9uIChkYXRhLCBvcHRzKSB7XG4gICAgdmFyIGFuY2hvciwgYXR0YWNobWVudCwgYm90dG9tLCBjb2x1bW5fbmFtZXMsIGNvbHVtbnMsIGR5LCBnMSwgaG92ZXIsIGksIGosIGssIGxhYmVsLCBsYWJlbHMsIGxlZnQsIGxlbiwgbGVuMSwgbGVuMiwgbGVuMywgbGVuNCwgbSwgbiwgbmFtZSwgbywgb3JpZW50YXRpb24sIHAsIHBhbGV0dGUsIHBsb3QsIHEsIHIsIHIxLCByZWYsIHJlZjEsIHJlZjIsIHJlZjMsIHJlZjQsIHJlZjUsIHJlZjYsIHJlZjcsIHJlZjgsIHJlbmRlcmVycywgcmlnaHQsIHJvdywgcm93cywgcywgc291cmNlLCBzdGFja2VkLCB0b29sdGlwLCB0b3AsIHYsIHhheGlzLCB4ZHIsIHhmb3JtYXR0ZXIsIHlheGlzLCB5ZHI7XG4gICAgaWYgKG9wdHMgPT0gbnVsbCkge1xuICAgICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIGNvbHVtbl9uYW1lcyA9IGRhdGFbMF07XG4gICAgcm93cyA9IGRhdGEuc2xpY2UoMSk7XG4gICAgY29sdW1ucyA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBrLCBsZW4sIHJlc3VsdHM7XG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChrID0gMCwgbGVuID0gY29sdW1uX25hbWVzLmxlbmd0aDsgayA8IGxlbjsgaysrKSB7XG4gICAgICAgICAgICBuYW1lID0gY29sdW1uX25hbWVzW2tdO1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KSgpO1xuICAgIGZvciAoayA9IDAsIGxlbiA9IHJvd3MubGVuZ3RoOyBrIDwgbGVuOyBrKyspIHtcbiAgICAgICAgcm93ID0gcm93c1trXTtcbiAgICAgICAgZm9yIChpID0gbSA9IDAsIGxlbjEgPSByb3cubGVuZ3RoOyBtIDwgbGVuMTsgaSA9ICsrbSkge1xuICAgICAgICAgICAgdiA9IHJvd1tpXTtcbiAgICAgICAgICAgIGNvbHVtbnNbaV0ucHVzaCh2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsYWJlbHMgPSBjb2x1bW5zWzBdLm1hcChmdW5jdGlvbiAodikge1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIGNvbHVtbnMgPSBjb2x1bW5zLnNsaWNlKDEpO1xuICAgIHlheGlzID0gbmV3IG1vZGVscy5DYXRlZ29yaWNhbEF4aXMoKTtcbiAgICB5ZHIgPSBuZXcgbW9kZWxzLkZhY3RvclJhbmdlKHtcbiAgICAgICAgZmFjdG9yczogbGFiZWxzXG4gICAgfSk7XG4gICAgaWYgKG9wdHMuYXhpc19udW1iZXJfZm9ybWF0ICE9IG51bGwpIHtcbiAgICAgICAgeGZvcm1hdHRlciA9IG5ldyBtb2RlbHMuTnVtZXJhbFRpY2tGb3JtYXR0ZXIoe1xuICAgICAgICAgICAgZm9ybWF0OiBvcHRzLmF4aXNfbnVtYmVyX2Zvcm1hdFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHhmb3JtYXR0ZXIgPSBuZXcgbW9kZWxzLkJhc2ljVGlja0Zvcm1hdHRlcigpO1xuICAgIH1cbiAgICB4YXhpcyA9IG5ldyBtb2RlbHMuTGluZWFyQXhpcyh7XG4gICAgICAgIGZvcm1hdHRlcjogeGZvcm1hdHRlclxuICAgIH0pO1xuICAgIHhkciA9IG5ldyBtb2RlbHMuRGF0YVJhbmdlMWQoe1xuICAgICAgICBzdGFydDogMFxuICAgIH0pO1xuICAgIGlmIChfLmlzQXJyYXkob3B0cy5wYWxldHRlKSkge1xuICAgICAgICBwYWxldHRlID0gb3B0cy5wYWxldHRlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcGFsZXR0ZSA9IHBhbGV0dGVzWyhyZWYgPSBvcHRzLnBhbGV0dGUpICE9IG51bGwgPyByZWYgOiBcIlNwZWN0cmFsMTFcIl0ubWFwKG51bTJoZXhjb2xvcik7XG4gICAgfVxuICAgIHN0YWNrZWQgPSAocmVmMSA9IG9wdHMuc3RhY2tlZCkgIT0gbnVsbCA/IHJlZjEgOiBmYWxzZTtcbiAgICBvcmllbnRhdGlvbiA9IChyZWYyID0gb3B0cy5vcmllbnRhdGlvbikgIT0gbnVsbCA/IHJlZjIgOiBcImhvcml6b250YWxcIjtcbiAgICByZW5kZXJlcnMgPSBbXTtcbiAgICBpZiAoc3RhY2tlZCkge1xuICAgICAgICBsZWZ0ID0gW107XG4gICAgICAgIHJpZ2h0ID0gW107XG4gICAgICAgIGZvciAoaSA9IG4gPSAwLCByZWYzID0gY29sdW1ucy5sZW5ndGg7IDAgPD0gcmVmMyA/IG4gPCByZWYzIDogbiA+IHJlZjM7IGkgPSAwIDw9IHJlZjMgPyArK24gOiAtLW4pIHtcbiAgICAgICAgICAgIGJvdHRvbSA9IFtdO1xuICAgICAgICAgICAgdG9wID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSBvID0gMCwgbGVuMiA9IGxhYmVscy5sZW5ndGg7IG8gPCBsZW4yOyBqID0gKytvKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwgPSBsYWJlbHNbal07XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdC5wdXNoKDApO1xuICAgICAgICAgICAgICAgICAgICByaWdodC5wdXNoKGNvbHVtbnNbaV1bal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdFtqXSArPSBjb2x1bW5zW2kgLSAxXVtqXTtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHRbal0gKz0gY29sdW1uc1tpXVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYm90dG9tLnB1c2gobGFiZWwgKyBcIjowXCIpO1xuICAgICAgICAgICAgICAgIHRvcC5wdXNoKGxhYmVsICsgXCI6MVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdXJjZSA9IG5ldyBCb2tlaC5Db2x1bW5EYXRhU291cmNlKHtcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IF8uY2xvbmUobGVmdCksXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiBfLmNsb25lKHJpZ2h0KSxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogYm90dG9tLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbHM6IGxhYmVscyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBjb2x1bW5zW2ldLFxuICAgICAgICAgICAgICAgICAgICBjb2x1bW5zOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbjMsIHAsIHJlZjQsIHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWY0ID0gY29sdW1uc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocCA9IDAsIGxlbjMgPSByZWY0Lmxlbmd0aDsgcCA8IGxlbjM7IHArKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSByZWY0W3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjb2x1bW5fbmFtZXNbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICB9KSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnMSA9IG5ldyBtb2RlbHMuUXVhZCh7XG4gICAgICAgICAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJsZWZ0XCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvdHRvbToge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJib3R0b21cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdG9wOiB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiBcInRvcFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsaW5lX2NvbG9yOiBudWxsLFxuICAgICAgICAgICAgICAgIGZpbGxfY29sb3I6IHBhbGV0dGVbaSAlIHBhbGV0dGUubGVuZ3RoXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByMSA9IG5ldyBtb2RlbHMuR2x5cGhSZW5kZXJlcih7XG4gICAgICAgICAgICAgICAgZGF0YV9zb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgICAgICBnbHlwaDogZzFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVuZGVyZXJzLnB1c2gocjEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkeSA9IDEgLyBjb2x1bW5zLmxlbmd0aDtcbiAgICAgICAgZm9yIChpID0gcCA9IDAsIHJlZjQgPSBjb2x1bW5zLmxlbmd0aDsgMCA8PSByZWY0ID8gcCA8IHJlZjQgOiBwID4gcmVmNDsgaSA9IDAgPD0gcmVmNCA/ICsrcCA6IC0tcCkge1xuICAgICAgICAgICAgbGVmdCA9IFtdO1xuICAgICAgICAgICAgcmlnaHQgPSBbXTtcbiAgICAgICAgICAgIGJvdHRvbSA9IFtdO1xuICAgICAgICAgICAgdG9wID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSBxID0gMCwgbGVuMyA9IGxhYmVscy5sZW5ndGg7IHEgPCBsZW4zOyBqID0gKytxKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwgPSBsYWJlbHNbal07XG4gICAgICAgICAgICAgICAgbGVmdC5wdXNoKDApO1xuICAgICAgICAgICAgICAgIHJpZ2h0LnB1c2goY29sdW1uc1tpXVtqXSk7XG4gICAgICAgICAgICAgICAgYm90dG9tLnB1c2gobGFiZWwgKyBcIjpcIiArIChpICogZHkpKTtcbiAgICAgICAgICAgICAgICB0b3AucHVzaChsYWJlbCArIFwiOlwiICsgKChpICsgMSkgKiBkeSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlID0gbmV3IEJva2VoLkNvbHVtbkRhdGFTb3VyY2Uoe1xuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IHJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsczogbGFiZWxzLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IGNvbHVtbnNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbnM6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuNCwgcmVmNSwgcmVzdWx0cywgcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjUgPSBjb2x1bW5zW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChzID0gMCwgbGVuNCA9IHJlZjUubGVuZ3RoOyBzIDwgbGVuNDsgcysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHJlZjVbc107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNvbHVtbl9uYW1lc1tpICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgIH0pKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcxID0gbmV3IG1vZGVscy5RdWFkKHtcbiAgICAgICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiBcImxlZnRcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm90dG9tOiB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiBcImJvdHRvbVwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJyaWdodFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0b3A6IHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6IFwidG9wXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGxpbmVfY29sb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgZmlsbF9jb2xvcjogcGFsZXR0ZVtpICUgcGFsZXR0ZS5sZW5ndGhdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHIxID0gbmV3IG1vZGVscy5HbHlwaFJlbmRlcmVyKHtcbiAgICAgICAgICAgICAgICBkYXRhX3NvdXJjZTogc291cmNlLFxuICAgICAgICAgICAgICAgIGdseXBoOiBnMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZW5kZXJlcnMucHVzaChyMSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcInZlcnRpY2FsXCIpIHtcbiAgICAgICAgcmVmNSA9IFt5ZHIsIHhkcl0sIHhkciA9IHJlZjVbMF0sIHlkciA9IHJlZjVbMV07XG4gICAgICAgIHJlZjYgPSBbeWF4aXMsIHhheGlzXSwgeGF4aXMgPSByZWY2WzBdLCB5YXhpcyA9IHJlZjZbMV07XG4gICAgICAgIGZvciAocyA9IDAsIGxlbjQgPSByZW5kZXJlcnMubGVuZ3RoOyBzIDwgbGVuNDsgcysrKSB7XG4gICAgICAgICAgICByID0gcmVuZGVyZXJzW3NdO1xuICAgICAgICAgICAgZGF0YSA9IHIuZGF0YV9zb3VyY2UuZGF0YTtcbiAgICAgICAgICAgIHJlZjcgPSBbZGF0YS5ib3R0b20sIGRhdGEubGVmdF0sIGRhdGEubGVmdCA9IHJlZjdbMF0sIGRhdGEuYm90dG9tID0gcmVmN1sxXTtcbiAgICAgICAgICAgIHJlZjggPSBbZGF0YS50b3AsIGRhdGEucmlnaHRdLCBkYXRhLnJpZ2h0ID0gcmVmOFswXSwgZGF0YS50b3AgPSByZWY4WzFdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHBsb3QgPSBuZXcgbW9kZWxzLlBsb3Qoe1xuICAgICAgICB4X3JhbmdlOiB4ZHIsXG4gICAgICAgIHlfcmFuZ2U6IHlkclxuICAgIH0pO1xuICAgIGlmIChvcHRzLndpZHRoICE9IG51bGwpIHtcbiAgICAgICAgcGxvdC5wbG90X3dpZHRoID0gb3B0cy53aWR0aDtcbiAgICB9XG4gICAgaWYgKG9wdHMuaGVpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgcGxvdC5wbG90X2hlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIH1cbiAgICBwbG90LmFkZF9yZW5kZXJlcnMuYXBwbHkocGxvdCwgcmVuZGVyZXJzKTtcbiAgICBwbG90LmFkZF9sYXlvdXQoeWF4aXMsIFwibGVmdFwiKTtcbiAgICBwbG90LmFkZF9sYXlvdXQoeGF4aXMsIFwiYmVsb3dcIik7XG4gICAgdG9vbHRpcCA9IFwiPGRpdj5AbGFiZWxzPC9kaXY+PGRpdj5AY29sdW1uczombmJzcDxiPkB2YWx1ZXM8L2I+PC9kaXY+XCI7XG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhvcml6b250YWxcIikge1xuICAgICAgICBhbmNob3IgPSBcImNlbnRlcl9yaWdodFwiO1xuICAgICAgICBhdHRhY2htZW50ID0gXCJob3Jpem9udGFsXCI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhbmNob3IgPSBcInRvcF9jZW50ZXJcIjtcbiAgICAgICAgYXR0YWNobWVudCA9IFwidmVydGljYWxcIjtcbiAgICB9XG4gICAgaG92ZXIgPSBuZXcgbW9kZWxzLkhvdmVyVG9vbCh7XG4gICAgICAgIHJlbmRlcmVyczogcmVuZGVyZXJzLFxuICAgICAgICB0b29sdGlwczogdG9vbHRpcCxcbiAgICAgICAgcG9pbnRfcG9saWN5OiBcInNuYXBfdG9fZGF0YVwiLFxuICAgICAgICBhbmNob3I6IGFuY2hvcixcbiAgICAgICAgYXR0YWNobWVudDogYXR0YWNobWVudCxcbiAgICAgICAgc2hvd19hcnJvdzogb3B0cy5zaG93X2Fycm93XG4gICAgfSk7XG4gICAgcGxvdC5hZGRfdG9vbHMoaG92ZXIpO1xuICAgIHJldHVybiBwbG90O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gdHJhbnNwb3NlKGFycmF5KSB7XG4gICAgdmFyIHJvd3MgPSBhcnJheS5sZW5ndGg7XG4gICAgdmFyIGNvbHMgPSBhcnJheVswXS5sZW5ndGg7XG4gICAgdmFyIHRyYW5zcG9zZWQgPSBbXTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvbHM7IGorKykge1xuICAgICAgICB0cmFuc3Bvc2VkW2pdID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm93czsgaSsrKSB7XG4gICAgICAgICAgICB0cmFuc3Bvc2VkW2pdW2ldID0gYXJyYXlbaV1bal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRyYW5zcG9zZWQ7XG59XG5leHBvcnRzLnRyYW5zcG9zZSA9IHRyYW5zcG9zZTtcbmZ1bmN0aW9uIGxpbnNwYWNlKHN0YXJ0LCBzdG9wLCBudW0pIHtcbiAgICBpZiAobnVtID09PSB2b2lkIDApIHsgbnVtID0gMTAwOyB9XG4gICAgdmFyIHN0ZXAgPSAoc3RvcCAtIHN0YXJ0KSAvIChudW0gLSAxKTtcbiAgICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkobnVtKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgIGFycmF5W2ldID0gc3RhcnQgKyBzdGVwICogaTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZXhwb3J0cy5saW5zcGFjZSA9IGxpbnNwYWNlO1xuZnVuY3Rpb24gYXJhbmdlKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKHN0ZXAgPT09IHZvaWQgMCkgeyBzdGVwID0gMTsgfVxuICAgIHZhciBudW0gPSBNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKTtcbiAgICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkobnVtKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgIGFycmF5W2ldID0gc3RhcnQgKyBzdGVwICogaTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZXhwb3J0cy5hcmFuZ2UgPSBhcmFuZ2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIF9fZXhwb3J0KG0pIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmICghZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XG59XG5fX2V4cG9ydChyZXF1aXJlKFwiLi4vbW9kZWxzL2luZGV4XCIpKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuZXhwb3J0cy5ZbEduMyA9IFsweDMxYTM1NCwgMHhhZGRkOGUsIDB4ZjdmY2I5XTtcbmV4cG9ydHMuWWxHbjQgPSBbMHgyMzg0NDMsIDB4NzhjNjc5LCAweGMyZTY5OSwgMHhmZmZmY2NdO1xuZXhwb3J0cy5ZbEduNSA9IFsweDAwNjgzNywgMHgzMWEzNTQsIDB4NzhjNjc5LCAweGMyZTY5OSwgMHhmZmZmY2NdO1xuZXhwb3J0cy5ZbEduNiA9IFsweDAwNjgzNywgMHgzMWEzNTQsIDB4NzhjNjc5LCAweGFkZGQ4ZSwgMHhkOWYwYTMsIDB4ZmZmZmNjXTtcbmV4cG9ydHMuWWxHbjcgPSBbMHgwMDVhMzIsIDB4MjM4NDQzLCAweDQxYWI1ZCwgMHg3OGM2NzksIDB4YWRkZDhlLCAweGQ5ZjBhMywgMHhmZmZmY2NdO1xuZXhwb3J0cy5ZbEduOCA9IFsweDAwNWEzMiwgMHgyMzg0NDMsIDB4NDFhYjVkLCAweDc4YzY3OSwgMHhhZGRkOGUsIDB4ZDlmMGEzLCAweGY3ZmNiOSwgMHhmZmZmZTVdO1xuZXhwb3J0cy5ZbEduOSA9IFsweDAwNDUyOSwgMHgwMDY4MzcsIDB4MjM4NDQzLCAweDQxYWI1ZCwgMHg3OGM2NzksIDB4YWRkZDhlLCAweGQ5ZjBhMywgMHhmN2ZjYjksIDB4ZmZmZmU1XTtcbmV4cG9ydHMuWWxHbkJ1MyA9IFsweDJjN2ZiOCwgMHg3ZmNkYmIsIDB4ZWRmOGIxXTtcbmV4cG9ydHMuWWxHbkJ1NCA9IFsweDIyNWVhOCwgMHg0MWI2YzQsIDB4YTFkYWI0LCAweGZmZmZjY107XG5leHBvcnRzLllsR25CdTUgPSBbMHgyNTM0OTQsIDB4MmM3ZmI4LCAweDQxYjZjNCwgMHhhMWRhYjQsIDB4ZmZmZmNjXTtcbmV4cG9ydHMuWWxHbkJ1NiA9IFsweDI1MzQ5NCwgMHgyYzdmYjgsIDB4NDFiNmM0LCAweDdmY2RiYiwgMHhjN2U5YjQsIDB4ZmZmZmNjXTtcbmV4cG9ydHMuWWxHbkJ1NyA9IFsweDBjMmM4NCwgMHgyMjVlYTgsIDB4MWQ5MWMwLCAweDQxYjZjNCwgMHg3ZmNkYmIsIDB4YzdlOWI0LCAweGZmZmZjY107XG5leHBvcnRzLllsR25CdTggPSBbMHgwYzJjODQsIDB4MjI1ZWE4LCAweDFkOTFjMCwgMHg0MWI2YzQsIDB4N2ZjZGJiLCAweGM3ZTliNCwgMHhlZGY4YjEsIDB4ZmZmZmQ5XTtcbmV4cG9ydHMuWWxHbkJ1OSA9IFsweDA4MWQ1OCwgMHgyNTM0OTQsIDB4MjI1ZWE4LCAweDFkOTFjMCwgMHg0MWI2YzQsIDB4N2ZjZGJiLCAweGM3ZTliNCwgMHhlZGY4YjEsIDB4ZmZmZmQ5XTtcbmV4cG9ydHMuR25CdTMgPSBbMHg0M2EyY2EsIDB4YThkZGI1LCAweGUwZjNkYl07XG5leHBvcnRzLkduQnU0ID0gWzB4MmI4Y2JlLCAweDdiY2NjNCwgMHhiYWU0YmMsIDB4ZjBmOWU4XTtcbmV4cG9ydHMuR25CdTUgPSBbMHgwODY4YWMsIDB4NDNhMmNhLCAweDdiY2NjNCwgMHhiYWU0YmMsIDB4ZjBmOWU4XTtcbmV4cG9ydHMuR25CdTYgPSBbMHgwODY4YWMsIDB4NDNhMmNhLCAweDdiY2NjNCwgMHhhOGRkYjUsIDB4Y2NlYmM1LCAweGYwZjllOF07XG5leHBvcnRzLkduQnU3ID0gWzB4MDg1ODllLCAweDJiOGNiZSwgMHg0ZWIzZDMsIDB4N2JjY2M0LCAweGE4ZGRiNSwgMHhjY2ViYzUsIDB4ZjBmOWU4XTtcbmV4cG9ydHMuR25CdTggPSBbMHgwODU4OWUsIDB4MmI4Y2JlLCAweDRlYjNkMywgMHg3YmNjYzQsIDB4YThkZGI1LCAweGNjZWJjNSwgMHhlMGYzZGIsIDB4ZjdmY2YwXTtcbmV4cG9ydHMuR25CdTkgPSBbMHgwODQwODEsIDB4MDg2OGFjLCAweDJiOGNiZSwgMHg0ZWIzZDMsIDB4N2JjY2M0LCAweGE4ZGRiNSwgMHhjY2ViYzUsIDB4ZTBmM2RiLCAweGY3ZmNmMF07XG5leHBvcnRzLkJ1R24zID0gWzB4MmNhMjVmLCAweDk5ZDhjOSwgMHhlNWY1ZjldO1xuZXhwb3J0cy5CdUduNCA9IFsweDIzOGI0NSwgMHg2NmMyYTQsIDB4YjJlMmUyLCAweGVkZjhmYl07XG5leHBvcnRzLkJ1R241ID0gWzB4MDA2ZDJjLCAweDJjYTI1ZiwgMHg2NmMyYTQsIDB4YjJlMmUyLCAweGVkZjhmYl07XG5leHBvcnRzLkJ1R242ID0gWzB4MDA2ZDJjLCAweDJjYTI1ZiwgMHg2NmMyYTQsIDB4OTlkOGM5LCAweGNjZWNlNiwgMHhlZGY4ZmJdO1xuZXhwb3J0cy5CdUduNyA9IFsweDAwNTgyNCwgMHgyMzhiNDUsIDB4NDFhZTc2LCAweDY2YzJhNCwgMHg5OWQ4YzksIDB4Y2NlY2U2LCAweGVkZjhmYl07XG5leHBvcnRzLkJ1R244ID0gWzB4MDA1ODI0LCAweDIzOGI0NSwgMHg0MWFlNzYsIDB4NjZjMmE0LCAweDk5ZDhjOSwgMHhjY2VjZTYsIDB4ZTVmNWY5LCAweGY3ZmNmZF07XG5leHBvcnRzLkJ1R245ID0gWzB4MDA0NDFiLCAweDAwNmQyYywgMHgyMzhiNDUsIDB4NDFhZTc2LCAweDY2YzJhNCwgMHg5OWQ4YzksIDB4Y2NlY2U2LCAweGU1ZjVmOSwgMHhmN2ZjZmRdO1xuZXhwb3J0cy5QdUJ1R24zID0gWzB4MWM5MDk5LCAweGE2YmRkYiwgMHhlY2UyZjBdO1xuZXhwb3J0cy5QdUJ1R240ID0gWzB4MDI4MThhLCAweDY3YTljZiwgMHhiZGM5ZTEsIDB4ZjZlZmY3XTtcbmV4cG9ydHMuUHVCdUduNSA9IFsweDAxNmM1OSwgMHgxYzkwOTksIDB4NjdhOWNmLCAweGJkYzllMSwgMHhmNmVmZjddO1xuZXhwb3J0cy5QdUJ1R242ID0gWzB4MDE2YzU5LCAweDFjOTA5OSwgMHg2N2E5Y2YsIDB4YTZiZGRiLCAweGQwZDFlNiwgMHhmNmVmZjddO1xuZXhwb3J0cy5QdUJ1R243ID0gWzB4MDE2NDUwLCAweDAyODE4YSwgMHgzNjkwYzAsIDB4NjdhOWNmLCAweGE2YmRkYiwgMHhkMGQxZTYsIDB4ZjZlZmY3XTtcbmV4cG9ydHMuUHVCdUduOCA9IFsweDAxNjQ1MCwgMHgwMjgxOGEsIDB4MzY5MGMwLCAweDY3YTljZiwgMHhhNmJkZGIsIDB4ZDBkMWU2LCAweGVjZTJmMCwgMHhmZmY3ZmJdO1xuZXhwb3J0cy5QdUJ1R245ID0gWzB4MDE0NjM2LCAweDAxNmM1OSwgMHgwMjgxOGEsIDB4MzY5MGMwLCAweDY3YTljZiwgMHhhNmJkZGIsIDB4ZDBkMWU2LCAweGVjZTJmMCwgMHhmZmY3ZmJdO1xuZXhwb3J0cy5QdUJ1MyA9IFsweDJiOGNiZSwgMHhhNmJkZGIsIDB4ZWNlN2YyXTtcbmV4cG9ydHMuUHVCdTQgPSBbMHgwNTcwYjAsIDB4NzRhOWNmLCAweGJkYzllMSwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdUJ1NSA9IFsweDA0NWE4ZCwgMHgyYjhjYmUsIDB4NzRhOWNmLCAweGJkYzllMSwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdUJ1NiA9IFsweDA0NWE4ZCwgMHgyYjhjYmUsIDB4NzRhOWNmLCAweGE2YmRkYiwgMHhkMGQxZTYsIDB4ZjFlZWY2XTtcbmV4cG9ydHMuUHVCdTcgPSBbMHgwMzRlN2IsIDB4MDU3MGIwLCAweDM2OTBjMCwgMHg3NGE5Y2YsIDB4YTZiZGRiLCAweGQwZDFlNiwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdUJ1OCA9IFsweDAzNGU3YiwgMHgwNTcwYjAsIDB4MzY5MGMwLCAweDc0YTljZiwgMHhhNmJkZGIsIDB4ZDBkMWU2LCAweGVjZTdmMiwgMHhmZmY3ZmJdO1xuZXhwb3J0cy5QdUJ1OSA9IFsweDAyMzg1OCwgMHgwNDVhOGQsIDB4MDU3MGIwLCAweDM2OTBjMCwgMHg3NGE5Y2YsIDB4YTZiZGRiLCAweGQwZDFlNiwgMHhlY2U3ZjIsIDB4ZmZmN2ZiXTtcbmV4cG9ydHMuQnVQdTMgPSBbMHg4ODU2YTcsIDB4OWViY2RhLCAweGUwZWNmNF07XG5leHBvcnRzLkJ1UHU0ID0gWzB4ODg0MTlkLCAweDhjOTZjNiwgMHhiM2NkZTMsIDB4ZWRmOGZiXTtcbmV4cG9ydHMuQnVQdTUgPSBbMHg4MTBmN2MsIDB4ODg1NmE3LCAweDhjOTZjNiwgMHhiM2NkZTMsIDB4ZWRmOGZiXTtcbmV4cG9ydHMuQnVQdTYgPSBbMHg4MTBmN2MsIDB4ODg1NmE3LCAweDhjOTZjNiwgMHg5ZWJjZGEsIDB4YmZkM2U2LCAweGVkZjhmYl07XG5leHBvcnRzLkJ1UHU3ID0gWzB4NmUwMTZiLCAweDg4NDE5ZCwgMHg4YzZiYjEsIDB4OGM5NmM2LCAweDllYmNkYSwgMHhiZmQzZTYsIDB4ZWRmOGZiXTtcbmV4cG9ydHMuQnVQdTggPSBbMHg2ZTAxNmIsIDB4ODg0MTlkLCAweDhjNmJiMSwgMHg4Yzk2YzYsIDB4OWViY2RhLCAweGJmZDNlNiwgMHhlMGVjZjQsIDB4ZjdmY2ZkXTtcbmV4cG9ydHMuQnVQdTkgPSBbMHg0ZDAwNGIsIDB4ODEwZjdjLCAweDg4NDE5ZCwgMHg4YzZiYjEsIDB4OGM5NmM2LCAweDllYmNkYSwgMHhiZmQzZTYsIDB4ZTBlY2Y0LCAweGY3ZmNmZF07XG5leHBvcnRzLlJkUHUzID0gWzB4YzUxYjhhLCAweGZhOWZiNSwgMHhmZGUwZGRdO1xuZXhwb3J0cy5SZFB1NCA9IFsweGFlMDE3ZSwgMHhmNzY4YTEsIDB4ZmJiNGI5LCAweGZlZWJlMl07XG5leHBvcnRzLlJkUHU1ID0gWzB4N2EwMTc3LCAweGM1MWI4YSwgMHhmNzY4YTEsIDB4ZmJiNGI5LCAweGZlZWJlMl07XG5leHBvcnRzLlJkUHU2ID0gWzB4N2EwMTc3LCAweGM1MWI4YSwgMHhmNzY4YTEsIDB4ZmE5ZmI1LCAweGZjYzVjMCwgMHhmZWViZTJdO1xuZXhwb3J0cy5SZFB1NyA9IFsweDdhMDE3NywgMHhhZTAxN2UsIDB4ZGQzNDk3LCAweGY3NjhhMSwgMHhmYTlmYjUsIDB4ZmNjNWMwLCAweGZlZWJlMl07XG5leHBvcnRzLlJkUHU4ID0gWzB4N2EwMTc3LCAweGFlMDE3ZSwgMHhkZDM0OTcsIDB4Zjc2OGExLCAweGZhOWZiNSwgMHhmY2M1YzAsIDB4ZmRlMGRkLCAweGZmZjdmM107XG5leHBvcnRzLlJkUHU5ID0gWzB4NDkwMDZhLCAweDdhMDE3NywgMHhhZTAxN2UsIDB4ZGQzNDk3LCAweGY3NjhhMSwgMHhmYTlmYjUsIDB4ZmNjNWMwLCAweGZkZTBkZCwgMHhmZmY3ZjNdO1xuZXhwb3J0cy5QdVJkMyA9IFsweGRkMWM3NywgMHhjOTk0YzcsIDB4ZTdlMWVmXTtcbmV4cG9ydHMuUHVSZDQgPSBbMHhjZTEyNTYsIDB4ZGY2NWIwLCAweGQ3YjVkOCwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdVJkNSA9IFsweDk4MDA0MywgMHhkZDFjNzcsIDB4ZGY2NWIwLCAweGQ3YjVkOCwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdVJkNiA9IFsweDk4MDA0MywgMHhkZDFjNzcsIDB4ZGY2NWIwLCAweGM5OTRjNywgMHhkNGI5ZGEsIDB4ZjFlZWY2XTtcbmV4cG9ydHMuUHVSZDcgPSBbMHg5MTAwM2YsIDB4Y2UxMjU2LCAweGU3Mjk4YSwgMHhkZjY1YjAsIDB4Yzk5NGM3LCAweGQ0YjlkYSwgMHhmMWVlZjZdO1xuZXhwb3J0cy5QdVJkOCA9IFsweDkxMDAzZiwgMHhjZTEyNTYsIDB4ZTcyOThhLCAweGRmNjViMCwgMHhjOTk0YzcsIDB4ZDRiOWRhLCAweGU3ZTFlZiwgMHhmN2Y0ZjldO1xuZXhwb3J0cy5QdVJkOSA9IFsweDY3MDAxZiwgMHg5ODAwNDMsIDB4Y2UxMjU2LCAweGU3Mjk4YSwgMHhkZjY1YjAsIDB4Yzk5NGM3LCAweGQ0YjlkYSwgMHhlN2UxZWYsIDB4ZjdmNGY5XTtcbmV4cG9ydHMuT3JSZDMgPSBbMHhlMzRhMzMsIDB4ZmRiYjg0LCAweGZlZThjOF07XG5leHBvcnRzLk9yUmQ0ID0gWzB4ZDczMDFmLCAweGZjOGQ1OSwgMHhmZGNjOGEsIDB4ZmVmMGQ5XTtcbmV4cG9ydHMuT3JSZDUgPSBbMHhiMzAwMDAsIDB4ZTM0YTMzLCAweGZjOGQ1OSwgMHhmZGNjOGEsIDB4ZmVmMGQ5XTtcbmV4cG9ydHMuT3JSZDYgPSBbMHhiMzAwMDAsIDB4ZTM0YTMzLCAweGZjOGQ1OSwgMHhmZGJiODQsIDB4ZmRkNDllLCAweGZlZjBkOV07XG5leHBvcnRzLk9yUmQ3ID0gWzB4OTkwMDAwLCAweGQ3MzAxZiwgMHhlZjY1NDgsIDB4ZmM4ZDU5LCAweGZkYmI4NCwgMHhmZGQ0OWUsIDB4ZmVmMGQ5XTtcbmV4cG9ydHMuT3JSZDggPSBbMHg5OTAwMDAsIDB4ZDczMDFmLCAweGVmNjU0OCwgMHhmYzhkNTksIDB4ZmRiYjg0LCAweGZkZDQ5ZSwgMHhmZWU4YzgsIDB4ZmZmN2VjXTtcbmV4cG9ydHMuT3JSZDkgPSBbMHg3ZjAwMDAsIDB4YjMwMDAwLCAweGQ3MzAxZiwgMHhlZjY1NDgsIDB4ZmM4ZDU5LCAweGZkYmI4NCwgMHhmZGQ0OWUsIDB4ZmVlOGM4LCAweGZmZjdlY107XG5leHBvcnRzLllsT3JSZDMgPSBbMHhmMDNiMjAsIDB4ZmViMjRjLCAweGZmZWRhMF07XG5leHBvcnRzLllsT3JSZDQgPSBbMHhlMzFhMWMsIDB4ZmQ4ZDNjLCAweGZlY2M1YywgMHhmZmZmYjJdO1xuZXhwb3J0cy5ZbE9yUmQ1ID0gWzB4YmQwMDI2LCAweGYwM2IyMCwgMHhmZDhkM2MsIDB4ZmVjYzVjLCAweGZmZmZiMl07XG5leHBvcnRzLllsT3JSZDYgPSBbMHhiZDAwMjYsIDB4ZjAzYjIwLCAweGZkOGQzYywgMHhmZWIyNGMsIDB4ZmVkOTc2LCAweGZmZmZiMl07XG5leHBvcnRzLllsT3JSZDcgPSBbMHhiMTAwMjYsIDB4ZTMxYTFjLCAweGZjNGUyYSwgMHhmZDhkM2MsIDB4ZmViMjRjLCAweGZlZDk3NiwgMHhmZmZmYjJdO1xuZXhwb3J0cy5ZbE9yUmQ4ID0gWzB4YjEwMDI2LCAweGUzMWExYywgMHhmYzRlMmEsIDB4ZmQ4ZDNjLCAweGZlYjI0YywgMHhmZWQ5NzYsIDB4ZmZlZGEwLCAweGZmZmZjY107XG5leHBvcnRzLllsT3JSZDkgPSBbMHg4MDAwMjYsIDB4YmQwMDI2LCAweGUzMWExYywgMHhmYzRlMmEsIDB4ZmQ4ZDNjLCAweGZlYjI0YywgMHhmZWQ5NzYsIDB4ZmZlZGEwLCAweGZmZmZjY107XG5leHBvcnRzLllsT3JCcjMgPSBbMHhkOTVmMGUsIDB4ZmVjNDRmLCAweGZmZjdiY107XG5leHBvcnRzLllsT3JCcjQgPSBbMHhjYzRjMDIsIDB4ZmU5OTI5LCAweGZlZDk4ZSwgMHhmZmZmZDRdO1xuZXhwb3J0cy5ZbE9yQnI1ID0gWzB4OTkzNDA0LCAweGQ5NWYwZSwgMHhmZTk5MjksIDB4ZmVkOThlLCAweGZmZmZkNF07XG5leHBvcnRzLllsT3JCcjYgPSBbMHg5OTM0MDQsIDB4ZDk1ZjBlLCAweGZlOTkyOSwgMHhmZWM0NGYsIDB4ZmVlMzkxLCAweGZmZmZkNF07XG5leHBvcnRzLllsT3JCcjcgPSBbMHg4YzJkMDQsIDB4Y2M0YzAyLCAweGVjNzAxNCwgMHhmZTk5MjksIDB4ZmVjNDRmLCAweGZlZTM5MSwgMHhmZmZmZDRdO1xuZXhwb3J0cy5ZbE9yQnI4ID0gWzB4OGMyZDA0LCAweGNjNGMwMiwgMHhlYzcwMTQsIDB4ZmU5OTI5LCAweGZlYzQ0ZiwgMHhmZWUzOTEsIDB4ZmZmN2JjLCAweGZmZmZlNV07XG5leHBvcnRzLllsT3JCcjkgPSBbMHg2NjI1MDYsIDB4OTkzNDA0LCAweGNjNGMwMiwgMHhlYzcwMTQsIDB4ZmU5OTI5LCAweGZlYzQ0ZiwgMHhmZWUzOTEsIDB4ZmZmN2JjLCAweGZmZmZlNV07XG5leHBvcnRzLlB1cnBsZXMzID0gWzB4NzU2YmIxLCAweGJjYmRkYywgMHhlZmVkZjVdO1xuZXhwb3J0cy5QdXJwbGVzNCA9IFsweDZhNTFhMywgMHg5ZTlhYzgsIDB4Y2JjOWUyLCAweGYyZjBmN107XG5leHBvcnRzLlB1cnBsZXM1ID0gWzB4NTQyNzhmLCAweDc1NmJiMSwgMHg5ZTlhYzgsIDB4Y2JjOWUyLCAweGYyZjBmN107XG5leHBvcnRzLlB1cnBsZXM2ID0gWzB4NTQyNzhmLCAweDc1NmJiMSwgMHg5ZTlhYzgsIDB4YmNiZGRjLCAweGRhZGFlYiwgMHhmMmYwZjddO1xuZXhwb3J0cy5QdXJwbGVzNyA9IFsweDRhMTQ4NiwgMHg2YTUxYTMsIDB4ODA3ZGJhLCAweDllOWFjOCwgMHhiY2JkZGMsIDB4ZGFkYWViLCAweGYyZjBmN107XG5leHBvcnRzLlB1cnBsZXM4ID0gWzB4NGExNDg2LCAweDZhNTFhMywgMHg4MDdkYmEsIDB4OWU5YWM4LCAweGJjYmRkYywgMHhkYWRhZWIsIDB4ZWZlZGY1LCAweGZjZmJmZF07XG5leHBvcnRzLlB1cnBsZXM5ID0gWzB4M2YwMDdkLCAweDU0Mjc4ZiwgMHg2YTUxYTMsIDB4ODA3ZGJhLCAweDllOWFjOCwgMHhiY2JkZGMsIDB4ZGFkYWViLCAweGVmZWRmNSwgMHhmY2ZiZmRdO1xuZXhwb3J0cy5CbHVlczMgPSBbMHgzMTgyYmQsIDB4OWVjYWUxLCAweGRlZWJmN107XG5leHBvcnRzLkJsdWVzNCA9IFsweDIxNzFiNSwgMHg2YmFlZDYsIDB4YmRkN2U3LCAweGVmZjNmZl07XG5leHBvcnRzLkJsdWVzNSA9IFsweDA4NTE5YywgMHgzMTgyYmQsIDB4NmJhZWQ2LCAweGJkZDdlNywgMHhlZmYzZmZdO1xuZXhwb3J0cy5CbHVlczYgPSBbMHgwODUxOWMsIDB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGVmZjNmZl07XG5leHBvcnRzLkJsdWVzNyA9IFsweDA4NDU5NCwgMHgyMTcxYjUsIDB4NDI5MmM2LCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGVmZjNmZl07XG5leHBvcnRzLkJsdWVzOCA9IFsweDA4NDU5NCwgMHgyMTcxYjUsIDB4NDI5MmM2LCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGRlZWJmNywgMHhmN2ZiZmZdO1xuZXhwb3J0cy5CbHVlczkgPSBbMHgwODMwNmIsIDB4MDg1MTljLCAweDIxNzFiNSwgMHg0MjkyYzYsIDB4NmJhZWQ2LCAweDllY2FlMSwgMHhjNmRiZWYsIDB4ZGVlYmY3LCAweGY3ZmJmZl07XG5leHBvcnRzLkdyZWVuczMgPSBbMHgzMWEzNTQsIDB4YTFkOTliLCAweGU1ZjVlMF07XG5leHBvcnRzLkdyZWVuczQgPSBbMHgyMzhiNDUsIDB4NzRjNDc2LCAweGJhZTRiMywgMHhlZGY4ZTldO1xuZXhwb3J0cy5HcmVlbnM1ID0gWzB4MDA2ZDJjLCAweDMxYTM1NCwgMHg3NGM0NzYsIDB4YmFlNGIzLCAweGVkZjhlOV07XG5leHBvcnRzLkdyZWVuczYgPSBbMHgwMDZkMmMsIDB4MzFhMzU0LCAweDc0YzQ3NiwgMHhhMWQ5OWIsIDB4YzdlOWMwLCAweGVkZjhlOV07XG5leHBvcnRzLkdyZWVuczcgPSBbMHgwMDVhMzIsIDB4MjM4YjQ1LCAweDQxYWI1ZCwgMHg3NGM0NzYsIDB4YTFkOTliLCAweGM3ZTljMCwgMHhlZGY4ZTldO1xuZXhwb3J0cy5HcmVlbnM4ID0gWzB4MDA1YTMyLCAweDIzOGI0NSwgMHg0MWFiNWQsIDB4NzRjNDc2LCAweGExZDk5YiwgMHhjN2U5YzAsIDB4ZTVmNWUwLCAweGY3ZmNmNV07XG5leHBvcnRzLkdyZWVuczkgPSBbMHgwMDQ0MWIsIDB4MDA2ZDJjLCAweDIzOGI0NSwgMHg0MWFiNWQsIDB4NzRjNDc2LCAweGExZDk5YiwgMHhjN2U5YzAsIDB4ZTVmNWUwLCAweGY3ZmNmNV07XG5leHBvcnRzLk9yYW5nZXMzID0gWzB4ZTY1NTBkLCAweGZkYWU2YiwgMHhmZWU2Y2VdO1xuZXhwb3J0cy5PcmFuZ2VzNCA9IFsweGQ5NDcwMSwgMHhmZDhkM2MsIDB4ZmRiZTg1LCAweGZlZWRkZV07XG5leHBvcnRzLk9yYW5nZXM1ID0gWzB4YTYzNjAzLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRiZTg1LCAweGZlZWRkZV07XG5leHBvcnRzLk9yYW5nZXM2ID0gWzB4YTYzNjAzLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHhmZWVkZGVdO1xuZXhwb3J0cy5PcmFuZ2VzNyA9IFsweDhjMmQwNCwgMHhkOTQ4MDEsIDB4ZjE2OTEzLCAweGZkOGQzYywgMHhmZGFlNmIsIDB4ZmRkMGEyLCAweGZlZWRkZV07XG5leHBvcnRzLk9yYW5nZXM4ID0gWzB4OGMyZDA0LCAweGQ5NDgwMSwgMHhmMTY5MTMsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4ZmVlNmNlLCAweGZmZjVlYl07XG5leHBvcnRzLk9yYW5nZXM5ID0gWzB4N2YyNzA0LCAweGE2MzYwMywgMHhkOTQ4MDEsIDB4ZjE2OTEzLCAweGZkOGQzYywgMHhmZGFlNmIsIDB4ZmRkMGEyLCAweGZlZTZjZSwgMHhmZmY1ZWJdO1xuZXhwb3J0cy5SZWRzMyA9IFsweGRlMmQyNiwgMHhmYzkyNzIsIDB4ZmVlMGQyXTtcbmV4cG9ydHMuUmVkczQgPSBbMHhjYjE4MWQsIDB4ZmI2YTRhLCAweGZjYWU5MSwgMHhmZWU1ZDldO1xuZXhwb3J0cy5SZWRzNSA9IFsweGE1MGYxNSwgMHhkZTJkMjYsIDB4ZmI2YTRhLCAweGZjYWU5MSwgMHhmZWU1ZDldO1xuZXhwb3J0cy5SZWRzNiA9IFsweGE1MGYxNSwgMHhkZTJkMjYsIDB4ZmI2YTRhLCAweGZjOTI3MiwgMHhmY2JiYTEsIDB4ZmVlNWQ5XTtcbmV4cG9ydHMuUmVkczcgPSBbMHg5OTAwMGQsIDB4Y2IxODFkLCAweGVmM2IyYywgMHhmYjZhNGEsIDB4ZmM5MjcyLCAweGZjYmJhMSwgMHhmZWU1ZDldO1xuZXhwb3J0cy5SZWRzOCA9IFsweDk5MDAwZCwgMHhjYjE4MWQsIDB4ZWYzYjJjLCAweGZiNmE0YSwgMHhmYzkyNzIsIDB4ZmNiYmExLCAweGZlZTBkMiwgMHhmZmY1ZjBdO1xuZXhwb3J0cy5SZWRzOSA9IFsweDY3MDAwZCwgMHhhNTBmMTUsIDB4Y2IxODFkLCAweGVmM2IyYywgMHhmYjZhNGEsIDB4ZmM5MjcyLCAweGZjYmJhMSwgMHhmZWUwZDIsIDB4ZmZmNWYwXTtcbmV4cG9ydHMuR3JleXMzID0gWzB4NjM2MzYzLCAweGJkYmRiZCwgMHhmMGYwZjBdO1xuZXhwb3J0cy5HcmV5czQgPSBbMHg1MjUyNTIsIDB4OTY5Njk2LCAweGNjY2NjYywgMHhmN2Y3ZjddO1xuZXhwb3J0cy5HcmV5czUgPSBbMHgyNTI1MjUsIDB4NjM2MzYzLCAweDk2OTY5NiwgMHhjY2NjY2MsIDB4ZjdmN2Y3XTtcbmV4cG9ydHMuR3JleXM2ID0gWzB4MjUyNTI1LCAweDYzNjM2MywgMHg5Njk2OTYsIDB4YmRiZGJkLCAweGQ5ZDlkOSwgMHhmN2Y3ZjddO1xuZXhwb3J0cy5HcmV5czcgPSBbMHgyNTI1MjUsIDB4NTI1MjUyLCAweDczNzM3MywgMHg5Njk2OTYsIDB4YmRiZGJkLCAweGQ5ZDlkOSwgMHhmN2Y3ZjddO1xuZXhwb3J0cy5HcmV5czggPSBbMHgyNTI1MjUsIDB4NTI1MjUyLCAweDczNzM3MywgMHg5Njk2OTYsIDB4YmRiZGJkLCAweGQ5ZDlkOSwgMHhmMGYwZjAsIDB4ZmZmZmZmXTtcbmV4cG9ydHMuR3JleXM5ID0gWzB4MDAwMDAwLCAweDI1MjUyNSwgMHg1MjUyNTIsIDB4NzM3MzczLCAweDk2OTY5NiwgMHhiZGJkYmQsIDB4ZDlkOWQ5LCAweGYwZjBmMCwgMHhmZmZmZmZdO1xuZXhwb3J0cy5HcmV5czEwID0gWzB4MDAwMDAwLCAweDFjMWMxYywgMHgzODM4MzgsIDB4NTU1NTU1LCAweDcxNzE3MSwgMHg4ZDhkOGQsIDB4YWFhYWFhLCAweGM2YzZjNiwgMHhlMmUyZTIsIDB4ZmZmZmZmXTtcbmV4cG9ydHMuR3JleXMxMSA9IFsweDAwMDAwMCwgMHgxOTE5MTksIDB4MzMzMzMzLCAweDRjNGM0YywgMHg2NjY2NjYsIDB4N2Y3ZjdmLCAweDk5OTk5OSwgMHhiMmIyYjIsIDB4Y2NjY2NjLCAweGU1ZTVlNSwgMHhmZmZmZmZdO1xuZXhwb3J0cy5HcmV5czI1NiA9IFsweDAwMDAwMCwgMHgwMTAxMDEsIDB4MDIwMjAyLCAweDAzMDMwMywgMHgwNDA0MDQsIDB4MDUwNTA1LCAweDA2MDYwNiwgMHgwNzA3MDcsIDB4MDgwODA4LCAweDA5MDkwOSwgMHgwYTBhMGEsIDB4MGIwYjBiLFxuICAgIDB4MGMwYzBjLCAweDBkMGQwZCwgMHgwZTBlMGUsIDB4MGYwZjBmLCAweDEwMTAxMCwgMHgxMTExMTEsIDB4MTIxMjEyLCAweDEzMTMxMywgMHgxNDE0MTQsIDB4MTUxNTE1LCAweDE2MTYxNiwgMHgxNzE3MTcsXG4gICAgMHgxODE4MTgsIDB4MTkxOTE5LCAweDFhMWExYSwgMHgxYjFiMWIsIDB4MWMxYzFjLCAweDFkMWQxZCwgMHgxZTFlMWUsIDB4MWYxZjFmLCAweDIwMjAyMCwgMHgyMTIxMjEsIDB4MjIyMjIyLCAweDIzMjMyMyxcbiAgICAweDI0MjQyNCwgMHgyNTI1MjUsIDB4MjYyNjI2LCAweDI3MjcyNywgMHgyODI4MjgsIDB4MjkyOTI5LCAweDJhMmEyYSwgMHgyYjJiMmIsIDB4MmMyYzJjLCAweDJkMmQyZCwgMHgyZTJlMmUsIDB4MmYyZjJmLFxuICAgIDB4MzAzMDMwLCAweDMxMzEzMSwgMHgzMjMyMzIsIDB4MzMzMzMzLCAweDM0MzQzNCwgMHgzNTM1MzUsIDB4MzYzNjM2LCAweDM3MzczNywgMHgzODM4MzgsIDB4MzkzOTM5LCAweDNhM2EzYSwgMHgzYjNiM2IsXG4gICAgMHgzYzNjM2MsIDB4M2QzZDNkLCAweDNlM2UzZSwgMHgzZjNmM2YsIDB4NDA0MDQwLCAweDQxNDE0MSwgMHg0MjQyNDIsIDB4NDM0MzQzLCAweDQ0NDQ0NCwgMHg0NTQ1NDUsIDB4NDY0NjQ2LCAweDQ3NDc0NyxcbiAgICAweDQ4NDg0OCwgMHg0OTQ5NDksIDB4NGE0YTRhLCAweDRiNGI0YiwgMHg0YzRjNGMsIDB4NGQ0ZDRkLCAweDRlNGU0ZSwgMHg0ZjRmNGYsIDB4NTA1MDUwLCAweDUxNTE1MSwgMHg1MjUyNTIsIDB4NTM1MzUzLFxuICAgIDB4NTQ1NDU0LCAweDU1NTU1NSwgMHg1NjU2NTYsIDB4NTc1NzU3LCAweDU4NTg1OCwgMHg1OTU5NTksIDB4NWE1YTVhLCAweDViNWI1YiwgMHg1YzVjNWMsIDB4NWQ1ZDVkLCAweDVlNWU1ZSwgMHg1ZjVmNWYsXG4gICAgMHg2MDYwNjAsIDB4NjE2MTYxLCAweDYyNjI2MiwgMHg2MzYzNjMsIDB4NjQ2NDY0LCAweDY1NjU2NSwgMHg2NjY2NjYsIDB4Njc2NzY3LCAweDY4Njg2OCwgMHg2OTY5NjksIDB4NmE2YTZhLCAweDZiNmI2YixcbiAgICAweDZjNmM2YywgMHg2ZDZkNmQsIDB4NmU2ZTZlLCAweDZmNmY2ZiwgMHg3MDcwNzAsIDB4NzE3MTcxLCAweDcyNzI3MiwgMHg3MzczNzMsIDB4NzQ3NDc0LCAweDc1NzU3NSwgMHg3Njc2NzYsIDB4Nzc3Nzc3LFxuICAgIDB4Nzg3ODc4LCAweDc5Nzk3OSwgMHg3YTdhN2EsIDB4N2I3YjdiLCAweDdjN2M3YywgMHg3ZDdkN2QsIDB4N2U3ZTdlLCAweDdmN2Y3ZiwgMHg4MDgwODAsIDB4ODE4MTgxLCAweDgyODI4MiwgMHg4MzgzODMsXG4gICAgMHg4NDg0ODQsIDB4ODU4NTg1LCAweDg2ODY4NiwgMHg4Nzg3ODcsIDB4ODg4ODg4LCAweDg5ODk4OSwgMHg4YThhOGEsIDB4OGI4YjhiLCAweDhjOGM4YywgMHg4ZDhkOGQsIDB4OGU4ZThlLCAweDhmOGY4ZixcbiAgICAweDkwOTA5MCwgMHg5MTkxOTEsIDB4OTI5MjkyLCAweDkzOTM5MywgMHg5NDk0OTQsIDB4OTU5NTk1LCAweDk2OTY5NiwgMHg5Nzk3OTcsIDB4OTg5ODk4LCAweDk5OTk5OSwgMHg5YTlhOWEsIDB4OWI5YjliLFxuICAgIDB4OWM5YzljLCAweDlkOWQ5ZCwgMHg5ZTllOWUsIDB4OWY5ZjlmLCAweGEwYTBhMCwgMHhhMWExYTEsIDB4YTJhMmEyLCAweGEzYTNhMywgMHhhNGE0YTQsIDB4YTVhNWE1LCAweGE2YTZhNiwgMHhhN2E3YTcsXG4gICAgMHhhOGE4YTgsIDB4YTlhOWE5LCAweGFhYWFhYSwgMHhhYmFiYWIsIDB4YWNhY2FjLCAweGFkYWRhZCwgMHhhZWFlYWUsIDB4YWZhZmFmLCAweGIwYjBiMCwgMHhiMWIxYjEsIDB4YjJiMmIyLCAweGIzYjNiMyxcbiAgICAweGI0YjRiNCwgMHhiNWI1YjUsIDB4YjZiNmI2LCAweGI3YjdiNywgMHhiOGI4YjgsIDB4YjliOWI5LCAweGJhYmFiYSwgMHhiYmJiYmIsIDB4YmNiY2JjLCAweGJkYmRiZCwgMHhiZWJlYmUsIDB4YmZiZmJmLFxuICAgIDB4YzBjMGMwLCAweGMxYzFjMSwgMHhjMmMyYzIsIDB4YzNjM2MzLCAweGM0YzRjNCwgMHhjNWM1YzUsIDB4YzZjNmM2LCAweGM3YzdjNywgMHhjOGM4YzgsIDB4YzljOWM5LCAweGNhY2FjYSwgMHhjYmNiY2IsXG4gICAgMHhjY2NjY2MsIDB4Y2RjZGNkLCAweGNlY2VjZSwgMHhjZmNmY2YsIDB4ZDBkMGQwLCAweGQxZDFkMSwgMHhkMmQyZDIsIDB4ZDNkM2QzLCAweGQ0ZDRkNCwgMHhkNWQ1ZDUsIDB4ZDZkNmQ2LCAweGQ3ZDdkNyxcbiAgICAweGQ4ZDhkOCwgMHhkOWQ5ZDksIDB4ZGFkYWRhLCAweGRiZGJkYiwgMHhkY2RjZGMsIDB4ZGRkZGRkLCAweGRlZGVkZSwgMHhkZmRmZGYsIDB4ZTBlMGUwLCAweGUxZTFlMSwgMHhlMmUyZTIsIDB4ZTNlM2UzLFxuICAgIDB4ZTRlNGU0LCAweGU1ZTVlNSwgMHhlNmU2ZTYsIDB4ZTdlN2U3LCAweGU4ZThlOCwgMHhlOWU5ZTksIDB4ZWFlYWVhLCAweGViZWJlYiwgMHhlY2VjZWMsIDB4ZWRlZGVkLCAweGVlZWVlZSwgMHhlZmVmZWYsXG4gICAgMHhmMGYwZjAsIDB4ZjFmMWYxLCAweGYyZjJmMiwgMHhmM2YzZjMsIDB4ZjRmNGY0LCAweGY1ZjVmNSwgMHhmNmY2ZjYsIDB4ZjdmN2Y3LCAweGY4ZjhmOCwgMHhmOWY5ZjksIDB4ZmFmYWZhLCAweGZiZmJmYixcbiAgICAweGZjZmNmYywgMHhmZGZkZmQsIDB4ZmVmZWZlLCAweGZmZmZmZl07XG5leHBvcnRzLlB1T3IzID0gWzB4OTk4ZWMzLCAweGY3ZjdmNywgMHhmMWEzNDBdO1xuZXhwb3J0cy5QdU9yNCA9IFsweDVlM2M5OSwgMHhiMmFiZDIsIDB4ZmRiODYzLCAweGU2NjEwMV07XG5leHBvcnRzLlB1T3I1ID0gWzB4NWUzYzk5LCAweGIyYWJkMiwgMHhmN2Y3ZjcsIDB4ZmRiODYzLCAweGU2NjEwMV07XG5leHBvcnRzLlB1T3I2ID0gWzB4NTQyNzg4LCAweDk5OGVjMywgMHhkOGRhZWIsIDB4ZmVlMGI2LCAweGYxYTM0MCwgMHhiMzU4MDZdO1xuZXhwb3J0cy5QdU9yNyA9IFsweDU0Mjc4OCwgMHg5OThlYzMsIDB4ZDhkYWViLCAweGY3ZjdmNywgMHhmZWUwYjYsIDB4ZjFhMzQwLCAweGIzNTgwNl07XG5leHBvcnRzLlB1T3I4ID0gWzB4NTQyNzg4LCAweDgwNzNhYywgMHhiMmFiZDIsIDB4ZDhkYWViLCAweGZlZTBiNiwgMHhmZGI4NjMsIDB4ZTA4MjE0LCAweGIzNTgwNl07XG5leHBvcnRzLlB1T3I5ID0gWzB4NTQyNzg4LCAweDgwNzNhYywgMHhiMmFiZDIsIDB4ZDhkYWViLCAweGY3ZjdmNywgMHhmZWUwYjYsIDB4ZmRiODYzLCAweGUwODIxNCwgMHhiMzU4MDZdO1xuZXhwb3J0cy5QdU9yMTAgPSBbMHgyZDAwNGIsIDB4NTQyNzg4LCAweDgwNzNhYywgMHhiMmFiZDIsIDB4ZDhkYWViLCAweGZlZTBiNiwgMHhmZGI4NjMsIDB4ZTA4MjE0LCAweGIzNTgwNiwgMHg3ZjNiMDhdO1xuZXhwb3J0cy5QdU9yMTEgPSBbMHgyZDAwNGIsIDB4NTQyNzg4LCAweDgwNzNhYywgMHhiMmFiZDIsIDB4ZDhkYWViLCAweGY3ZjdmNywgMHhmZWUwYjYsIDB4ZmRiODYzLCAweGUwODIxNCwgMHhiMzU4MDYsIDB4N2YzYjA4XTtcbmV4cG9ydHMuQnJCRzMgPSBbMHg1YWI0YWMsIDB4ZjVmNWY1LCAweGQ4YjM2NV07XG5leHBvcnRzLkJyQkc0ID0gWzB4MDE4NTcxLCAweDgwY2RjMSwgMHhkZmMyN2QsIDB4YTY2MTFhXTtcbmV4cG9ydHMuQnJCRzUgPSBbMHgwMTg1NzEsIDB4ODBjZGMxLCAweGY1ZjVmNSwgMHhkZmMyN2QsIDB4YTY2MTFhXTtcbmV4cG9ydHMuQnJCRzYgPSBbMHgwMTY2NWUsIDB4NWFiNGFjLCAweGM3ZWFlNSwgMHhmNmU4YzMsIDB4ZDhiMzY1LCAweDhjNTEwYV07XG5leHBvcnRzLkJyQkc3ID0gWzB4MDE2NjVlLCAweDVhYjRhYywgMHhjN2VhZTUsIDB4ZjVmNWY1LCAweGY2ZThjMywgMHhkOGIzNjUsIDB4OGM1MTBhXTtcbmV4cG9ydHMuQnJCRzggPSBbMHgwMTY2NWUsIDB4MzU5NzhmLCAweDgwY2RjMSwgMHhjN2VhZTUsIDB4ZjZlOGMzLCAweGRmYzI3ZCwgMHhiZjgxMmQsIDB4OGM1MTBhXTtcbmV4cG9ydHMuQnJCRzkgPSBbMHgwMTY2NWUsIDB4MzU5NzhmLCAweDgwY2RjMSwgMHhjN2VhZTUsIDB4ZjVmNWY1LCAweGY2ZThjMywgMHhkZmMyN2QsIDB4YmY4MTJkLCAweDhjNTEwYV07XG5leHBvcnRzLkJyQkcxMCA9IFsweDAwM2MzMCwgMHgwMTY2NWUsIDB4MzU5NzhmLCAweDgwY2RjMSwgMHhjN2VhZTUsIDB4ZjZlOGMzLCAweGRmYzI3ZCwgMHhiZjgxMmQsIDB4OGM1MTBhLCAweDU0MzAwNV07XG5leHBvcnRzLkJyQkcxMSA9IFsweDAwM2MzMCwgMHgwMTY2NWUsIDB4MzU5NzhmLCAweDgwY2RjMSwgMHhjN2VhZTUsIDB4ZjVmNWY1LCAweGY2ZThjMywgMHhkZmMyN2QsIDB4YmY4MTJkLCAweDhjNTEwYSwgMHg1NDMwMDVdO1xuZXhwb3J0cy5QUkduMyA9IFsweDdmYmY3YiwgMHhmN2Y3ZjcsIDB4YWY4ZGMzXTtcbmV4cG9ydHMuUFJHbjQgPSBbMHgwMDg4MzcsIDB4YTZkYmEwLCAweGMyYTVjZiwgMHg3YjMyOTRdO1xuZXhwb3J0cy5QUkduNSA9IFsweDAwODgzNywgMHhhNmRiYTAsIDB4ZjdmN2Y3LCAweGMyYTVjZiwgMHg3YjMyOTRdO1xuZXhwb3J0cy5QUkduNiA9IFsweDFiNzgzNywgMHg3ZmJmN2IsIDB4ZDlmMGQzLCAweGU3ZDRlOCwgMHhhZjhkYzMsIDB4NzYyYTgzXTtcbmV4cG9ydHMuUFJHbjcgPSBbMHgxYjc4MzcsIDB4N2ZiZjdiLCAweGQ5ZjBkMywgMHhmN2Y3ZjcsIDB4ZTdkNGU4LCAweGFmOGRjMywgMHg3NjJhODNdO1xuZXhwb3J0cy5QUkduOCA9IFsweDFiNzgzNywgMHg1YWFlNjEsIDB4YTZkYmEwLCAweGQ5ZjBkMywgMHhlN2Q0ZTgsIDB4YzJhNWNmLCAweDk5NzBhYiwgMHg3NjJhODNdO1xuZXhwb3J0cy5QUkduOSA9IFsweDFiNzgzNywgMHg1YWFlNjEsIDB4YTZkYmEwLCAweGQ5ZjBkMywgMHhmN2Y3ZjcsIDB4ZTdkNGU4LCAweGMyYTVjZiwgMHg5OTcwYWIsIDB4NzYyYTgzXTtcbmV4cG9ydHMuUFJHbjEwID0gWzB4MDA0NDFiLCAweDFiNzgzNywgMHg1YWFlNjEsIDB4YTZkYmEwLCAweGQ5ZjBkMywgMHhlN2Q0ZTgsIDB4YzJhNWNmLCAweDk5NzBhYiwgMHg3NjJhODMsIDB4NDAwMDRiXTtcbmV4cG9ydHMuUFJHbjExID0gWzB4MDA0NDFiLCAweDFiNzgzNywgMHg1YWFlNjEsIDB4YTZkYmEwLCAweGQ5ZjBkMywgMHhmN2Y3ZjcsIDB4ZTdkNGU4LCAweGMyYTVjZiwgMHg5OTcwYWIsIDB4NzYyYTgzLCAweDQwMDA0Yl07XG5leHBvcnRzLlBpWUczID0gWzB4YTFkNzZhLCAweGY3ZjdmNywgMHhlOWEzYzldO1xuZXhwb3J0cy5QaVlHNCA9IFsweDRkYWMyNiwgMHhiOGUxODYsIDB4ZjFiNmRhLCAweGQwMWM4Yl07XG5leHBvcnRzLlBpWUc1ID0gWzB4NGRhYzI2LCAweGI4ZTE4NiwgMHhmN2Y3ZjcsIDB4ZjFiNmRhLCAweGQwMWM4Yl07XG5leHBvcnRzLlBpWUc2ID0gWzB4NGQ5MjIxLCAweGExZDc2YSwgMHhlNmY1ZDAsIDB4ZmRlMGVmLCAweGU5YTNjOSwgMHhjNTFiN2RdO1xuZXhwb3J0cy5QaVlHNyA9IFsweDRkOTIyMSwgMHhhMWQ3NmEsIDB4ZTZmNWQwLCAweGY3ZjdmNywgMHhmZGUwZWYsIDB4ZTlhM2M5LCAweGM1MWI3ZF07XG5leHBvcnRzLlBpWUc4ID0gWzB4NGQ5MjIxLCAweDdmYmM0MSwgMHhiOGUxODYsIDB4ZTZmNWQwLCAweGZkZTBlZiwgMHhmMWI2ZGEsIDB4ZGU3N2FlLCAweGM1MWI3ZF07XG5leHBvcnRzLlBpWUc5ID0gWzB4NGQ5MjIxLCAweDdmYmM0MSwgMHhiOGUxODYsIDB4ZTZmNWQwLCAweGY3ZjdmNywgMHhmZGUwZWYsIDB4ZjFiNmRhLCAweGRlNzdhZSwgMHhjNTFiN2RdO1xuZXhwb3J0cy5QaVlHMTAgPSBbMHgyNzY0MTksIDB4NGQ5MjIxLCAweDdmYmM0MSwgMHhiOGUxODYsIDB4ZTZmNWQwLCAweGZkZTBlZiwgMHhmMWI2ZGEsIDB4ZGU3N2FlLCAweGM1MWI3ZCwgMHg4ZTAxNTJdO1xuZXhwb3J0cy5QaVlHMTEgPSBbMHgyNzY0MTksIDB4NGQ5MjIxLCAweDdmYmM0MSwgMHhiOGUxODYsIDB4ZTZmNWQwLCAweGY3ZjdmNywgMHhmZGUwZWYsIDB4ZjFiNmRhLCAweGRlNzdhZSwgMHhjNTFiN2QsIDB4OGUwMTUyXTtcbmV4cG9ydHMuUmRCdTMgPSBbMHg2N2E5Y2YsIDB4ZjdmN2Y3LCAweGVmOGE2Ml07XG5leHBvcnRzLlJkQnU0ID0gWzB4MDU3MWIwLCAweDkyYzVkZSwgMHhmNGE1ODIsIDB4Y2EwMDIwXTtcbmV4cG9ydHMuUmRCdTUgPSBbMHgwNTcxYjAsIDB4OTJjNWRlLCAweGY3ZjdmNywgMHhmNGE1ODIsIDB4Y2EwMDIwXTtcbmV4cG9ydHMuUmRCdTYgPSBbMHgyMTY2YWMsIDB4NjdhOWNmLCAweGQxZTVmMCwgMHhmZGRiYzcsIDB4ZWY4YTYyLCAweGIyMTgyYl07XG5leHBvcnRzLlJkQnU3ID0gWzB4MjE2NmFjLCAweDY3YTljZiwgMHhkMWU1ZjAsIDB4ZjdmN2Y3LCAweGZkZGJjNywgMHhlZjhhNjIsIDB4YjIxODJiXTtcbmV4cG9ydHMuUmRCdTggPSBbMHgyMTY2YWMsIDB4NDM5M2MzLCAweDkyYzVkZSwgMHhkMWU1ZjAsIDB4ZmRkYmM3LCAweGY0YTU4MiwgMHhkNjYwNGQsIDB4YjIxODJiXTtcbmV4cG9ydHMuUmRCdTkgPSBbMHgyMTY2YWMsIDB4NDM5M2MzLCAweDkyYzVkZSwgMHhkMWU1ZjAsIDB4ZjdmN2Y3LCAweGZkZGJjNywgMHhmNGE1ODIsIDB4ZDY2MDRkLCAweGIyMTgyYl07XG5leHBvcnRzLlJkQnUxMCA9IFsweDA1MzA2MSwgMHgyMTY2YWMsIDB4NDM5M2MzLCAweDkyYzVkZSwgMHhkMWU1ZjAsIDB4ZmRkYmM3LCAweGY0YTU4MiwgMHhkNjYwNGQsIDB4YjIxODJiLCAweDY3MDAxZl07XG5leHBvcnRzLlJkQnUxMSA9IFsweDA1MzA2MSwgMHgyMTY2YWMsIDB4NDM5M2MzLCAweDkyYzVkZSwgMHhkMWU1ZjAsIDB4ZjdmN2Y3LCAweGZkZGJjNywgMHhmNGE1ODIsIDB4ZDY2MDRkLCAweGIyMTgyYiwgMHg2NzAwMWZdO1xuZXhwb3J0cy5SZEd5MyA9IFsweDk5OTk5OSwgMHhmZmZmZmYsIDB4ZWY4YTYyXTtcbmV4cG9ydHMuUmRHeTQgPSBbMHg0MDQwNDAsIDB4YmFiYWJhLCAweGY0YTU4MiwgMHhjYTAwMjBdO1xuZXhwb3J0cy5SZEd5NSA9IFsweDQwNDA0MCwgMHhiYWJhYmEsIDB4ZmZmZmZmLCAweGY0YTU4MiwgMHhjYTAwMjBdO1xuZXhwb3J0cy5SZEd5NiA9IFsweDRkNGQ0ZCwgMHg5OTk5OTksIDB4ZTBlMGUwLCAweGZkZGJjNywgMHhlZjhhNjIsIDB4YjIxODJiXTtcbmV4cG9ydHMuUmRHeTcgPSBbMHg0ZDRkNGQsIDB4OTk5OTk5LCAweGUwZTBlMCwgMHhmZmZmZmYsIDB4ZmRkYmM3LCAweGVmOGE2MiwgMHhiMjE4MmJdO1xuZXhwb3J0cy5SZEd5OCA9IFsweDRkNGQ0ZCwgMHg4Nzg3ODcsIDB4YmFiYWJhLCAweGUwZTBlMCwgMHhmZGRiYzcsIDB4ZjRhNTgyLCAweGQ2NjA0ZCwgMHhiMjE4MmJdO1xuZXhwb3J0cy5SZEd5OSA9IFsweDRkNGQ0ZCwgMHg4Nzg3ODcsIDB4YmFiYWJhLCAweGUwZTBlMCwgMHhmZmZmZmYsIDB4ZmRkYmM3LCAweGY0YTU4MiwgMHhkNjYwNGQsIDB4YjIxODJiXTtcbmV4cG9ydHMuUmRHeTEwID0gWzB4MWExYTFhLCAweDRkNGQ0ZCwgMHg4Nzg3ODcsIDB4YmFiYWJhLCAweGUwZTBlMCwgMHhmZGRiYzcsIDB4ZjRhNTgyLCAweGQ2NjA0ZCwgMHhiMjE4MmIsIDB4NjcwMDFmXTtcbmV4cG9ydHMuUmRHeTExID0gWzB4MWExYTFhLCAweDRkNGQ0ZCwgMHg4Nzg3ODcsIDB4YmFiYWJhLCAweGUwZTBlMCwgMHhmZmZmZmYsIDB4ZmRkYmM3LCAweGY0YTU4MiwgMHhkNjYwNGQsIDB4YjIxODJiLCAweDY3MDAxZl07XG5leHBvcnRzLlJkWWxCdTMgPSBbMHg5MWJmZGIsIDB4ZmZmZmJmLCAweGZjOGQ1OV07XG5leHBvcnRzLlJkWWxCdTQgPSBbMHgyYzdiYjYsIDB4YWJkOWU5LCAweGZkYWU2MSwgMHhkNzE5MWNdO1xuZXhwb3J0cy5SZFlsQnU1ID0gWzB4MmM3YmI2LCAweGFiZDllOSwgMHhmZmZmYmYsIDB4ZmRhZTYxLCAweGQ3MTkxY107XG5leHBvcnRzLlJkWWxCdTYgPSBbMHg0NTc1YjQsIDB4OTFiZmRiLCAweGUwZjNmOCwgMHhmZWUwOTAsIDB4ZmM4ZDU5LCAweGQ3MzAyN107XG5leHBvcnRzLlJkWWxCdTcgPSBbMHg0NTc1YjQsIDB4OTFiZmRiLCAweGUwZjNmOCwgMHhmZmZmYmYsIDB4ZmVlMDkwLCAweGZjOGQ1OSwgMHhkNzMwMjddO1xuZXhwb3J0cy5SZFlsQnU4ID0gWzB4NDU3NWI0LCAweDc0YWRkMSwgMHhhYmQ5ZTksIDB4ZTBmM2Y4LCAweGZlZTA5MCwgMHhmZGFlNjEsIDB4ZjQ2ZDQzLCAweGQ3MzAyN107XG5leHBvcnRzLlJkWWxCdTkgPSBbMHg0NTc1YjQsIDB4NzRhZGQxLCAweGFiZDllOSwgMHhlMGYzZjgsIDB4ZmZmZmJmLCAweGZlZTA5MCwgMHhmZGFlNjEsIDB4ZjQ2ZDQzLCAweGQ3MzAyN107XG5leHBvcnRzLlJkWWxCdTEwID0gWzB4MzEzNjk1LCAweDQ1NzViNCwgMHg3NGFkZDEsIDB4YWJkOWU5LCAweGUwZjNmOCwgMHhmZWUwOTAsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNzMwMjcsIDB4YTUwMDI2XTtcbmV4cG9ydHMuUmRZbEJ1MTEgPSBbMHgzMTM2OTUsIDB4NDU3NWI0LCAweDc0YWRkMSwgMHhhYmQ5ZTksIDB4ZTBmM2Y4LCAweGZmZmZiZiwgMHhmZWUwOTAsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNzMwMjcsIDB4YTUwMDI2XTtcbmV4cG9ydHMuU3BlY3RyYWwzID0gWzB4OTlkNTk0LCAweGZmZmZiZiwgMHhmYzhkNTldO1xuZXhwb3J0cy5TcGVjdHJhbDQgPSBbMHgyYjgzYmEsIDB4YWJkZGE0LCAweGZkYWU2MSwgMHhkNzE5MWNdO1xuZXhwb3J0cy5TcGVjdHJhbDUgPSBbMHgyYjgzYmEsIDB4YWJkZGE0LCAweGZmZmZiZiwgMHhmZGFlNjEsIDB4ZDcxOTFjXTtcbmV4cG9ydHMuU3BlY3RyYWw2ID0gWzB4MzI4OGJkLCAweDk5ZDU5NCwgMHhlNmY1OTgsIDB4ZmVlMDhiLCAweGZjOGQ1OSwgMHhkNTNlNGZdO1xuZXhwb3J0cy5TcGVjdHJhbDcgPSBbMHgzMjg4YmQsIDB4OTlkNTk0LCAweGU2ZjU5OCwgMHhmZmZmYmYsIDB4ZmVlMDhiLCAweGZjOGQ1OSwgMHhkNTNlNGZdO1xuZXhwb3J0cy5TcGVjdHJhbDggPSBbMHgzMjg4YmQsIDB4NjZjMmE1LCAweGFiZGRhNCwgMHhlNmY1OTgsIDB4ZmVlMDhiLCAweGZkYWU2MSwgMHhmNDZkNDMsIDB4ZDUzZTRmXTtcbmV4cG9ydHMuU3BlY3RyYWw5ID0gWzB4MzI4OGJkLCAweDY2YzJhNSwgMHhhYmRkYTQsIDB4ZTZmNTk4LCAweGZmZmZiZiwgMHhmZWUwOGIsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNTNlNGZdO1xuZXhwb3J0cy5TcGVjdHJhbDEwID0gWzB4NWU0ZmEyLCAweDMyODhiZCwgMHg2NmMyYTUsIDB4YWJkZGE0LCAweGU2ZjU5OCwgMHhmZWUwOGIsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNTNlNGYsIDB4OWUwMTQyXTtcbmV4cG9ydHMuU3BlY3RyYWwxMSA9IFsweDVlNGZhMiwgMHgzMjg4YmQsIDB4NjZjMmE1LCAweGFiZGRhNCwgMHhlNmY1OTgsIDB4ZmZmZmJmLCAweGZlZTA4YiwgMHhmZGFlNjEsIDB4ZjQ2ZDQzLCAweGQ1M2U0ZiwgMHg5ZTAxNDJdO1xuZXhwb3J0cy5SZFlsR24zID0gWzB4OTFjZjYwLCAweGZmZmZiZiwgMHhmYzhkNTldO1xuZXhwb3J0cy5SZFlsR240ID0gWzB4MWE5NjQxLCAweGE2ZDk2YSwgMHhmZGFlNjEsIDB4ZDcxOTFjXTtcbmV4cG9ydHMuUmRZbEduNSA9IFsweDFhOTY0MSwgMHhhNmQ5NmEsIDB4ZmZmZmJmLCAweGZkYWU2MSwgMHhkNzE5MWNdO1xuZXhwb3J0cy5SZFlsR242ID0gWzB4MWE5ODUwLCAweDkxY2Y2MCwgMHhkOWVmOGIsIDB4ZmVlMDhiLCAweGZjOGQ1OSwgMHhkNzMwMjddO1xuZXhwb3J0cy5SZFlsR243ID0gWzB4MWE5ODUwLCAweDkxY2Y2MCwgMHhkOWVmOGIsIDB4ZmZmZmJmLCAweGZlZTA4YiwgMHhmYzhkNTksIDB4ZDczMDI3XTtcbmV4cG9ydHMuUmRZbEduOCA9IFsweDFhOTg1MCwgMHg2NmJkNjMsIDB4YTZkOTZhLCAweGQ5ZWY4YiwgMHhmZWUwOGIsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNzMwMjddO1xuZXhwb3J0cy5SZFlsR245ID0gWzB4MWE5ODUwLCAweDY2YmQ2MywgMHhhNmQ5NmEsIDB4ZDllZjhiLCAweGZmZmZiZiwgMHhmZWUwOGIsIDB4ZmRhZTYxLCAweGY0NmQ0MywgMHhkNzMwMjddO1xuZXhwb3J0cy5SZFlsR24xMCA9IFsweDAwNjgzNywgMHgxYTk4NTAsIDB4NjZiZDYzLCAweGE2ZDk2YSwgMHhkOWVmOGIsIDB4ZmVlMDhiLCAweGZkYWU2MSwgMHhmNDZkNDMsIDB4ZDczMDI3LCAweGE1MDAyNl07XG5leHBvcnRzLlJkWWxHbjExID0gWzB4MDA2ODM3LCAweDFhOTg1MCwgMHg2NmJkNjMsIDB4YTZkOTZhLCAweGQ5ZWY4YiwgMHhmZmZmYmYsIDB4ZmVlMDhiLCAweGZkYWU2MSwgMHhmNDZkNDMsIDB4ZDczMDI3LCAweGE1MDAyNl07XG5leHBvcnRzLkluZmVybm8zID0gWzB4NDQwMTU0LCAweDIwOGY4YywgMHhmZGU3MjRdO1xuZXhwb3J0cy5JbmZlcm5vNCA9IFsweDAwMDAwMywgMHg3ODFjNmQsIDB4ZWQ2ODI1LCAweGZjZmVhNF07XG5leHBvcnRzLkluZmVybm81ID0gWzB4MDAwMDAzLCAweDU1MGY2ZCwgMHhiYTM2NTUsIDB4Zjk4YzA5LCAweGZjZmVhNF07XG5leHBvcnRzLkluZmVybm82ID0gWzB4MDAwMDAzLCAweDQxMDk2NywgMHg5MzI1NjcsIDB4ZGM1MDM5LCAweGZiYTQwYSwgMHhmY2ZlYTRdO1xuZXhwb3J0cy5JbmZlcm5vNyA9IFsweDAwMDAwMywgMHgzMjA5NWQsIDB4NzgxYzZkLCAweGJhMzY1NSwgMHhlZDY4MjUsIDB4ZmJiMzE4LCAweGZjZmVhNF07XG5leHBvcnRzLkluZmVybm84ID0gWzB4MDAwMDAzLCAweDI3MGI1MiwgMHg2MzE0NmUsIDB4OWUyOTYzLCAweGQyNDc0MiwgMHhmNTdjMTUsIDB4ZmFiZjI1LCAweGZjZmVhNF07XG5leHBvcnRzLkluZmVybm85ID0gWzB4MDAwMDAzLCAweDFmMGM0NywgMHg1NTBmNmQsIDB4ODgyMTZhLCAweGJhMzY1NSwgMHhlMzU4MzIsIDB4Zjk4YzA5LCAweGY4YzkzMSwgMHhmY2ZlYTRdO1xuZXhwb3J0cy5JbmZlcm5vMTAgPSBbMHgwMDAwMDMsIDB4MWEwYjQwLCAweDRhMGI2YSwgMHg3ODFjNmQsIDB4YTQyYzYwLCAweGNkNDI0NywgMHhlZDY4MjUsIDB4ZmI5OTA2LCAweGY3Y2YzYSwgMHhmY2ZlYTRdO1xuZXhwb3J0cy5JbmZlcm5vMTEgPSBbMHgwMDAwMDMsIDB4MTYwYjM5LCAweDQxMDk2NywgMHg2YTE3NmUsIDB4OTMyNTY3LCAweGJhMzY1NSwgMHhkYzUwMzksIDB4ZjI3NTFhLCAweGZiYTQwYSwgMHhmNmQ1NDIsIDB4ZmNmZWE0XTtcbmV4cG9ydHMuSW5mZXJubzI1NiA9IFsweDAwMDAwMywgMHgwMDAwMDQsIDB4MDAwMDA2LCAweDAxMDAwNywgMHgwMTAxMDksIDB4MDEwMTBiLCAweDAyMDEwZSwgMHgwMjAyMTAsIDB4MDMwMjEyLCAweDA0MDMxNCwgMHgwNDAzMTYsIDB4MDUwNDE4LFxuICAgIDB4MDYwNDFiLCAweDA3MDUxZCwgMHgwODA2MWYsIDB4MDkwNjIxLCAweDBhMDcyMywgMHgwYjA3MjYsIDB4MGQwODI4LCAweDBlMDgyYSwgMHgwZjA5MmQsIDB4MTAwOTJmLCAweDEyMGEzMiwgMHgxMzBhMzQsXG4gICAgMHgxNDBiMzYsIDB4MTYwYjM5LCAweDE3MGIzYiwgMHgxOTBiM2UsIDB4MWEwYjQwLCAweDFjMGM0MywgMHgxZDBjNDUsIDB4MWYwYzQ3LCAweDIwMGM0YSwgMHgyMjBiNGMsIDB4MjQwYjRlLCAweDI2MGI1MCxcbiAgICAweDI3MGI1MiwgMHgyOTBiNTQsIDB4MmIwYTU2LCAweDJkMGE1OCwgMHgyZTBhNWEsIDB4MzAwYTVjLCAweDMyMDk1ZCwgMHgzNDA5NWYsIDB4MzUwOTYwLCAweDM3MDk2MSwgMHgzOTA5NjIsIDB4M2IwOTY0LFxuICAgIDB4M2MwOTY1LCAweDNlMDk2NiwgMHg0MDA5NjYsIDB4NDEwOTY3LCAweDQzMGE2OCwgMHg0NTBhNjksIDB4NDYwYTY5LCAweDQ4MGI2YSwgMHg0YTBiNmEsIDB4NGIwYzZiLCAweDRkMGM2YiwgMHg0ZjBkNmMsXG4gICAgMHg1MDBkNmMsIDB4NTIwZTZjLCAweDUzMGU2ZCwgMHg1NTBmNmQsIDB4NTcwZjZkLCAweDU4MTA2ZCwgMHg1YTExNmQsIDB4NWIxMTZlLCAweDVkMTI2ZSwgMHg1ZjEyNmUsIDB4NjAxMzZlLCAweDYyMTQ2ZSxcbiAgICAweDYzMTQ2ZSwgMHg2NTE1NmUsIDB4NjYxNTZlLCAweDY4MTY2ZSwgMHg2YTE3NmUsIDB4NmIxNzZlLCAweDZkMTg2ZSwgMHg2ZTE4NmUsIDB4NzAxOTZlLCAweDcyMTk2ZCwgMHg3MzFhNmQsIDB4NzUxYjZkLFxuICAgIDB4NzYxYjZkLCAweDc4MWM2ZCwgMHg3YTFjNmQsIDB4N2IxZDZjLCAweDdkMWQ2YywgMHg3ZTFlNmMsIDB4ODAxZjZiLCAweDgxMWY2YiwgMHg4MzIwNmIsIDB4ODUyMDZhLCAweDg2MjE2YSwgMHg4ODIxNmEsXG4gICAgMHg4OTIyNjksIDB4OGIyMjY5LCAweDhkMjM2OSwgMHg4ZTI0NjgsIDB4OTAyNDY4LCAweDkxMjU2NywgMHg5MzI1NjcsIDB4OTUyNjY2LCAweDk2MjY2NiwgMHg5ODI3NjUsIDB4OTkyODY0LCAweDliMjg2NCxcbiAgICAweDljMjk2MywgMHg5ZTI5NjMsIDB4YTAyYTYyLCAweGExMmI2MSwgMHhhMzJiNjEsIDB4YTQyYzYwLCAweGE2MmM1ZiwgMHhhNzJkNWYsIDB4YTkyZTVlLCAweGFiMmU1ZCwgMHhhYzJmNWMsIDB4YWUzMDViLFxuICAgIDB4YWYzMTViLCAweGIxMzE1YSwgMHhiMjMyNTksIDB4YjQzMzU4LCAweGI1MzM1NywgMHhiNzM0NTYsIDB4YjgzNTU2LCAweGJhMzY1NSwgMHhiYjM3NTQsIDB4YmQzNzUzLCAweGJlMzg1MiwgMHhiZjM5NTEsXG4gICAgMHhjMTNhNTAsIDB4YzIzYjRmLCAweGM0M2M0ZSwgMHhjNTNkNGQsIDB4YzczZTRjLCAweGM4M2U0YiwgMHhjOTNmNGEsIDB4Y2I0MDQ5LCAweGNjNDE0OCwgMHhjZDQyNDcsIDB4Y2Y0NDQ2LCAweGQwNDU0NCxcbiAgICAweGQxNDY0MywgMHhkMjQ3NDIsIDB4ZDQ0ODQxLCAweGQ1NDk0MCwgMHhkNjRhM2YsIDB4ZDc0YjNlLCAweGQ5NGQzZCwgMHhkYTRlM2IsIDB4ZGI0ZjNhLCAweGRjNTAzOSwgMHhkZDUyMzgsIDB4ZGU1MzM3LFxuICAgIDB4ZGY1NDM2LCAweGUwNTYzNCwgMHhlMjU3MzMsIDB4ZTM1ODMyLCAweGU0NWEzMSwgMHhlNTViMzAsIDB4ZTY1YzJlLCAweGU2NWUyZCwgMHhlNzVmMmMsIDB4ZTg2MTJiLCAweGU5NjIyYSwgMHhlYTY0MjgsXG4gICAgMHhlYjY1MjcsIDB4ZWM2NzI2LCAweGVkNjgyNSwgMHhlZDZhMjMsIDB4ZWU2YzIyLCAweGVmNmQyMSwgMHhmMDZmMWYsIDB4ZjA3MDFlLCAweGYxNzIxZCwgMHhmMjc0MWMsIDB4ZjI3NTFhLCAweGYzNzcxOSxcbiAgICAweGYzNzkxOCwgMHhmNDdhMTYsIDB4ZjU3YzE1LCAweGY1N2UxNCwgMHhmNjgwMTIsIDB4ZjY4MTExLCAweGY3ODMxMCwgMHhmNzg1MGUsIDB4Zjg4NzBkLCAweGY4ODgwYywgMHhmODhhMGIsIDB4Zjk4YzA5LFxuICAgIDB4Zjk4ZTA4LCAweGY5OTAwOCwgMHhmYTkxMDcsIDB4ZmE5MzA2LCAweGZhOTUwNiwgMHhmYTk3MDYsIDB4ZmI5OTA2LCAweGZiOWIwNiwgMHhmYjlkMDYsIDB4ZmI5ZTA3LCAweGZiYTAwNywgMHhmYmEyMDgsXG4gICAgMHhmYmE0MGEsIDB4ZmJhNjBiLCAweGZiYTgwZCwgMHhmYmFhMGUsIDB4ZmJhYzEwLCAweGZiYWUxMiwgMHhmYmIwMTQsIDB4ZmJiMTE2LCAweGZiYjMxOCwgMHhmYmI1MWEsIDB4ZmJiNzFjLCAweGZiYjkxZSxcbiAgICAweGZhYmIyMSwgMHhmYWJkMjMsIDB4ZmFiZjI1LCAweGZhYzEyOCwgMHhmOWMzMmEsIDB4ZjljNTJjLCAweGY5YzcyZiwgMHhmOGM5MzEsIDB4ZjhjYjM0LCAweGY4Y2QzNywgMHhmN2NmM2EsIDB4ZjdkMTNjLFxuICAgIDB4ZjZkMzNmLCAweGY2ZDU0MiwgMHhmNWQ3NDUsIDB4ZjVkOTQ4LCAweGY0ZGI0YiwgMHhmNGRjNGYsIDB4ZjNkZTUyLCAweGYzZTA1NiwgMHhmM2UyNTksIDB4ZjJlNDVkLCAweGYyZTY2MCwgMHhmMWU4NjQsXG4gICAgMHhmMWU5NjgsIDB4ZjFlYjZjLCAweGYxZWQ3MCwgMHhmMWVlNzQsIDB4ZjFmMDc5LCAweGYxZjI3ZCwgMHhmMmYzODEsIDB4ZjJmNDg1LCAweGYzZjY4OSwgMHhmNGY3OGQsIDB4ZjVmODkxLCAweGY2ZmE5NSxcbiAgICAweGY3ZmI5OSwgMHhmOWZjOWQsIDB4ZmFmZGEwLCAweGZjZmVhNF07XG5leHBvcnRzLk1hZ21hMyA9IFsweDAwMDAwMywgMHhiNTM2NzksIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWE0ID0gWzB4MDAwMDAzLCAweDcxMWY4MSwgMHhmMDYwNWQsIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWE1ID0gWzB4MDAwMDAzLCAweDRmMTE3YiwgMHhiNTM2NzksIDB4ZmI4NjYwLCAweGZiZmNiZl07XG5leHBvcnRzLk1hZ21hNiA9IFsweDAwMDAwMywgMHgzYjBmNmYsIDB4OGMyOTgwLCAweGRkNDk2OCwgMHhmZDlmNmMsIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWE3ID0gWzB4MDAwMDAzLCAweDJiMTE1ZSwgMHg3MTFmODEsIDB4YjUzNjc5LCAweGYwNjA1ZCwgMHhmZWFlNzYsIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWE4ID0gWzB4MDAwMDAzLCAweDIyMTE1MCwgMHg1ZDE3N2UsIDB4OTcyYzdmLCAweGQxNDI2ZSwgMHhmODc1NWMsIDB4ZmViOTdmLCAweGZiZmNiZl07XG5leHBvcnRzLk1hZ21hOSA9IFsweDAwMDAwMywgMHgxYjEwNDQsIDB4NGYxMTdiLCAweDgxMjU4MSwgMHhiNTM2NzksIDB4ZTU1MDYzLCAweGZiODY2MCwgMHhmZWMyODYsIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWExMCA9IFsweDAwMDAwMywgMHgxNzBmM2MsIDB4NDMwZjc1LCAweDcxMWY4MSwgMHg5ZTJlN2UsIDB4Y2IzZTcxLCAweGYwNjA1ZCwgMHhmYzkzNjYsIDB4ZmVjNzhiLCAweGZiZmNiZl07XG5leHBvcnRzLk1hZ21hMTEgPSBbMHgwMDAwMDMsIDB4MTQwZDM1LCAweDNiMGY2ZiwgMHg2MzE5N2YsIDB4OGMyOTgwLCAweGI1MzY3OSwgMHhkZDQ5NjgsIDB4ZjY2ZTViLCAweGZkOWY2YywgMHhmZGNkOTAsIDB4ZmJmY2JmXTtcbmV4cG9ydHMuTWFnbWEyNTYgPSBbMHgwMDAwMDMsIDB4MDAwMDA0LCAweDAwMDAwNiwgMHgwMTAwMDcsIDB4MDEwMTA5LCAweDAxMDEwYiwgMHgwMjAyMGQsIDB4MDIwMjBmLCAweDAzMDMxMSwgMHgwNDAzMTMsIDB4MDQwNDE1LCAweDA1MDQxNyxcbiAgICAweDA2MDUxOSwgMHgwNzA1MWIsIDB4MDgwNjFkLCAweDA5MDcxZiwgMHgwYTA3MjIsIDB4MGIwODI0LCAweDBjMDkyNiwgMHgwZDBhMjgsIDB4MGUwYTJhLCAweDBmMGIyYywgMHgxMDBjMmYsIDB4MTEwYzMxLFxuICAgIDB4MTIwZDMzLCAweDE0MGQzNSwgMHgxNTBlMzgsIDB4MTYwZTNhLCAweDE3MGYzYywgMHgxODBmM2YsIDB4MWExMDQxLCAweDFiMTA0NCwgMHgxYzEwNDYsIDB4MWUxMDQ5LCAweDFmMTE0YiwgMHgyMDExNGQsXG4gICAgMHgyMjExNTAsIDB4MjMxMTUyLCAweDI1MTE1NSwgMHgyNjExNTcsIDB4MjgxMTU5LCAweDJhMTE1YywgMHgyYjExNWUsIDB4MmQxMDYwLCAweDJmMTA2MiwgMHgzMDEwNjUsIDB4MzIxMDY3LCAweDM0MTA2OCxcbiAgICAweDM1MGY2YSwgMHgzNzBmNmMsIDB4MzkwZjZlLCAweDNiMGY2ZiwgMHgzYzBmNzEsIDB4M2UwZjcyLCAweDQwMGY3MywgMHg0MjBmNzQsIDB4NDMwZjc1LCAweDQ1MGY3NiwgMHg0NzBmNzcsIDB4NDgxMDc4LFxuICAgIDB4NGExMDc5LCAweDRiMTA3OSwgMHg0ZDExN2EsIDB4NGYxMTdiLCAweDUwMTI3YiwgMHg1MjEyN2MsIDB4NTMxMzdjLCAweDU1MTM3ZCwgMHg1NzE0N2QsIDB4NTgxNTdlLCAweDVhMTU3ZSwgMHg1YjE2N2UsXG4gICAgMHg1ZDE3N2UsIDB4NWUxNzdmLCAweDYwMTg3ZiwgMHg2MTE4N2YsIDB4NjMxOTdmLCAweDY1MWE4MCwgMHg2NjFhODAsIDB4NjgxYjgwLCAweDY5MWM4MCwgMHg2YjFjODAsIDB4NmMxZDgwLCAweDZlMWU4MSxcbiAgICAweDZmMWU4MSwgMHg3MTFmODEsIDB4NzMxZjgxLCAweDc0MjA4MSwgMHg3NjIxODEsIDB4NzcyMTgxLCAweDc5MjI4MSwgMHg3YTIyODEsIDB4N2MyMzgxLCAweDdlMjQ4MSwgMHg3ZjI0ODEsIDB4ODEyNTgxLFxuICAgIDB4ODIyNTgxLCAweDg0MjY4MSwgMHg4NTI2ODEsIDB4ODcyNzgxLCAweDg5Mjg4MSwgMHg4YTI4ODEsIDB4OGMyOTgwLCAweDhkMjk4MCwgMHg4ZjJhODAsIDB4OTEyYTgwLCAweDkyMmI4MCwgMHg5NDJiODAsXG4gICAgMHg5NTJjODAsIDB4OTcyYzdmLCAweDk5MmQ3ZiwgMHg5YTJkN2YsIDB4OWMyZTdmLCAweDllMmU3ZSwgMHg5ZjJmN2UsIDB4YTEyZjdlLCAweGEzMzA3ZSwgMHhhNDMwN2QsIDB4YTYzMTdkLCAweGE3MzE3ZCxcbiAgICAweGE5MzI3YywgMHhhYjMzN2MsIDB4YWMzMzdiLCAweGFlMzQ3YiwgMHhiMDM0N2IsIDB4YjEzNTdhLCAweGIzMzU3YSwgMHhiNTM2NzksIDB4YjYzNjc5LCAweGI4Mzc3OCwgMHhiOTM3NzgsIDB4YmIzODc3LFxuICAgIDB4YmQzOTc3LCAweGJlMzk3NiwgMHhjMDNhNzUsIDB4YzIzYTc1LCAweGMzM2I3NCwgMHhjNTNjNzQsIDB4YzYzYzczLCAweGM4M2Q3MiwgMHhjYTNlNzIsIDB4Y2IzZTcxLCAweGNkM2Y3MCwgMHhjZTQwNzAsXG4gICAgMHhkMDQxNmYsIDB4ZDE0MjZlLCAweGQzNDI2ZCwgMHhkNDQzNmQsIDB4ZDY0NDZjLCAweGQ3NDU2YiwgMHhkOTQ2NmEsIDB4ZGE0NzY5LCAweGRjNDg2OSwgMHhkZDQ5NjgsIDB4ZGU0YTY3LCAweGUwNGI2NixcbiAgICAweGUxNGM2NiwgMHhlMjRkNjUsIDB4ZTQ0ZTY0LCAweGU1NTA2MywgMHhlNjUxNjIsIDB4ZTc1MjYyLCAweGU4NTQ2MSwgMHhlYTU1NjAsIDB4ZWI1NjYwLCAweGVjNTg1ZiwgMHhlZDU5NWYsIDB4ZWU1YjVlLFxuICAgIDB4ZWU1ZDVkLCAweGVmNWU1ZCwgMHhmMDYwNWQsIDB4ZjE2MTVjLCAweGYyNjM1YywgMHhmMzY1NWMsIDB4ZjM2NzViLCAweGY0Njg1YiwgMHhmNTZhNWIsIDB4ZjU2YzViLCAweGY2NmU1YiwgMHhmNjcwNWIsXG4gICAgMHhmNzcxNWIsIDB4Zjc3MzVjLCAweGY4NzU1YywgMHhmODc3NWMsIDB4Zjk3OTVjLCAweGY5N2I1ZCwgMHhmOTdkNWQsIDB4ZmE3ZjVlLCAweGZhODA1ZSwgMHhmYTgyNWYsIDB4ZmI4NDYwLCAweGZiODY2MCxcbiAgICAweGZiODg2MSwgMHhmYjhhNjIsIDB4ZmM4YzYzLCAweGZjOGU2MywgMHhmYzkwNjQsIDB4ZmM5MjY1LCAweGZjOTM2NiwgMHhmZDk1NjcsIDB4ZmQ5NzY4LCAweGZkOTk2OSwgMHhmZDliNmEsIDB4ZmQ5ZDZiLFxuICAgIDB4ZmQ5ZjZjLCAweGZkYTE2ZSwgMHhmZGEyNmYsIDB4ZmRhNDcwLCAweGZlYTY3MSwgMHhmZWE4NzMsIDB4ZmVhYTc0LCAweGZlYWM3NSwgMHhmZWFlNzYsIDB4ZmVhZjc4LCAweGZlYjE3OSwgMHhmZWIzN2IsXG4gICAgMHhmZWI1N2MsIDB4ZmViNzdkLCAweGZlYjk3ZiwgMHhmZWJiODAsIDB4ZmViYzgyLCAweGZlYmU4MywgMHhmZWMwODUsIDB4ZmVjMjg2LCAweGZlYzQ4OCwgMHhmZWM2ODksIDB4ZmVjNzhiLCAweGZlYzk4ZCxcbiAgICAweGZlY2I4ZSwgMHhmZGNkOTAsIDB4ZmRjZjkyLCAweGZkZDE5MywgMHhmZGQyOTUsIDB4ZmRkNDk3LCAweGZkZDY5OCwgMHhmZGQ4OWEsIDB4ZmRkYTljLCAweGZkZGM5ZCwgMHhmZGRkOWYsIDB4ZmRkZmExLFxuICAgIDB4ZmRlMWEzLCAweGZjZTNhNSwgMHhmY2U1YTYsIDB4ZmNlNmE4LCAweGZjZThhYSwgMHhmY2VhYWMsIDB4ZmNlY2FlLCAweGZjZWViMCwgMHhmY2YwYjEsIDB4ZmNmMWIzLCAweGZjZjNiNSwgMHhmY2Y1YjcsXG4gICAgMHhmYmY3YjksIDB4ZmJmOWJiLCAweGZiZmFiZCwgMHhmYmZjYmZdO1xuZXhwb3J0cy5QbGFzbWEzID0gWzB4MGMwNzg2LCAweGNhNDY3OCwgMHhlZmY4MjFdO1xuZXhwb3J0cy5QbGFzbWE0ID0gWzB4MGMwNzg2LCAweDliMTc5ZSwgMHhlYzc4NTMsIDB4ZWZmODIxXTtcbmV4cG9ydHMuUGxhc21hNSA9IFsweDBjMDc4NiwgMHg3YzAyYTcsIDB4Y2E0Njc4LCAweGY3OTM0MSwgMHhlZmY4MjFdO1xuZXhwb3J0cy5QbGFzbWE2ID0gWzB4MGMwNzg2LCAweDZhMDBhNywgMHhiMDJhOGYsIDB4ZTA2NDYxLCAweGZjYTYzNSwgMHhlZmY4MjFdO1xuZXhwb3J0cy5QbGFzbWE3ID0gWzB4MGMwNzg2LCAweDVjMDBhNSwgMHg5YjE3OWUsIDB4Y2E0Njc4LCAweGVjNzg1MywgMHhmZGIyMmYsIDB4ZWZmODIxXTtcbmV4cG9ydHMuUGxhc21hOCA9IFsweDBjMDc4NiwgMHg1MjAxYTMsIDB4ODkwOGE1LCAweGI4MzI4OSwgMHhkYTVhNjgsIDB4ZjM4NzQ4LCAweGZkYmIyYiwgMHhlZmY4MjFdO1xuZXhwb3J0cy5QbGFzbWE5ID0gWzB4MGMwNzg2LCAweDRhMDJhMCwgMHg3YzAyYTcsIDB4YTgyMjk2LCAweGNhNDY3OCwgMHhlNTZiNWMsIDB4Zjc5MzQxLCAweGZkYzMyOCwgMHhlZmY4MjFdO1xuZXhwb3J0cy5QbGFzbWExMCA9IFsweDBjMDc4NiwgMHg0NTAzOWUsIDB4NzIwMGE4LCAweDliMTc5ZSwgMHhiYzM2ODUsIDB4ZDc1NjZjLCAweGVjNzg1MywgMHhmYTlkM2EsIDB4ZmNjNzI2LCAweGVmZjgyMV07XG5leHBvcnRzLlBsYXNtYTExID0gWzB4MGMwNzg2LCAweDQwMDM5YywgMHg2YTAwYTcsIDB4OGYwZGEzLCAweGIwMmE4ZiwgMHhjYTQ2NzgsIDB4ZTA2NDYxLCAweGYxODI0YywgMHhmY2E2MzUsIDB4ZmNjYzI1LCAweGVmZjgyMV07XG5leHBvcnRzLlBsYXNtYTI1NiA9IFsweDBjMDc4NiwgMHgxMDA3ODcsIDB4MTMwNjg5LCAweDE1MDY4YSwgMHgxODA2OGIsIDB4MWIwNjhjLCAweDFkMDY4ZCwgMHgxZjA1OGUsIDB4MjEwNThmLCAweDIzMDU5MCwgMHgyNTA1OTEsIDB4MjcwNTkyLFxuICAgIDB4MjkwNTkzLCAweDJiMDU5NCwgMHgyZDA0OTQsIDB4MmYwNDk1LCAweDMxMDQ5NiwgMHgzMzA0OTcsIDB4MzQwNDk4LCAweDM2MDQ5OCwgMHgzODA0OTksIDB4M2EwNDlhLCAweDNiMDM5YSwgMHgzZDAzOWIsXG4gICAgMHgzZjAzOWMsIDB4NDAwMzljLCAweDQyMDM5ZCwgMHg0NDAzOWUsIDB4NDUwMzllLCAweDQ3MDI5ZiwgMHg0OTAyOWYsIDB4NGEwMmEwLCAweDRjMDJhMSwgMHg0ZTAyYTEsIDB4NGYwMmEyLCAweDUxMDFhMixcbiAgICAweDUyMDFhMywgMHg1NDAxYTMsIDB4NTYwMWEzLCAweDU3MDFhNCwgMHg1OTAxYTQsIDB4NWEwMGE1LCAweDVjMDBhNSwgMHg1ZTAwYTUsIDB4NWYwMGE2LCAweDYxMDBhNiwgMHg2MjAwYTYsIDB4NjQwMGE3LFxuICAgIDB4NjUwMGE3LCAweDY3MDBhNywgMHg2ODAwYTcsIDB4NmEwMGE3LCAweDZjMDBhOCwgMHg2ZDAwYTgsIDB4NmYwMGE4LCAweDcwMDBhOCwgMHg3MjAwYTgsIDB4NzMwMGE4LCAweDc1MDBhOCwgMHg3NjAxYTgsXG4gICAgMHg3ODAxYTgsIDB4NzkwMWE4LCAweDdiMDJhOCwgMHg3YzAyYTcsIDB4N2UwM2E3LCAweDdmMDNhNywgMHg4MTA0YTcsIDB4ODIwNGE3LCAweDg0MDVhNiwgMHg4NTA2YTYsIDB4ODYwN2E2LCAweDg4MDdhNSxcbiAgICAweDg5MDhhNSwgMHg4YjA5YTQsIDB4OGMwYWE0LCAweDhlMGNhNCwgMHg4ZjBkYTMsIDB4OTAwZWEzLCAweDkyMGZhMiwgMHg5MzEwYTEsIDB4OTUxMWExLCAweDk2MTJhMCwgMHg5NzEzYTAsIDB4OTkxNDlmLFxuICAgIDB4OWExNTllLCAweDliMTc5ZSwgMHg5ZDE4OWQsIDB4OWUxOTljLCAweDlmMWE5YiwgMHhhMDFiOWIsIDB4YTIxYzlhLCAweGEzMWQ5OSwgMHhhNDFlOTgsIDB4YTUxZjk3LCAweGE3MjE5NywgMHhhODIyOTYsXG4gICAgMHhhOTIzOTUsIDB4YWEyNDk0LCAweGFjMjU5MywgMHhhZDI2OTIsIDB4YWUyNzkxLCAweGFmMjg5MCwgMHhiMDJhOGYsIDB4YjEyYjhmLCAweGIyMmM4ZSwgMHhiNDJkOGQsIDB4YjUyZThjLCAweGI2MmY4YixcbiAgICAweGI3MzA4YSwgMHhiODMyODksIDB4YjkzMzg4LCAweGJhMzQ4NywgMHhiYjM1ODYsIDB4YmMzNjg1LCAweGJkMzc4NCwgMHhiZTM4ODMsIDB4YmYzOTgyLCAweGMwM2I4MSwgMHhjMTNjODAsIDB4YzIzZDgwLFxuICAgIDB4YzMzZTdmLCAweGM0M2Y3ZSwgMHhjNTQwN2QsIDB4YzY0MTdjLCAweGM3NDI3YiwgMHhjODQ0N2EsIDB4Yzk0NTc5LCAweGNhNDY3OCwgMHhjYjQ3NzcsIDB4Y2M0ODc2LCAweGNkNDk3NSwgMHhjZTRhNzUsXG4gICAgMHhjZjRiNzQsIDB4ZDA0ZDczLCAweGQxNGU3MiwgMHhkMTRmNzEsIDB4ZDI1MDcwLCAweGQzNTE2ZiwgMHhkNDUyNmUsIDB4ZDU1MzZkLCAweGQ2NTU2ZCwgMHhkNzU2NmMsIDB4ZDc1NzZiLCAweGQ4NTg2YSxcbiAgICAweGQ5NTk2OSwgMHhkYTVhNjgsIDB4ZGI1YjY3LCAweGRjNWQ2NiwgMHhkYzVlNjYsIDB4ZGQ1ZjY1LCAweGRlNjA2NCwgMHhkZjYxNjMsIDB4ZGY2MjYyLCAweGUwNjQ2MSwgMHhlMTY1NjAsIDB4ZTI2NjYwLFxuICAgIDB4ZTM2NzVmLCAweGUzNjg1ZSwgMHhlNDZhNWQsIDB4ZTU2YjVjLCAweGU1NmM1YiwgMHhlNjZkNWEsIDB4ZTc2ZTVhLCAweGU4NzA1OSwgMHhlODcxNTgsIDB4ZTk3MjU3LCAweGVhNzM1NiwgMHhlYTc0NTUsXG4gICAgMHhlYjc2NTQsIDB4ZWM3NzU0LCAweGVjNzg1MywgMHhlZDc5NTIsIDB4ZWQ3YjUxLCAweGVlN2M1MCwgMHhlZjdkNGYsIDB4ZWY3ZTRlLCAweGYwODA0ZCwgMHhmMDgxNGQsIDB4ZjE4MjRjLCAweGYyODQ0YixcbiAgICAweGYyODU0YSwgMHhmMzg2NDksIDB4ZjM4NzQ4LCAweGY0ODk0NywgMHhmNDhhNDcsIDB4ZjU4YjQ2LCAweGY1OGQ0NSwgMHhmNjhlNDQsIDB4ZjY4ZjQzLCAweGY2OTE0MiwgMHhmNzkyNDEsIDB4Zjc5MzQxLFxuICAgIDB4Zjg5NTQwLCAweGY4OTYzZiwgMHhmODk4M2UsIDB4Zjk5OTNkLCAweGY5OWEzYywgMHhmYTljM2IsIDB4ZmE5ZDNhLCAweGZhOWYzYSwgMHhmYWEwMzksIDB4ZmJhMjM4LCAweGZiYTMzNywgMHhmYmE0MzYsXG4gICAgMHhmY2E2MzUsIDB4ZmNhNzM1LCAweGZjYTkzNCwgMHhmY2FhMzMsIDB4ZmNhYzMyLCAweGZjYWQzMSwgMHhmZGFmMzEsIDB4ZmRiMDMwLCAweGZkYjIyZiwgMHhmZGIzMmUsIDB4ZmRiNTJkLCAweGZkYjYyZCxcbiAgICAweGZkYjgyYywgMHhmZGI5MmIsIDB4ZmRiYjJiLCAweGZkYmMyYSwgMHhmZGJlMjksIDB4ZmRjMDI5LCAweGZkYzEyOCwgMHhmZGMzMjgsIDB4ZmRjNDI3LCAweGZkYzYyNiwgMHhmY2M3MjYsIDB4ZmNjOTI2LFxuICAgIDB4ZmNjYjI1LCAweGZjY2MyNSwgMHhmY2NlMjUsIDB4ZmJkMDI0LCAweGZiZDEyNCwgMHhmYmQzMjQsIDB4ZmFkNTI0LCAweGZhZDYyNCwgMHhmYWQ4MjQsIDB4ZjlkOTI0LCAweGY5ZGIyNCwgMHhmOGRkMjQsXG4gICAgMHhmOGRmMjQsIDB4ZjdlMDI0LCAweGY3ZTIyNSwgMHhmNmU0MjUsIDB4ZjZlNTI1LCAweGY1ZTcyNiwgMHhmNWU5MjYsIDB4ZjRlYTI2LCAweGYzZWMyNiwgMHhmM2VlMjYsIDB4ZjJmMDI2LCAweGYyZjEyNixcbiAgICAweGYxZjMyNiwgMHhmMGY1MjUsIDB4ZjBmNjIzLCAweGVmZjgyMV07XG5leHBvcnRzLlZpcmlkaXMzID0gWzB4NDQwMTU0LCAweDIwOGY4YywgMHhmZGU3MjRdO1xuZXhwb3J0cy5WaXJpZGlzNCA9IFsweDQ0MDE1NCwgMHgzMDY3OGQsIDB4MzViNzc4LCAweGZkZTcyNF07XG5leHBvcnRzLlZpcmlkaXM1ID0gWzB4NDQwMTU0LCAweDNiNTE4YSwgMHgyMDhmOGMsIDB4NWJjODYyLCAweGZkZTcyNF07XG5leHBvcnRzLlZpcmlkaXM2ID0gWzB4NDQwMTU0LCAweDQwNDM4NywgMHgyOTc4OGUsIDB4MjJhNzg0LCAweDc5ZDE1MSwgMHhmZGU3MjRdO1xuZXhwb3J0cy5WaXJpZGlzNyA9IFsweDQ0MDE1NCwgMHg0NDM5ODIsIDB4MzA2NzhkLCAweDIwOGY4YywgMHgzNWI3NzgsIDB4OGRkNjQ0LCAweGZkZTcyNF07XG5leHBvcnRzLlZpcmlkaXM4ID0gWzB4NDQwMTU0LCAweDQ2MzE3ZSwgMHgzNjVhOGMsIDB4Mjc3ZThlLCAweDFlYTA4NywgMHg0OWMxNmQsIDB4OWRkOTNhLCAweGZkZTcyNF07XG5leHBvcnRzLlZpcmlkaXM5ID0gWzB4NDQwMTU0LCAweDQ3MmI3YSwgMHgzYjUxOGEsIDB4MmM3MThlLCAweDIwOGY4YywgMHgyN2FkODAsIDB4NWJjODYyLCAweGFhZGIzMiwgMHhmZGU3MjRdO1xuZXhwb3J0cy5WaXJpZGlzMTAgPSBbMHg0NDAxNTQsIDB4NDcyNzc3LCAweDNlNDk4OSwgMHgzMDY3OGQsIDB4MjU4MjhlLCAweDFlOWM4OSwgMHgzNWI3NzgsIDB4NmJjZDU5LCAweGIyZGQyYywgMHhmZGU3MjRdO1xuZXhwb3J0cy5WaXJpZGlzMTEgPSBbMHg0NDAxNTQsIDB4NDgyMzc0LCAweDQwNDM4NywgMHgzNDVlOGQsIDB4Mjk3ODhlLCAweDIwOGY4YywgMHgyMmE3ODQsIDB4NDJiZTcxLCAweDc5ZDE1MSwgMHhiYWRlMjcsIDB4ZmRlNzI0XTtcbmV4cG9ydHMuVmlyaWRpczI1NiA9IFsweDQ0MDE1NCwgMHg0NDAyNTUsIDB4NDQwMzU3LCAweDQ1MDU1OCwgMHg0NTA2NWEsIDB4NDUwODViLCAweDQ2MDk1YywgMHg0NjBiNWUsIDB4NDYwYzVmLCAweDQ2MGU2MSwgMHg0NzBmNjIsIDB4NDcxMTYzLFxuICAgIDB4NDcxMjY1LCAweDQ3MTQ2NiwgMHg0NzE1NjcsIDB4NDcxNjY5LCAweDQ3MTg2YSwgMHg0ODE5NmIsIDB4NDgxYTZjLCAweDQ4MWM2ZSwgMHg0ODFkNmYsIDB4NDgxZTcwLCAweDQ4MjA3MSwgMHg0ODIxNzIsXG4gICAgMHg0ODIyNzMsIDB4NDgyMzc0LCAweDQ3MjU3NSwgMHg0NzI2NzYsIDB4NDcyNzc3LCAweDQ3Mjg3OCwgMHg0NzJhNzksIDB4NDcyYjdhLCAweDQ3MmM3YiwgMHg0NjJkN2MsIDB4NDYyZjdjLCAweDQ2MzA3ZCxcbiAgICAweDQ2MzE3ZSwgMHg0NTMyN2YsIDB4NDUzNDdmLCAweDQ1MzU4MCwgMHg0NTM2ODEsIDB4NDQzNzgxLCAweDQ0Mzk4MiwgMHg0MzNhODMsIDB4NDMzYjgzLCAweDQzM2M4NCwgMHg0MjNkODQsIDB4NDIzZTg1LFxuICAgIDB4NDI0MDg1LCAweDQxNDE4NiwgMHg0MTQyODYsIDB4NDA0Mzg3LCAweDQwNDQ4NywgMHgzZjQ1ODcsIDB4M2Y0Nzg4LCAweDNlNDg4OCwgMHgzZTQ5ODksIDB4M2Q0YTg5LCAweDNkNGI4OSwgMHgzZDRjODksXG4gICAgMHgzYzRkOGEsIDB4M2M0ZThhLCAweDNiNTA4YSwgMHgzYjUxOGEsIDB4M2E1MjhiLCAweDNhNTM4YiwgMHgzOTU0OGIsIDB4Mzk1NThiLCAweDM4NTY4YiwgMHgzODU3OGMsIDB4Mzc1ODhjLCAweDM3NTk4YyxcbiAgICAweDM2NWE4YywgMHgzNjViOGMsIDB4MzU1YzhjLCAweDM1NWQ4YywgMHgzNDVlOGQsIDB4MzQ1ZjhkLCAweDMzNjA4ZCwgMHgzMzYxOGQsIDB4MzI2MjhkLCAweDMyNjM4ZCwgMHgzMTY0OGQsIDB4MzE2NThkLFxuICAgIDB4MzE2NjhkLCAweDMwNjc4ZCwgMHgzMDY4OGQsIDB4MmY2OThkLCAweDJmNmE4ZCwgMHgyZTZiOGUsIDB4MmU2YzhlLCAweDJlNmQ4ZSwgMHgyZDZlOGUsIDB4MmQ2ZjhlLCAweDJjNzA4ZSwgMHgyYzcxOGUsXG4gICAgMHgyYzcyOGUsIDB4MmI3MzhlLCAweDJiNzQ4ZSwgMHgyYTc1OGUsIDB4MmE3NjhlLCAweDJhNzc4ZSwgMHgyOTc4OGUsIDB4Mjk3OThlLCAweDI4N2E4ZSwgMHgyODdhOGUsIDB4Mjg3YjhlLCAweDI3N2M4ZSxcbiAgICAweDI3N2Q4ZSwgMHgyNzdlOGUsIDB4MjY3ZjhlLCAweDI2ODA4ZSwgMHgyNjgxOGUsIDB4MjU4MjhlLCAweDI1ODM4ZCwgMHgyNDg0OGQsIDB4MjQ4NThkLCAweDI0ODY4ZCwgMHgyMzg3OGQsIDB4MjM4ODhkLFxuICAgIDB4MjM4OThkLCAweDIyODk4ZCwgMHgyMjhhOGQsIDB4MjI4YjhkLCAweDIxOGM4ZCwgMHgyMThkOGMsIDB4MjE4ZThjLCAweDIwOGY4YywgMHgyMDkwOGMsIDB4MjA5MThjLCAweDFmOTI4YywgMHgxZjkzOGIsXG4gICAgMHgxZjk0OGIsIDB4MWY5NThiLCAweDFmOTY4YiwgMHgxZTk3OGEsIDB4MWU5ODhhLCAweDFlOTk4YSwgMHgxZTk5OGEsIDB4MWU5YTg5LCAweDFlOWI4OSwgMHgxZTljODksIDB4MWU5ZDg4LCAweDFlOWU4OCxcbiAgICAweDFlOWY4OCwgMHgxZWEwODcsIDB4MWZhMTg3LCAweDFmYTI4NiwgMHgxZmEzODYsIDB4MjBhNDg1LCAweDIwYTU4NSwgMHgyMWE2ODUsIDB4MjFhNzg0LCAweDIyYTc4NCwgMHgyM2E4ODMsIDB4MjNhOTgyLFxuICAgIDB4MjRhYTgyLCAweDI1YWI4MSwgMHgyNmFjODEsIDB4MjdhZDgwLCAweDI4YWU3ZiwgMHgyOWFmN2YsIDB4MmFiMDdlLCAweDJiYjE3ZCwgMHgyY2IxN2QsIDB4MmViMjdjLCAweDJmYjM3YiwgMHgzMGI0N2EsXG4gICAgMHgzMmI1N2EsIDB4MzNiNjc5LCAweDM1Yjc3OCwgMHgzNmI4NzcsIDB4MzhiOTc2LCAweDM5Yjk3NiwgMHgzYmJhNzUsIDB4M2RiYjc0LCAweDNlYmM3MywgMHg0MGJkNzIsIDB4NDJiZTcxLCAweDQ0YmU3MCxcbiAgICAweDQ1YmY2ZiwgMHg0N2MwNmUsIDB4NDljMTZkLCAweDRiYzI2YywgMHg0ZGMyNmIsIDB4NGZjMzY5LCAweDUxYzQ2OCwgMHg1M2M1NjcsIDB4NTVjNjY2LCAweDU3YzY2NSwgMHg1OWM3NjQsIDB4NWJjODYyLFxuICAgIDB4NWVjOTYxLCAweDYwYzk2MCwgMHg2MmNhNWYsIDB4NjRjYjVkLCAweDY3Y2M1YywgMHg2OWNjNWIsIDB4NmJjZDU5LCAweDZkY2U1OCwgMHg3MGNlNTYsIDB4NzJjZjU1LCAweDc0ZDA1NCwgMHg3N2QwNTIsXG4gICAgMHg3OWQxNTEsIDB4N2NkMjRmLCAweDdlZDI0ZSwgMHg4MWQzNGMsIDB4ODNkMzRiLCAweDg2ZDQ0OSwgMHg4OGQ1NDcsIDB4OGJkNTQ2LCAweDhkZDY0NCwgMHg5MGQ2NDMsIDB4OTJkNzQxLCAweDk1ZDczZixcbiAgICAweDk3ZDgzZSwgMHg5YWQ4M2MsIDB4OWRkOTNhLCAweDlmZDkzOCwgMHhhMmRhMzcsIDB4YTVkYTM1LCAweGE3ZGIzMywgMHhhYWRiMzIsIDB4YWRkYzMwLCAweGFmZGMyZSwgMHhiMmRkMmMsIDB4YjVkZDJiLFxuICAgIDB4YjdkZDI5LCAweGJhZGUyNywgMHhiZGRlMjYsIDB4YmZkZjI0LCAweGMyZGYyMiwgMHhjNWRmMjEsIDB4YzdlMDFmLCAweGNhZTAxZSwgMHhjZGUwMWQsIDB4Y2ZlMTFjLCAweGQyZTExYiwgMHhkNGUxMWEsXG4gICAgMHhkN2UyMTksIDB4ZGFlMjE4LCAweGRjZTIxOCwgMHhkZmUzMTgsIDB4ZTFlMzE4LCAweGU0ZTMxOCwgMHhlN2U0MTksIDB4ZTllNDE5LCAweGVjZTQxYSwgMHhlZWU1MWIsIDB4ZjFlNTFjLCAweGYzZTUxZSxcbiAgICAweGY2ZTYxZiwgMHhmOGU2MjEsIDB4ZmFlNjIyLCAweGZkZTcyNF07XG5leHBvcnRzLkFjY2VudDMgPSBbMHg3ZmM5N2YsIDB4YmVhZWQ0LCAweGZkYzA4Nl07XG5leHBvcnRzLkFjY2VudDQgPSBbMHg3ZmM5N2YsIDB4YmVhZWQ0LCAweGZkYzA4NiwgMHhmZmZmOTldO1xuZXhwb3J0cy5BY2NlbnQ1ID0gWzB4N2ZjOTdmLCAweGJlYWVkNCwgMHhmZGMwODYsIDB4ZmZmZjk5LCAweDM4NmNiMF07XG5leHBvcnRzLkFjY2VudDYgPSBbMHg3ZmM5N2YsIDB4YmVhZWQ0LCAweGZkYzA4NiwgMHhmZmZmOTksIDB4Mzg2Y2IwLCAweGYwMDI3Zl07XG5leHBvcnRzLkFjY2VudDcgPSBbMHg3ZmM5N2YsIDB4YmVhZWQ0LCAweGZkYzA4NiwgMHhmZmZmOTksIDB4Mzg2Y2IwLCAweGYwMDI3ZiwgMHhiZjViMTddO1xuZXhwb3J0cy5BY2NlbnQ4ID0gWzB4N2ZjOTdmLCAweGJlYWVkNCwgMHhmZGMwODYsIDB4ZmZmZjk5LCAweDM4NmNiMCwgMHhmMDAyN2YsIDB4YmY1YjE3LCAweDY2NjY2Nl07XG5leHBvcnRzLkRhcmsyXzMgPSBbMHgxYjllNzcsIDB4ZDk1ZjAyLCAweDc1NzBiM107XG5leHBvcnRzLkRhcmsyXzQgPSBbMHgxYjllNzcsIDB4ZDk1ZjAyLCAweDc1NzBiMywgMHhlNzI5OGFdO1xuZXhwb3J0cy5EYXJrMl81ID0gWzB4MWI5ZTc3LCAweGQ5NWYwMiwgMHg3NTcwYjMsIDB4ZTcyOThhLCAweDY2YTYxZV07XG5leHBvcnRzLkRhcmsyXzYgPSBbMHgxYjllNzcsIDB4ZDk1ZjAyLCAweDc1NzBiMywgMHhlNzI5OGEsIDB4NjZhNjFlLCAweGU2YWIwMl07XG5leHBvcnRzLkRhcmsyXzcgPSBbMHgxYjllNzcsIDB4ZDk1ZjAyLCAweDc1NzBiMywgMHhlNzI5OGEsIDB4NjZhNjFlLCAweGU2YWIwMiwgMHhhNjc2MWRdO1xuZXhwb3J0cy5EYXJrMl84ID0gWzB4MWI5ZTc3LCAweGQ5NWYwMiwgMHg3NTcwYjMsIDB4ZTcyOThhLCAweDY2YTYxZSwgMHhlNmFiMDIsIDB4YTY3NjFkLCAweDY2NjY2Nl07XG5leHBvcnRzLlBhaXJlZDMgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YV07XG5leHBvcnRzLlBhaXJlZDQgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmNdO1xuZXhwb3J0cy5QYWlyZWQ1ID0gWzB4YTZjZWUzLCAweDFmNzhiNCwgMHhiMmRmOGEsIDB4MzNhMDJjLCAweGZiOWE5OV07XG5leHBvcnRzLlBhaXJlZDYgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmMsIDB4ZmI5YTk5LCAweGUzMWExY107XG5leHBvcnRzLlBhaXJlZDcgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmMsIDB4ZmI5YTk5LCAweGUzMWExYywgMHhmZGJmNmZdO1xuZXhwb3J0cy5QYWlyZWQ4ID0gWzB4YTZjZWUzLCAweDFmNzhiNCwgMHhiMmRmOGEsIDB4MzNhMDJjLCAweGZiOWE5OSwgMHhlMzFhMWMsIDB4ZmRiZjZmLCAweGZmN2YwMF07XG5leHBvcnRzLlBhaXJlZDkgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmMsIDB4ZmI5YTk5LCAweGUzMWExYywgMHhmZGJmNmYsIDB4ZmY3ZjAwLCAweGNhYjJkNl07XG5leHBvcnRzLlBhaXJlZDEwID0gWzB4YTZjZWUzLCAweDFmNzhiNCwgMHhiMmRmOGEsIDB4MzNhMDJjLCAweGZiOWE5OSwgMHhlMzFhMWMsIDB4ZmRiZjZmLCAweGZmN2YwMCwgMHhjYWIyZDYsIDB4NmEzZDlhXTtcbmV4cG9ydHMuUGFpcmVkMTEgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmMsIDB4ZmI5YTk5LCAweGUzMWExYywgMHhmZGJmNmYsIDB4ZmY3ZjAwLCAweGNhYjJkNiwgMHg2YTNkOWEsIDB4ZmZmZjk5XTtcbmV4cG9ydHMuUGFpcmVkMTIgPSBbMHhhNmNlZTMsIDB4MWY3OGI0LCAweGIyZGY4YSwgMHgzM2EwMmMsIDB4ZmI5YTk5LCAweGUzMWExYywgMHhmZGJmNmYsIDB4ZmY3ZjAwLCAweGNhYjJkNiwgMHg2YTNkOWEsIDB4ZmZmZjk5LCAweGIxNTkyOF07XG5leHBvcnRzLlBhc3RlbDFfMyA9IFsweGZiYjRhZSwgMHhiM2NkZTMsIDB4Y2NlYmM1XTtcbmV4cG9ydHMuUGFzdGVsMV80ID0gWzB4ZmJiNGFlLCAweGIzY2RlMywgMHhjY2ViYzUsIDB4ZGVjYmU0XTtcbmV4cG9ydHMuUGFzdGVsMV81ID0gWzB4ZmJiNGFlLCAweGIzY2RlMywgMHhjY2ViYzUsIDB4ZGVjYmU0LCAweGZlZDlhNl07XG5leHBvcnRzLlBhc3RlbDFfNiA9IFsweGZiYjRhZSwgMHhiM2NkZTMsIDB4Y2NlYmM1LCAweGRlY2JlNCwgMHhmZWQ5YTYsIDB4ZmZmZmNjXTtcbmV4cG9ydHMuUGFzdGVsMV83ID0gWzB4ZmJiNGFlLCAweGIzY2RlMywgMHhjY2ViYzUsIDB4ZGVjYmU0LCAweGZlZDlhNiwgMHhmZmZmY2MsIDB4ZTVkOGJkXTtcbmV4cG9ydHMuUGFzdGVsMV84ID0gWzB4ZmJiNGFlLCAweGIzY2RlMywgMHhjY2ViYzUsIDB4ZGVjYmU0LCAweGZlZDlhNiwgMHhmZmZmY2MsIDB4ZTVkOGJkLCAweGZkZGFlY107XG5leHBvcnRzLlBhc3RlbDFfOSA9IFsweGZiYjRhZSwgMHhiM2NkZTMsIDB4Y2NlYmM1LCAweGRlY2JlNCwgMHhmZWQ5YTYsIDB4ZmZmZmNjLCAweGU1ZDhiZCwgMHhmZGRhZWMsIDB4ZjJmMmYyXTtcbmV4cG9ydHMuUGFzdGVsMl8zID0gWzB4YjNlMmNkLCAweGZkY2RhYywgMHhjYmQ1ZThdO1xuZXhwb3J0cy5QYXN0ZWwyXzQgPSBbMHhiM2UyY2QsIDB4ZmRjZGFjLCAweGNiZDVlOCwgMHhmNGNhZTRdO1xuZXhwb3J0cy5QYXN0ZWwyXzUgPSBbMHhiM2UyY2QsIDB4ZmRjZGFjLCAweGNiZDVlOCwgMHhmNGNhZTQsIDB4ZTZmNWM5XTtcbmV4cG9ydHMuUGFzdGVsMl82ID0gWzB4YjNlMmNkLCAweGZkY2RhYywgMHhjYmQ1ZTgsIDB4ZjRjYWU0LCAweGU2ZjVjOSwgMHhmZmYyYWVdO1xuZXhwb3J0cy5QYXN0ZWwyXzcgPSBbMHhiM2UyY2QsIDB4ZmRjZGFjLCAweGNiZDVlOCwgMHhmNGNhZTQsIDB4ZTZmNWM5LCAweGZmZjJhZSwgMHhmMWUyY2NdO1xuZXhwb3J0cy5QYXN0ZWwyXzggPSBbMHhiM2UyY2QsIDB4ZmRjZGFjLCAweGNiZDVlOCwgMHhmNGNhZTQsIDB4ZTZmNWM5LCAweGZmZjJhZSwgMHhmMWUyY2MsIDB4Y2NjY2NjXTtcbmV4cG9ydHMuU2V0MV8zID0gWzB4ZTQxYTFjLCAweDM3N2ViOCwgMHg0ZGFmNGFdO1xuZXhwb3J0cy5TZXQxXzQgPSBbMHhlNDFhMWMsIDB4Mzc3ZWI4LCAweDRkYWY0YSwgMHg5ODRlYTNdO1xuZXhwb3J0cy5TZXQxXzUgPSBbMHhlNDFhMWMsIDB4Mzc3ZWI4LCAweDRkYWY0YSwgMHg5ODRlYTMsIDB4ZmY3ZjAwXTtcbmV4cG9ydHMuU2V0MV82ID0gWzB4ZTQxYTFjLCAweDM3N2ViOCwgMHg0ZGFmNGEsIDB4OTg0ZWEzLCAweGZmN2YwMCwgMHhmZmZmMzNdO1xuZXhwb3J0cy5TZXQxXzcgPSBbMHhlNDFhMWMsIDB4Mzc3ZWI4LCAweDRkYWY0YSwgMHg5ODRlYTMsIDB4ZmY3ZjAwLCAweGZmZmYzMywgMHhhNjU2MjhdO1xuZXhwb3J0cy5TZXQxXzggPSBbMHhlNDFhMWMsIDB4Mzc3ZWI4LCAweDRkYWY0YSwgMHg5ODRlYTMsIDB4ZmY3ZjAwLCAweGZmZmYzMywgMHhhNjU2MjgsIDB4Zjc4MWJmXTtcbmV4cG9ydHMuU2V0MV85ID0gWzB4ZTQxYTFjLCAweDM3N2ViOCwgMHg0ZGFmNGEsIDB4OTg0ZWEzLCAweGZmN2YwMCwgMHhmZmZmMzMsIDB4YTY1NjI4LCAweGY3ODFiZiwgMHg5OTk5OTldO1xuZXhwb3J0cy5TZXQyXzMgPSBbMHg2NmMyYTUsIDB4ZmM4ZDYyLCAweDhkYTBjYl07XG5leHBvcnRzLlNldDJfNCA9IFsweDY2YzJhNSwgMHhmYzhkNjIsIDB4OGRhMGNiLCAweGU3OGFjM107XG5leHBvcnRzLlNldDJfNSA9IFsweDY2YzJhNSwgMHhmYzhkNjIsIDB4OGRhMGNiLCAweGU3OGFjMywgMHhhNmQ4NTRdO1xuZXhwb3J0cy5TZXQyXzYgPSBbMHg2NmMyYTUsIDB4ZmM4ZDYyLCAweDhkYTBjYiwgMHhlNzhhYzMsIDB4YTZkODU0LCAweGZmZDkyZl07XG5leHBvcnRzLlNldDJfNyA9IFsweDY2YzJhNSwgMHhmYzhkNjIsIDB4OGRhMGNiLCAweGU3OGFjMywgMHhhNmQ4NTQsIDB4ZmZkOTJmLCAweGU1YzQ5NF07XG5leHBvcnRzLlNldDJfOCA9IFsweDY2YzJhNSwgMHhmYzhkNjIsIDB4OGRhMGNiLCAweGU3OGFjMywgMHhhNmQ4NTQsIDB4ZmZkOTJmLCAweGU1YzQ5NCwgMHhiM2IzYjNdO1xuZXhwb3J0cy5TZXQzXzMgPSBbMHg4ZGQzYzcsIDB4ZmZmZmIzLCAweGJlYmFkYV07XG5leHBvcnRzLlNldDNfNCA9IFsweDhkZDNjNywgMHhmZmZmYjMsIDB4YmViYWRhLCAweGZiODA3Ml07XG5leHBvcnRzLlNldDNfNSA9IFsweDhkZDNjNywgMHhmZmZmYjMsIDB4YmViYWRhLCAweGZiODA3MiwgMHg4MGIxZDNdO1xuZXhwb3J0cy5TZXQzXzYgPSBbMHg4ZGQzYzcsIDB4ZmZmZmIzLCAweGJlYmFkYSwgMHhmYjgwNzIsIDB4ODBiMWQzLCAweGZkYjQ2Ml07XG5leHBvcnRzLlNldDNfNyA9IFsweDhkZDNjNywgMHhmZmZmYjMsIDB4YmViYWRhLCAweGZiODA3MiwgMHg4MGIxZDMsIDB4ZmRiNDYyLCAweGIzZGU2OV07XG5leHBvcnRzLlNldDNfOCA9IFsweDhkZDNjNywgMHhmZmZmYjMsIDB4YmViYWRhLCAweGZiODA3MiwgMHg4MGIxZDMsIDB4ZmRiNDYyLCAweGIzZGU2OSwgMHhmY2NkZTVdO1xuZXhwb3J0cy5TZXQzXzkgPSBbMHg4ZGQzYzcsIDB4ZmZmZmIzLCAweGJlYmFkYSwgMHhmYjgwNzIsIDB4ODBiMWQzLCAweGZkYjQ2MiwgMHhiM2RlNjksIDB4ZmNjZGU1LCAweGQ5ZDlkOV07XG5leHBvcnRzLlNldDNfMTAgPSBbMHg4ZGQzYzcsIDB4ZmZmZmIzLCAweGJlYmFkYSwgMHhmYjgwNzIsIDB4ODBiMWQzLCAweGZkYjQ2MiwgMHhiM2RlNjksIDB4ZmNjZGU1LCAweGQ5ZDlkOSwgMHhiYzgwYmRdO1xuZXhwb3J0cy5TZXQzXzExID0gWzB4OGRkM2M3LCAweGZmZmZiMywgMHhiZWJhZGEsIDB4ZmI4MDcyLCAweDgwYjFkMywgMHhmZGI0NjIsIDB4YjNkZTY5LCAweGZjY2RlNSwgMHhkOWQ5ZDksIDB4YmM4MGJkLCAweGNjZWJjNV07XG5leHBvcnRzLlNldDNfMTIgPSBbMHg4ZGQzYzcsIDB4ZmZmZmIzLCAweGJlYmFkYSwgMHhmYjgwNzIsIDB4ODBiMWQzLCAweGZkYjQ2MiwgMHhiM2RlNjksIDB4ZmNjZGU1LCAweGQ5ZDlkOSwgMHhiYzgwYmQsIDB4Y2NlYmM1LCAweGZmZWQ2Zl07XG5leHBvcnRzLkNhdGVnb3J5MTBfMyA9IFsweDFmNzdiNCwgMHhmZjdmMGUsIDB4MmNhMDJjXTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMF80ID0gWzB4MWY3N2I0LCAweGZmN2YwZSwgMHgyY2EwMmMsIDB4ZDYyNzI4XTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMF81ID0gWzB4MWY3N2I0LCAweGZmN2YwZSwgMHgyY2EwMmMsIDB4ZDYyNzI4LCAweDk0NjdiZF07XG5leHBvcnRzLkNhdGVnb3J5MTBfNiA9IFsweDFmNzdiNCwgMHhmZjdmMGUsIDB4MmNhMDJjLCAweGQ2MjcyOCwgMHg5NDY3YmQsIDB4OGM1NjRiXTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMF83ID0gWzB4MWY3N2I0LCAweGZmN2YwZSwgMHgyY2EwMmMsIDB4ZDYyNzI4LCAweDk0NjdiZCwgMHg4YzU2NGIsIDB4ZTM3N2MyXTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMF84ID0gWzB4MWY3N2I0LCAweGZmN2YwZSwgMHgyY2EwMmMsIDB4ZDYyNzI4LCAweDk0NjdiZCwgMHg4YzU2NGIsIDB4ZTM3N2MyLCAweDdmN2Y3Zl07XG5leHBvcnRzLkNhdGVnb3J5MTBfOSA9IFsweDFmNzdiNCwgMHhmZjdmMGUsIDB4MmNhMDJjLCAweGQ2MjcyOCwgMHg5NDY3YmQsIDB4OGM1NjRiLCAweGUzNzdjMiwgMHg3ZjdmN2YsIDB4YmNiZDIyXTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMF8xMCA9IFsweDFmNzdiNCwgMHhmZjdmMGUsIDB4MmNhMDJjLCAweGQ2MjcyOCwgMHg5NDY3YmQsIDB4OGM1NjRiLCAweGUzNzdjMiwgMHg3ZjdmN2YsIDB4YmNiZDIyLCAweDE3YmVjZl07XG5leHBvcnRzLkNhdGVnb3J5MjBfMyA9IFsweDFmNzdiNCwgMHhhZWM3ZTgsIDB4ZmY3ZjBlXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMF80ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMF81ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyY107XG5leHBvcnRzLkNhdGVnb3J5MjBfNiA9IFsweDFmNzdiNCwgMHhhZWM3ZTgsIDB4ZmY3ZjBlLCAweGZmYmI3OCwgMHgyY2EwMmMsIDB4OThkZjhhXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMF83ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyYywgMHg5OGRmOGEsIDB4ZDYyNzI4XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMF84ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyYywgMHg5OGRmOGEsIDB4ZDYyNzI4LCAweGZmOTg5Nl07XG5leHBvcnRzLkNhdGVnb3J5MjBfOSA9IFsweDFmNzdiNCwgMHhhZWM3ZTgsIDB4ZmY3ZjBlLCAweGZmYmI3OCwgMHgyY2EwMmMsIDB4OThkZjhhLCAweGQ2MjcyOCwgMHhmZjk4OTYsIDB4OTQ2N2JkXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMF8xMCA9IFsweDFmNzdiNCwgMHhhZWM3ZTgsIDB4ZmY3ZjBlLCAweGZmYmI3OCwgMHgyY2EwMmMsIDB4OThkZjhhLCAweGQ2MjcyOCwgMHhmZjk4OTYsIDB4OTQ2N2JkLCAweGM1YjBkNV07XG5leHBvcnRzLkNhdGVnb3J5MjBfMTEgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGJdO1xuZXhwb3J0cy5DYXRlZ29yeTIwXzEyID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyYywgMHg5OGRmOGEsIDB4ZDYyNzI4LCAweGZmOTg5NiwgMHg5NDY3YmQsIDB4YzViMGQ1LFxuICAgIDB4OGM1NjRiLCAweGM0OWM5NF07XG5leHBvcnRzLkNhdGVnb3J5MjBfMTMgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMl07XG5leHBvcnRzLkNhdGVnb3J5MjBfMTQgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMiwgMHhmN2I2ZDJdO1xuZXhwb3J0cy5DYXRlZ29yeTIwXzE1ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyYywgMHg5OGRmOGEsIDB4ZDYyNzI4LCAweGZmOTg5NiwgMHg5NDY3YmQsIDB4YzViMGQ1LFxuICAgIDB4OGM1NjRiLCAweGM0OWM5NCwgMHhlMzc3YzIsIDB4ZjdiNmQyLCAweDdmN2Y3Zl07XG5leHBvcnRzLkNhdGVnb3J5MjBfMTYgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMiwgMHhmN2I2ZDIsIDB4N2Y3ZjdmLCAweGM3YzdjN107XG5leHBvcnRzLkNhdGVnb3J5MjBfMTcgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMiwgMHhmN2I2ZDIsIDB4N2Y3ZjdmLCAweGM3YzdjNywgMHhiY2JkMjJdO1xuZXhwb3J0cy5DYXRlZ29yeTIwXzE4ID0gWzB4MWY3N2I0LCAweGFlYzdlOCwgMHhmZjdmMGUsIDB4ZmZiYjc4LCAweDJjYTAyYywgMHg5OGRmOGEsIDB4ZDYyNzI4LCAweGZmOTg5NiwgMHg5NDY3YmQsIDB4YzViMGQ1LFxuICAgIDB4OGM1NjRiLCAweGM0OWM5NCwgMHhlMzc3YzIsIDB4ZjdiNmQyLCAweDdmN2Y3ZiwgMHhjN2M3YzcsIDB4YmNiZDIyLCAweGRiZGI4ZF07XG5leHBvcnRzLkNhdGVnb3J5MjBfMTkgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMiwgMHhmN2I2ZDIsIDB4N2Y3ZjdmLCAweGM3YzdjNywgMHhiY2JkMjIsIDB4ZGJkYjhkLCAweDE3YmVjZl07XG5leHBvcnRzLkNhdGVnb3J5MjBfMjAgPSBbMHgxZjc3YjQsIDB4YWVjN2U4LCAweGZmN2YwZSwgMHhmZmJiNzgsIDB4MmNhMDJjLCAweDk4ZGY4YSwgMHhkNjI3MjgsIDB4ZmY5ODk2LCAweDk0NjdiZCwgMHhjNWIwZDUsXG4gICAgMHg4YzU2NGIsIDB4YzQ5Yzk0LCAweGUzNzdjMiwgMHhmN2I2ZDIsIDB4N2Y3ZjdmLCAweGM3YzdjNywgMHhiY2JkMjIsIDB4ZGJkYjhkLCAweDE3YmVjZiwgMHg5ZWRhZTVdO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl8zID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2ZdO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl80ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfNSA9IFsweDM5M2I3OSwgMHg1MjU0YTMsIDB4NmI2ZWNmLCAweDljOWVkZSwgMHg2Mzc5MzldO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl82ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTJdO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl83ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfOCA9IFsweDM5M2I3OSwgMHg1MjU0YTMsIDB4NmI2ZWNmLCAweDljOWVkZSwgMHg2Mzc5MzksIDB4OGNhMjUyLCAweGI1Y2Y2YiwgMHhjZWRiOWNdO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl85ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiLCAweGNlZGI5YywgMHg4YzZkMzFdO1xuZXhwb3J0cy5DYXRlZ29yeTIwYl8xMCA9IFsweDM5M2I3OSwgMHg1MjU0YTMsIDB4NmI2ZWNmLCAweDljOWVkZSwgMHg2Mzc5MzksIDB4OGNhMjUyLCAweGI1Y2Y2YiwgMHhjZWRiOWMsIDB4OGM2ZDMxLCAweGJkOWUzOV07XG5leHBvcnRzLkNhdGVnb3J5MjBiXzExID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiLCAweGNlZGI5YywgMHg4YzZkMzEsIDB4YmQ5ZTM5LFxuICAgIDB4ZTdiYTUyXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTIgPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTMgPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0LCAweDg0M2MzOV07XG5leHBvcnRzLkNhdGVnb3J5MjBiXzE0ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiLCAweGNlZGI5YywgMHg4YzZkMzEsIDB4YmQ5ZTM5LFxuICAgIDB4ZTdiYTUyLCAweGU3Y2I5NCwgMHg4NDNjMzksIDB4YWQ0OTRhXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTUgPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0LCAweDg0M2MzOSwgMHhhZDQ5NGEsIDB4ZDY2MTZiXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTYgPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0LCAweDg0M2MzOSwgMHhhZDQ5NGEsIDB4ZDY2MTZiLCAweGU3OTY5Y107XG5leHBvcnRzLkNhdGVnb3J5MjBiXzE3ID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiLCAweGNlZGI5YywgMHg4YzZkMzEsIDB4YmQ5ZTM5LFxuICAgIDB4ZTdiYTUyLCAweGU3Y2I5NCwgMHg4NDNjMzksIDB4YWQ0OTRhLCAweGQ2NjE2YiwgMHhlNzk2OWMsIDB4N2I0MTczXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTggPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0LCAweDg0M2MzOSwgMHhhZDQ5NGEsIDB4ZDY2MTZiLCAweGU3OTY5YywgMHg3YjQxNzMsIDB4YTU1MTk0XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTkgPSBbMHgzOTNiNzksIDB4NTI1NGEzLCAweDZiNmVjZiwgMHg5YzllZGUsIDB4NjM3OTM5LCAweDhjYTI1MiwgMHhiNWNmNmIsIDB4Y2VkYjljLCAweDhjNmQzMSwgMHhiZDllMzksXG4gICAgMHhlN2JhNTIsIDB4ZTdjYjk0LCAweDg0M2MzOSwgMHhhZDQ5NGEsIDB4ZDY2MTZiLCAweGU3OTY5YywgMHg3YjQxNzMsIDB4YTU1MTk0LCAweGNlNmRiZF07XG5leHBvcnRzLkNhdGVnb3J5MjBiXzIwID0gWzB4MzkzYjc5LCAweDUyNTRhMywgMHg2YjZlY2YsIDB4OWM5ZWRlLCAweDYzNzkzOSwgMHg4Y2EyNTIsIDB4YjVjZjZiLCAweGNlZGI5YywgMHg4YzZkMzEsIDB4YmQ5ZTM5LFxuICAgIDB4ZTdiYTUyLCAweGU3Y2I5NCwgMHg4NDNjMzksIDB4YWQ0OTRhLCAweGQ2NjE2YiwgMHhlNzk2OWMsIDB4N2I0MTczLCAweGE1NTE5NCwgMHhjZTZkYmQsIDB4ZGU5ZWQ2XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfMyA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfNCA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZl07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzUgPSBbMHgzMTgyYmQsIDB4NmJhZWQ2LCAweDllY2FlMSwgMHhjNmRiZWYsIDB4ZTY1NTBkXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfNiA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfNyA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2Yl07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzggPSBbMHgzMTgyYmQsIDB4NmJhZWQ2LCAweDllY2FlMSwgMHhjNmRiZWYsIDB4ZTY1NTBkLCAweGZkOGQzYywgMHhmZGFlNmIsIDB4ZmRkMGEyXTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfOSA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4MzFhMzU0XTtcbmV4cG9ydHMuQ2F0ZWdvcnkyMGNfMTAgPSBbMHgzMTgyYmQsIDB4NmJhZWQ2LCAweDllY2FlMSwgMHhjNmRiZWYsIDB4ZTY1NTBkLCAweGZkOGQzYywgMHhmZGFlNmIsIDB4ZmRkMGEyLCAweDMxYTM1NCwgMHg3NGM0NzZdO1xuZXhwb3J0cy5DYXRlZ29yeTIwY18xMSA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4MzFhMzU0LCAweDc0YzQ3NixcbiAgICAweGExZDk5Yl07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzEyID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMF07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzEzID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMCwgMHg3NTZiYjFdO1xuZXhwb3J0cy5DYXRlZ29yeTIwY18xNCA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4MzFhMzU0LCAweDc0YzQ3NixcbiAgICAweGExZDk5YiwgMHhjN2U5YzAsIDB4NzU2YmIxLCAweDllOWFjOF07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzE1ID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMCwgMHg3NTZiYjEsIDB4OWU5YWM4LCAweGJjYmRkY107XG5leHBvcnRzLkNhdGVnb3J5MjBjXzE2ID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMCwgMHg3NTZiYjEsIDB4OWU5YWM4LCAweGJjYmRkYywgMHhkYWRhZWJdO1xuZXhwb3J0cy5DYXRlZ29yeTIwY18xNyA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4MzFhMzU0LCAweDc0YzQ3NixcbiAgICAweGExZDk5YiwgMHhjN2U5YzAsIDB4NzU2YmIxLCAweDllOWFjOCwgMHhiY2JkZGMsIDB4ZGFkYWViLCAweDYzNjM2M107XG5leHBvcnRzLkNhdGVnb3J5MjBjXzE4ID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMCwgMHg3NTZiYjEsIDB4OWU5YWM4LCAweGJjYmRkYywgMHhkYWRhZWIsIDB4NjM2MzYzLCAweDk2OTY5Nl07XG5leHBvcnRzLkNhdGVnb3J5MjBjXzE5ID0gWzB4MzE4MmJkLCAweDZiYWVkNiwgMHg5ZWNhZTEsIDB4YzZkYmVmLCAweGU2NTUwZCwgMHhmZDhkM2MsIDB4ZmRhZTZiLCAweGZkZDBhMiwgMHgzMWEzNTQsIDB4NzRjNDc2LFxuICAgIDB4YTFkOTliLCAweGM3ZTljMCwgMHg3NTZiYjEsIDB4OWU5YWM4LCAweGJjYmRkYywgMHhkYWRhZWIsIDB4NjM2MzYzLCAweDk2OTY5NiwgMHhiZGJkYmRdO1xuZXhwb3J0cy5DYXRlZ29yeTIwY18yMCA9IFsweDMxODJiZCwgMHg2YmFlZDYsIDB4OWVjYWUxLCAweGM2ZGJlZiwgMHhlNjU1MGQsIDB4ZmQ4ZDNjLCAweGZkYWU2YiwgMHhmZGQwYTIsIDB4MzFhMzU0LCAweDc0YzQ3NixcbiAgICAweGExZDk5YiwgMHhjN2U5YzAsIDB4NzU2YmIxLCAweDllOWFjOCwgMHhiY2JkZGMsIDB4ZGFkYWViLCAweDYzNjM2MywgMHg5Njk2OTYsIDB4YmRiZGJkLCAweGQ5ZDlkOV07XG5leHBvcnRzLkNvbG9yYmxpbmQzID0gWzB4MDA3MmIyLCAweGU2OWYwMCwgMHhmMGU0NDJdO1xuZXhwb3J0cy5Db2xvcmJsaW5kNCA9IFsweDAwNzJiMiwgMHhlNjlmMDAsIDB4ZjBlNDQyLCAweDAwOWU3M107XG5leHBvcnRzLkNvbG9yYmxpbmQ1ID0gWzB4MDA3MmIyLCAweGU2OWYwMCwgMHhmMGU0NDIsIDB4MDA5ZTczLCAweDU2YjRlOV07XG5leHBvcnRzLkNvbG9yYmxpbmQ2ID0gWzB4MDA3MmIyLCAweGU2OWYwMCwgMHhmMGU0NDIsIDB4MDA5ZTczLCAweDU2YjRlOSwgMHhkNTVlMDBdO1xuZXhwb3J0cy5Db2xvcmJsaW5kNyA9IFsweDAwNzJiMiwgMHhlNjlmMDAsIDB4ZjBlNDQyLCAweDAwOWU3MywgMHg1NmI0ZTksIDB4ZDU1ZTAwLCAweGNjNzlhN107XG5leHBvcnRzLkNvbG9yYmxpbmQ4ID0gWzB4MDA3MmIyLCAweGU2OWYwMCwgMHhmMGU0NDIsIDB4MDA5ZTczLCAweDU2YjRlOSwgMHhkNTVlMDAsIDB4Y2M3OWE3LCAweDAwMDAwMF07XG5leHBvcnRzLllsR24gPSB7IFlsR24zOiBleHBvcnRzLllsR24zLCBZbEduNDogZXhwb3J0cy5ZbEduNCwgWWxHbjU6IGV4cG9ydHMuWWxHbjUsIFlsR242OiBleHBvcnRzLllsR242LCBZbEduNzogZXhwb3J0cy5ZbEduNywgWWxHbjg6IGV4cG9ydHMuWWxHbjgsIFlsR245OiBleHBvcnRzLllsR245IH07XG5leHBvcnRzLllsR25CdSA9IHsgWWxHbkJ1MzogZXhwb3J0cy5ZbEduQnUzLCBZbEduQnU0OiBleHBvcnRzLllsR25CdTQsIFlsR25CdTU6IGV4cG9ydHMuWWxHbkJ1NSwgWWxHbkJ1NjogZXhwb3J0cy5ZbEduQnU2LCBZbEduQnU3OiBleHBvcnRzLllsR25CdTcsIFlsR25CdTg6IGV4cG9ydHMuWWxHbkJ1OCwgWWxHbkJ1OTogZXhwb3J0cy5ZbEduQnU5IH07XG5leHBvcnRzLkduQnUgPSB7IEduQnUzOiBleHBvcnRzLkduQnUzLCBHbkJ1NDogZXhwb3J0cy5HbkJ1NCwgR25CdTU6IGV4cG9ydHMuR25CdTUsIEduQnU2OiBleHBvcnRzLkduQnU2LCBHbkJ1NzogZXhwb3J0cy5HbkJ1NywgR25CdTg6IGV4cG9ydHMuR25CdTgsIEduQnU5OiBleHBvcnRzLkduQnU5IH07XG5leHBvcnRzLkJ1R24gPSB7IEJ1R24zOiBleHBvcnRzLkJ1R24zLCBCdUduNDogZXhwb3J0cy5CdUduNCwgQnVHbjU6IGV4cG9ydHMuQnVHbjUsIEJ1R242OiBleHBvcnRzLkJ1R242LCBCdUduNzogZXhwb3J0cy5CdUduNywgQnVHbjg6IGV4cG9ydHMuQnVHbjgsIEJ1R245OiBleHBvcnRzLkJ1R245IH07XG5leHBvcnRzLlB1QnVHbiA9IHsgUHVCdUduMzogZXhwb3J0cy5QdUJ1R24zLCBQdUJ1R240OiBleHBvcnRzLlB1QnVHbjQsIFB1QnVHbjU6IGV4cG9ydHMuUHVCdUduNSwgUHVCdUduNjogZXhwb3J0cy5QdUJ1R242LCBQdUJ1R243OiBleHBvcnRzLlB1QnVHbjcsIFB1QnVHbjg6IGV4cG9ydHMuUHVCdUduOCwgUHVCdUduOTogZXhwb3J0cy5QdUJ1R245IH07XG5leHBvcnRzLlB1QnUgPSB7IFB1QnUzOiBleHBvcnRzLlB1QnUzLCBQdUJ1NDogZXhwb3J0cy5QdUJ1NCwgUHVCdTU6IGV4cG9ydHMuUHVCdTUsIFB1QnU2OiBleHBvcnRzLlB1QnU2LCBQdUJ1NzogZXhwb3J0cy5QdUJ1NywgUHVCdTg6IGV4cG9ydHMuUHVCdTgsIFB1QnU5OiBleHBvcnRzLlB1QnU5IH07XG5leHBvcnRzLkJ1UHUgPSB7IEJ1UHUzOiBleHBvcnRzLkJ1UHUzLCBCdVB1NDogZXhwb3J0cy5CdVB1NCwgQnVQdTU6IGV4cG9ydHMuQnVQdTUsIEJ1UHU2OiBleHBvcnRzLkJ1UHU2LCBCdVB1NzogZXhwb3J0cy5CdVB1NywgQnVQdTg6IGV4cG9ydHMuQnVQdTgsIEJ1UHU5OiBleHBvcnRzLkJ1UHU5IH07XG5leHBvcnRzLlJkUHUgPSB7IFJkUHUzOiBleHBvcnRzLlJkUHUzLCBSZFB1NDogZXhwb3J0cy5SZFB1NCwgUmRQdTU6IGV4cG9ydHMuUmRQdTUsIFJkUHU2OiBleHBvcnRzLlJkUHU2LCBSZFB1NzogZXhwb3J0cy5SZFB1NywgUmRQdTg6IGV4cG9ydHMuUmRQdTgsIFJkUHU5OiBleHBvcnRzLlJkUHU5IH07XG5leHBvcnRzLlB1UmQgPSB7IFB1UmQzOiBleHBvcnRzLlB1UmQzLCBQdVJkNDogZXhwb3J0cy5QdVJkNCwgUHVSZDU6IGV4cG9ydHMuUHVSZDUsIFB1UmQ2OiBleHBvcnRzLlB1UmQ2LCBQdVJkNzogZXhwb3J0cy5QdVJkNywgUHVSZDg6IGV4cG9ydHMuUHVSZDgsIFB1UmQ5OiBleHBvcnRzLlB1UmQ5IH07XG5leHBvcnRzLk9yUmQgPSB7IE9yUmQzOiBleHBvcnRzLk9yUmQzLCBPclJkNDogZXhwb3J0cy5PclJkNCwgT3JSZDU6IGV4cG9ydHMuT3JSZDUsIE9yUmQ2OiBleHBvcnRzLk9yUmQ2LCBPclJkNzogZXhwb3J0cy5PclJkNywgT3JSZDg6IGV4cG9ydHMuT3JSZDgsIE9yUmQ5OiBleHBvcnRzLk9yUmQ5IH07XG5leHBvcnRzLllsT3JSZCA9IHsgWWxPclJkMzogZXhwb3J0cy5ZbE9yUmQzLCBZbE9yUmQ0OiBleHBvcnRzLllsT3JSZDQsIFlsT3JSZDU6IGV4cG9ydHMuWWxPclJkNSwgWWxPclJkNjogZXhwb3J0cy5ZbE9yUmQ2LCBZbE9yUmQ3OiBleHBvcnRzLllsT3JSZDcsIFlsT3JSZDg6IGV4cG9ydHMuWWxPclJkOCwgWWxPclJkOTogZXhwb3J0cy5ZbE9yUmQ5IH07XG5leHBvcnRzLllsT3JCciA9IHsgWWxPckJyMzogZXhwb3J0cy5ZbE9yQnIzLCBZbE9yQnI0OiBleHBvcnRzLllsT3JCcjQsIFlsT3JCcjU6IGV4cG9ydHMuWWxPckJyNSwgWWxPckJyNjogZXhwb3J0cy5ZbE9yQnI2LCBZbE9yQnI3OiBleHBvcnRzLllsT3JCcjcsIFlsT3JCcjg6IGV4cG9ydHMuWWxPckJyOCwgWWxPckJyOTogZXhwb3J0cy5ZbE9yQnI5IH07XG5leHBvcnRzLlB1cnBsZXMgPSB7IFB1cnBsZXMzOiBleHBvcnRzLlB1cnBsZXMzLCBQdXJwbGVzNDogZXhwb3J0cy5QdXJwbGVzNCwgUHVycGxlczU6IGV4cG9ydHMuUHVycGxlczUsIFB1cnBsZXM2OiBleHBvcnRzLlB1cnBsZXM2LCBQdXJwbGVzNzogZXhwb3J0cy5QdXJwbGVzNywgUHVycGxlczg6IGV4cG9ydHMuUHVycGxlczgsIFB1cnBsZXM5OiBleHBvcnRzLlB1cnBsZXM5IH07XG5leHBvcnRzLkJsdWVzID0geyBCbHVlczM6IGV4cG9ydHMuQmx1ZXMzLCBCbHVlczQ6IGV4cG9ydHMuQmx1ZXM0LCBCbHVlczU6IGV4cG9ydHMuQmx1ZXM1LCBCbHVlczY6IGV4cG9ydHMuQmx1ZXM2LCBCbHVlczc6IGV4cG9ydHMuQmx1ZXM3LCBCbHVlczg6IGV4cG9ydHMuQmx1ZXM4LCBCbHVlczk6IGV4cG9ydHMuQmx1ZXM5IH07XG5leHBvcnRzLkdyZWVucyA9IHsgR3JlZW5zMzogZXhwb3J0cy5HcmVlbnMzLCBHcmVlbnM0OiBleHBvcnRzLkdyZWVuczQsIEdyZWVuczU6IGV4cG9ydHMuR3JlZW5zNSwgR3JlZW5zNjogZXhwb3J0cy5HcmVlbnM2LCBHcmVlbnM3OiBleHBvcnRzLkdyZWVuczcsIEdyZWVuczg6IGV4cG9ydHMuR3JlZW5zOCwgR3JlZW5zOTogZXhwb3J0cy5HcmVlbnM5IH07XG5leHBvcnRzLk9yYW5nZXMgPSB7IE9yYW5nZXMzOiBleHBvcnRzLk9yYW5nZXMzLCBPcmFuZ2VzNDogZXhwb3J0cy5PcmFuZ2VzNCwgT3JhbmdlczU6IGV4cG9ydHMuT3JhbmdlczUsIE9yYW5nZXM2OiBleHBvcnRzLk9yYW5nZXM2LCBPcmFuZ2VzNzogZXhwb3J0cy5PcmFuZ2VzNywgT3Jhbmdlczg6IGV4cG9ydHMuT3JhbmdlczgsIE9yYW5nZXM5OiBleHBvcnRzLk9yYW5nZXM5IH07XG5leHBvcnRzLlJlZHMgPSB7IFJlZHMzOiBleHBvcnRzLlJlZHMzLCBSZWRzNDogZXhwb3J0cy5SZWRzNCwgUmVkczU6IGV4cG9ydHMuUmVkczUsIFJlZHM2OiBleHBvcnRzLlJlZHM2LCBSZWRzNzogZXhwb3J0cy5SZWRzNywgUmVkczg6IGV4cG9ydHMuUmVkczgsIFJlZHM5OiBleHBvcnRzLlJlZHM5IH07XG5leHBvcnRzLkdyZXlzID0geyBHcmV5czM6IGV4cG9ydHMuR3JleXMzLCBHcmV5czQ6IGV4cG9ydHMuR3JleXM0LCBHcmV5czU6IGV4cG9ydHMuR3JleXM1LCBHcmV5czY6IGV4cG9ydHMuR3JleXM2LCBHcmV5czc6IGV4cG9ydHMuR3JleXM3LCBHcmV5czg6IGV4cG9ydHMuR3JleXM4LCBHcmV5czk6IGV4cG9ydHMuR3JleXM5LCBHcmV5czEwOiBleHBvcnRzLkdyZXlzMTAsIEdyZXlzMTE6IGV4cG9ydHMuR3JleXMxMSwgR3JleXMyNTY6IGV4cG9ydHMuR3JleXMyNTYgfTtcbmV4cG9ydHMuUHVPciA9IHsgUHVPcjM6IGV4cG9ydHMuUHVPcjMsIFB1T3I0OiBleHBvcnRzLlB1T3I0LCBQdU9yNTogZXhwb3J0cy5QdU9yNSwgUHVPcjY6IGV4cG9ydHMuUHVPcjYsIFB1T3I3OiBleHBvcnRzLlB1T3I3LCBQdU9yODogZXhwb3J0cy5QdU9yOCwgUHVPcjk6IGV4cG9ydHMuUHVPcjksIFB1T3IxMDogZXhwb3J0cy5QdU9yMTAsIFB1T3IxMTogZXhwb3J0cy5QdU9yMTEgfTtcbmV4cG9ydHMuQnJCRyA9IHsgQnJCRzM6IGV4cG9ydHMuQnJCRzMsIEJyQkc0OiBleHBvcnRzLkJyQkc0LCBCckJHNTogZXhwb3J0cy5CckJHNSwgQnJCRzY6IGV4cG9ydHMuQnJCRzYsIEJyQkc3OiBleHBvcnRzLkJyQkc3LCBCckJHODogZXhwb3J0cy5CckJHOCwgQnJCRzk6IGV4cG9ydHMuQnJCRzksIEJyQkcxMDogZXhwb3J0cy5CckJHMTAsIEJyQkcxMTogZXhwb3J0cy5CckJHMTEgfTtcbmV4cG9ydHMuUFJHbiA9IHsgUFJHbjM6IGV4cG9ydHMuUFJHbjMsIFBSR240OiBleHBvcnRzLlBSR240LCBQUkduNTogZXhwb3J0cy5QUkduNSwgUFJHbjY6IGV4cG9ydHMuUFJHbjYsIFBSR243OiBleHBvcnRzLlBSR243LCBQUkduODogZXhwb3J0cy5QUkduOCwgUFJHbjk6IGV4cG9ydHMuUFJHbjksIFBSR24xMDogZXhwb3J0cy5QUkduMTAsIFBSR24xMTogZXhwb3J0cy5QUkduMTEgfTtcbmV4cG9ydHMuUGlZRyA9IHsgUGlZRzM6IGV4cG9ydHMuUGlZRzMsIFBpWUc0OiBleHBvcnRzLlBpWUc0LCBQaVlHNTogZXhwb3J0cy5QaVlHNSwgUGlZRzY6IGV4cG9ydHMuUGlZRzYsIFBpWUc3OiBleHBvcnRzLlBpWUc3LCBQaVlHODogZXhwb3J0cy5QaVlHOCwgUGlZRzk6IGV4cG9ydHMuUGlZRzksIFBpWUcxMDogZXhwb3J0cy5QaVlHMTAsIFBpWUcxMTogZXhwb3J0cy5QaVlHMTEgfTtcbmV4cG9ydHMuUmRCdSA9IHsgUmRCdTM6IGV4cG9ydHMuUmRCdTMsIFJkQnU0OiBleHBvcnRzLlJkQnU0LCBSZEJ1NTogZXhwb3J0cy5SZEJ1NSwgUmRCdTY6IGV4cG9ydHMuUmRCdTYsIFJkQnU3OiBleHBvcnRzLlJkQnU3LCBSZEJ1ODogZXhwb3J0cy5SZEJ1OCwgUmRCdTk6IGV4cG9ydHMuUmRCdTksIFJkQnUxMDogZXhwb3J0cy5SZEJ1MTAsIFJkQnUxMTogZXhwb3J0cy5SZEJ1MTEgfTtcbmV4cG9ydHMuUmRHeSA9IHsgUmRHeTM6IGV4cG9ydHMuUmRHeTMsIFJkR3k0OiBleHBvcnRzLlJkR3k0LCBSZEd5NTogZXhwb3J0cy5SZEd5NSwgUmRHeTY6IGV4cG9ydHMuUmRHeTYsIFJkR3k3OiBleHBvcnRzLlJkR3k3LCBSZEd5ODogZXhwb3J0cy5SZEd5OCwgUmRHeTk6IGV4cG9ydHMuUmRHeTksIFJkR3kxMDogZXhwb3J0cy5SZEd5MTAsIFJkR3kxMTogZXhwb3J0cy5SZEd5MTEgfTtcbmV4cG9ydHMuUmRZbEJ1ID0geyBSZFlsQnUzOiBleHBvcnRzLlJkWWxCdTMsIFJkWWxCdTQ6IGV4cG9ydHMuUmRZbEJ1NCwgUmRZbEJ1NTogZXhwb3J0cy5SZFlsQnU1LCBSZFlsQnU2OiBleHBvcnRzLlJkWWxCdTYsIFJkWWxCdTc6IGV4cG9ydHMuUmRZbEJ1NywgUmRZbEJ1ODogZXhwb3J0cy5SZFlsQnU4LCBSZFlsQnU5OiBleHBvcnRzLlJkWWxCdTksIFJkWWxCdTEwOiBleHBvcnRzLlJkWWxCdTEwLCBSZFlsQnUxMTogZXhwb3J0cy5SZFlsQnUxMSB9O1xuZXhwb3J0cy5TcGVjdHJhbCA9IHsgU3BlY3RyYWwzOiBleHBvcnRzLlNwZWN0cmFsMywgU3BlY3RyYWw0OiBleHBvcnRzLlNwZWN0cmFsNCwgU3BlY3RyYWw1OiBleHBvcnRzLlNwZWN0cmFsNSwgU3BlY3RyYWw2OiBleHBvcnRzLlNwZWN0cmFsNiwgU3BlY3RyYWw3OiBleHBvcnRzLlNwZWN0cmFsNywgU3BlY3RyYWw4OiBleHBvcnRzLlNwZWN0cmFsOCwgU3BlY3RyYWw5OiBleHBvcnRzLlNwZWN0cmFsOSwgU3BlY3RyYWwxMDogZXhwb3J0cy5TcGVjdHJhbDEwLCBTcGVjdHJhbDExOiBleHBvcnRzLlNwZWN0cmFsMTEgfTtcbmV4cG9ydHMuUmRZbEduID0geyBSZFlsR24zOiBleHBvcnRzLlJkWWxHbjMsIFJkWWxHbjQ6IGV4cG9ydHMuUmRZbEduNCwgUmRZbEduNTogZXhwb3J0cy5SZFlsR241LCBSZFlsR242OiBleHBvcnRzLlJkWWxHbjYsIFJkWWxHbjc6IGV4cG9ydHMuUmRZbEduNywgUmRZbEduODogZXhwb3J0cy5SZFlsR244LCBSZFlsR245OiBleHBvcnRzLlJkWWxHbjksIFJkWWxHbjEwOiBleHBvcnRzLlJkWWxHbjEwLCBSZFlsR24xMTogZXhwb3J0cy5SZFlsR24xMSB9O1xuZXhwb3J0cy5JbmZlcm5vID0geyBJbmZlcm5vMzogZXhwb3J0cy5JbmZlcm5vMywgSW5mZXJubzQ6IGV4cG9ydHMuSW5mZXJubzQsIEluZmVybm81OiBleHBvcnRzLkluZmVybm81LCBJbmZlcm5vNjogZXhwb3J0cy5JbmZlcm5vNiwgSW5mZXJubzc6IGV4cG9ydHMuSW5mZXJubzcsIEluZmVybm84OiBleHBvcnRzLkluZmVybm84LCBJbmZlcm5vOTogZXhwb3J0cy5JbmZlcm5vOSwgSW5mZXJubzEwOiBleHBvcnRzLkluZmVybm8xMCwgSW5mZXJubzExOiBleHBvcnRzLkluZmVybm8xMSwgSW5mZXJubzI1NjogZXhwb3J0cy5JbmZlcm5vMjU2IH07XG5leHBvcnRzLk1hZ21hID0geyBNYWdtYTM6IGV4cG9ydHMuTWFnbWEzLCBNYWdtYTQ6IGV4cG9ydHMuTWFnbWE0LCBNYWdtYTU6IGV4cG9ydHMuTWFnbWE1LCBNYWdtYTY6IGV4cG9ydHMuTWFnbWE2LCBNYWdtYTc6IGV4cG9ydHMuTWFnbWE3LCBNYWdtYTg6IGV4cG9ydHMuTWFnbWE4LCBNYWdtYTk6IGV4cG9ydHMuTWFnbWE5LCBNYWdtYTEwOiBleHBvcnRzLk1hZ21hMTAsIE1hZ21hMTE6IGV4cG9ydHMuTWFnbWExMSwgTWFnbWEyNTY6IGV4cG9ydHMuTWFnbWEyNTYgfTtcbmV4cG9ydHMuUGxhc21hID0geyBQbGFzbWEzOiBleHBvcnRzLlBsYXNtYTMsIFBsYXNtYTQ6IGV4cG9ydHMuUGxhc21hNCwgUGxhc21hNTogZXhwb3J0cy5QbGFzbWE1LCBQbGFzbWE2OiBleHBvcnRzLlBsYXNtYTYsIFBsYXNtYTc6IGV4cG9ydHMuUGxhc21hNywgUGxhc21hODogZXhwb3J0cy5QbGFzbWE4LCBQbGFzbWE5OiBleHBvcnRzLlBsYXNtYTksIFBsYXNtYTEwOiBleHBvcnRzLlBsYXNtYTEwLCBQbGFzbWExMTogZXhwb3J0cy5QbGFzbWExMSwgUGxhc21hMjU2OiBleHBvcnRzLlBsYXNtYTI1NiB9O1xuZXhwb3J0cy5WaXJpZGlzID0geyBWaXJpZGlzMzogZXhwb3J0cy5WaXJpZGlzMywgVmlyaWRpczQ6IGV4cG9ydHMuVmlyaWRpczQsIFZpcmlkaXM1OiBleHBvcnRzLlZpcmlkaXM1LCBWaXJpZGlzNjogZXhwb3J0cy5WaXJpZGlzNiwgVmlyaWRpczc6IGV4cG9ydHMuVmlyaWRpczcsIFZpcmlkaXM4OiBleHBvcnRzLlZpcmlkaXM4LCBWaXJpZGlzOTogZXhwb3J0cy5WaXJpZGlzOSwgVmlyaWRpczEwOiBleHBvcnRzLlZpcmlkaXMxMCwgVmlyaWRpczExOiBleHBvcnRzLlZpcmlkaXMxMSwgVmlyaWRpczI1NjogZXhwb3J0cy5WaXJpZGlzMjU2IH07XG5leHBvcnRzLkFjY2VudCA9IHsgQWNjZW50MzogZXhwb3J0cy5BY2NlbnQzLCBBY2NlbnQ0OiBleHBvcnRzLkFjY2VudDQsIEFjY2VudDU6IGV4cG9ydHMuQWNjZW50NSwgQWNjZW50NjogZXhwb3J0cy5BY2NlbnQ2LCBBY2NlbnQ3OiBleHBvcnRzLkFjY2VudDcsIEFjY2VudDg6IGV4cG9ydHMuQWNjZW50OCB9O1xuZXhwb3J0cy5EYXJrMiA9IHsgRGFyazJfMzogZXhwb3J0cy5EYXJrMl8zLCBEYXJrMl80OiBleHBvcnRzLkRhcmsyXzQsIERhcmsyXzU6IGV4cG9ydHMuRGFyazJfNSwgRGFyazJfNjogZXhwb3J0cy5EYXJrMl82LCBEYXJrMl83OiBleHBvcnRzLkRhcmsyXzcsIERhcmsyXzg6IGV4cG9ydHMuRGFyazJfOCB9O1xuZXhwb3J0cy5QYWlyZWQgPSB7IFBhaXJlZDM6IGV4cG9ydHMuUGFpcmVkMywgUGFpcmVkNDogZXhwb3J0cy5QYWlyZWQ0LCBQYWlyZWQ1OiBleHBvcnRzLlBhaXJlZDUsIFBhaXJlZDY6IGV4cG9ydHMuUGFpcmVkNiwgUGFpcmVkNzogZXhwb3J0cy5QYWlyZWQ3LCBQYWlyZWQ4OiBleHBvcnRzLlBhaXJlZDgsIFBhaXJlZDk6IGV4cG9ydHMuUGFpcmVkOSwgUGFpcmVkMTA6IGV4cG9ydHMuUGFpcmVkMTAsIFBhaXJlZDExOiBleHBvcnRzLlBhaXJlZDExLCBQYWlyZWQxMjogZXhwb3J0cy5QYWlyZWQxMiB9O1xuZXhwb3J0cy5QYXN0ZWwxID0geyBQYXN0ZWwxXzM6IGV4cG9ydHMuUGFzdGVsMV8zLCBQYXN0ZWwxXzQ6IGV4cG9ydHMuUGFzdGVsMV80LCBQYXN0ZWwxXzU6IGV4cG9ydHMuUGFzdGVsMV81LCBQYXN0ZWwxXzY6IGV4cG9ydHMuUGFzdGVsMV82LCBQYXN0ZWwxXzc6IGV4cG9ydHMuUGFzdGVsMV83LCBQYXN0ZWwxXzg6IGV4cG9ydHMuUGFzdGVsMV84LCBQYXN0ZWwxXzk6IGV4cG9ydHMuUGFzdGVsMV85IH07XG5leHBvcnRzLlBhc3RlbDIgPSB7IFBhc3RlbDJfMzogZXhwb3J0cy5QYXN0ZWwyXzMsIFBhc3RlbDJfNDogZXhwb3J0cy5QYXN0ZWwyXzQsIFBhc3RlbDJfNTogZXhwb3J0cy5QYXN0ZWwyXzUsIFBhc3RlbDJfNjogZXhwb3J0cy5QYXN0ZWwyXzYsIFBhc3RlbDJfNzogZXhwb3J0cy5QYXN0ZWwyXzcsIFBhc3RlbDJfODogZXhwb3J0cy5QYXN0ZWwyXzggfTtcbmV4cG9ydHMuU2V0MSA9IHsgU2V0MV8zOiBleHBvcnRzLlNldDFfMywgU2V0MV80OiBleHBvcnRzLlNldDFfNCwgU2V0MV81OiBleHBvcnRzLlNldDFfNSwgU2V0MV82OiBleHBvcnRzLlNldDFfNiwgU2V0MV83OiBleHBvcnRzLlNldDFfNywgU2V0MV84OiBleHBvcnRzLlNldDFfOCwgU2V0MV85OiBleHBvcnRzLlNldDFfOSB9O1xuZXhwb3J0cy5TZXQyID0geyBTZXQyXzM6IGV4cG9ydHMuU2V0Ml8zLCBTZXQyXzQ6IGV4cG9ydHMuU2V0Ml80LCBTZXQyXzU6IGV4cG9ydHMuU2V0Ml81LCBTZXQyXzY6IGV4cG9ydHMuU2V0Ml82LCBTZXQyXzc6IGV4cG9ydHMuU2V0Ml83LCBTZXQyXzg6IGV4cG9ydHMuU2V0Ml84IH07XG5leHBvcnRzLlNldDMgPSB7IFNldDNfMzogZXhwb3J0cy5TZXQzXzMsIFNldDNfNDogZXhwb3J0cy5TZXQzXzQsIFNldDNfNTogZXhwb3J0cy5TZXQzXzUsIFNldDNfNjogZXhwb3J0cy5TZXQzXzYsIFNldDNfNzogZXhwb3J0cy5TZXQzXzcsIFNldDNfODogZXhwb3J0cy5TZXQzXzgsIFNldDNfOTogZXhwb3J0cy5TZXQzXzksIFNldDNfMTA6IGV4cG9ydHMuU2V0M18xMCwgU2V0M18xMTogZXhwb3J0cy5TZXQzXzExLCBTZXQzXzEyOiBleHBvcnRzLlNldDNfMTIgfTtcbmV4cG9ydHMuQ2F0ZWdvcnkxMCA9IHsgQ2F0ZWdvcnkxMF8zOiBleHBvcnRzLkNhdGVnb3J5MTBfMywgQ2F0ZWdvcnkxMF80OiBleHBvcnRzLkNhdGVnb3J5MTBfNCwgQ2F0ZWdvcnkxMF81OiBleHBvcnRzLkNhdGVnb3J5MTBfNSwgQ2F0ZWdvcnkxMF82OiBleHBvcnRzLkNhdGVnb3J5MTBfNiwgQ2F0ZWdvcnkxMF83OiBleHBvcnRzLkNhdGVnb3J5MTBfNywgQ2F0ZWdvcnkxMF84OiBleHBvcnRzLkNhdGVnb3J5MTBfOCwgQ2F0ZWdvcnkxMF85OiBleHBvcnRzLkNhdGVnb3J5MTBfOSwgQ2F0ZWdvcnkxMF8xMDogZXhwb3J0cy5DYXRlZ29yeTEwXzEwIH07XG5leHBvcnRzLkNhdGVnb3J5MjAgPSB7IENhdGVnb3J5MjBfMzogZXhwb3J0cy5DYXRlZ29yeTIwXzMsIENhdGVnb3J5MjBfNDogZXhwb3J0cy5DYXRlZ29yeTIwXzQsIENhdGVnb3J5MjBfNTogZXhwb3J0cy5DYXRlZ29yeTIwXzUsIENhdGVnb3J5MjBfNjogZXhwb3J0cy5DYXRlZ29yeTIwXzYsIENhdGVnb3J5MjBfNzogZXhwb3J0cy5DYXRlZ29yeTIwXzcsIENhdGVnb3J5MjBfODogZXhwb3J0cy5DYXRlZ29yeTIwXzgsIENhdGVnb3J5MjBfOTogZXhwb3J0cy5DYXRlZ29yeTIwXzksIENhdGVnb3J5MjBfMTA6IGV4cG9ydHMuQ2F0ZWdvcnkyMF8xMCwgQ2F0ZWdvcnkyMF8xMTogZXhwb3J0cy5DYXRlZ29yeTIwXzExLCBDYXRlZ29yeTIwXzEyOiBleHBvcnRzLkNhdGVnb3J5MjBfMTIsIENhdGVnb3J5MjBfMTM6IGV4cG9ydHMuQ2F0ZWdvcnkyMF8xMywgQ2F0ZWdvcnkyMF8xNDogZXhwb3J0cy5DYXRlZ29yeTIwXzE0LCBDYXRlZ29yeTIwXzE1OiBleHBvcnRzLkNhdGVnb3J5MjBfMTUsIENhdGVnb3J5MjBfMTY6IGV4cG9ydHMuQ2F0ZWdvcnkyMF8xNiwgQ2F0ZWdvcnkyMF8xNzogZXhwb3J0cy5DYXRlZ29yeTIwXzE3LCBDYXRlZ29yeTIwXzE4OiBleHBvcnRzLkNhdGVnb3J5MjBfMTgsIENhdGVnb3J5MjBfMTk6IGV4cG9ydHMuQ2F0ZWdvcnkyMF8xOSwgQ2F0ZWdvcnkyMF8yMDogZXhwb3J0cy5DYXRlZ29yeTIwXzIwIH07XG5leHBvcnRzLkNhdGVnb3J5MjBiID0geyBDYXRlZ29yeTIwYl8zOiBleHBvcnRzLkNhdGVnb3J5MjBiXzMsIENhdGVnb3J5MjBiXzQ6IGV4cG9ydHMuQ2F0ZWdvcnkyMGJfNCwgQ2F0ZWdvcnkyMGJfNTogZXhwb3J0cy5DYXRlZ29yeTIwYl81LCBDYXRlZ29yeTIwYl82OiBleHBvcnRzLkNhdGVnb3J5MjBiXzYsIENhdGVnb3J5MjBiXzc6IGV4cG9ydHMuQ2F0ZWdvcnkyMGJfNywgQ2F0ZWdvcnkyMGJfODogZXhwb3J0cy5DYXRlZ29yeTIwYl84LCBDYXRlZ29yeTIwYl85OiBleHBvcnRzLkNhdGVnb3J5MjBiXzksIENhdGVnb3J5MjBiXzEwOiBleHBvcnRzLkNhdGVnb3J5MjBiXzEwLCBDYXRlZ29yeTIwYl8xMTogZXhwb3J0cy5DYXRlZ29yeTIwYl8xMSwgQ2F0ZWdvcnkyMGJfMTI6IGV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTIsIENhdGVnb3J5MjBiXzEzOiBleHBvcnRzLkNhdGVnb3J5MjBiXzEzLCBDYXRlZ29yeTIwYl8xNDogZXhwb3J0cy5DYXRlZ29yeTIwYl8xNCwgQ2F0ZWdvcnkyMGJfMTU6IGV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTUsIENhdGVnb3J5MjBiXzE2OiBleHBvcnRzLkNhdGVnb3J5MjBiXzE2LCBDYXRlZ29yeTIwYl8xNzogZXhwb3J0cy5DYXRlZ29yeTIwYl8xNywgQ2F0ZWdvcnkyMGJfMTg6IGV4cG9ydHMuQ2F0ZWdvcnkyMGJfMTgsIENhdGVnb3J5MjBiXzE5OiBleHBvcnRzLkNhdGVnb3J5MjBiXzE5LCBDYXRlZ29yeTIwYl8yMDogZXhwb3J0cy5DYXRlZ29yeTIwYl8yMCB9O1xuZXhwb3J0cy5DYXRlZ29yeTIwYyA9IHsgQ2F0ZWdvcnkyMGNfMzogZXhwb3J0cy5DYXRlZ29yeTIwY18zLCBDYXRlZ29yeTIwY180OiBleHBvcnRzLkNhdGVnb3J5MjBjXzQsIENhdGVnb3J5MjBjXzU6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfNSwgQ2F0ZWdvcnkyMGNfNjogZXhwb3J0cy5DYXRlZ29yeTIwY182LCBDYXRlZ29yeTIwY183OiBleHBvcnRzLkNhdGVnb3J5MjBjXzcsIENhdGVnb3J5MjBjXzg6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfOCwgQ2F0ZWdvcnkyMGNfOTogZXhwb3J0cy5DYXRlZ29yeTIwY185LCBDYXRlZ29yeTIwY18xMDogZXhwb3J0cy5DYXRlZ29yeTIwY18xMCwgQ2F0ZWdvcnkyMGNfMTE6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfMTEsIENhdGVnb3J5MjBjXzEyOiBleHBvcnRzLkNhdGVnb3J5MjBjXzEyLCBDYXRlZ29yeTIwY18xMzogZXhwb3J0cy5DYXRlZ29yeTIwY18xMywgQ2F0ZWdvcnkyMGNfMTQ6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfMTQsIENhdGVnb3J5MjBjXzE1OiBleHBvcnRzLkNhdGVnb3J5MjBjXzE1LCBDYXRlZ29yeTIwY18xNjogZXhwb3J0cy5DYXRlZ29yeTIwY18xNiwgQ2F0ZWdvcnkyMGNfMTc6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfMTcsIENhdGVnb3J5MjBjXzE4OiBleHBvcnRzLkNhdGVnb3J5MjBjXzE4LCBDYXRlZ29yeTIwY18xOTogZXhwb3J0cy5DYXRlZ29yeTIwY18xOSwgQ2F0ZWdvcnkyMGNfMjA6IGV4cG9ydHMuQ2F0ZWdvcnkyMGNfMjAgfTtcbmV4cG9ydHMuQ29sb3JibGluZCA9IHsgQ29sb3JibGluZDM6IGV4cG9ydHMuQ29sb3JibGluZDMsIENvbG9yYmxpbmQ0OiBleHBvcnRzLkNvbG9yYmxpbmQ0LCBDb2xvcmJsaW5kNTogZXhwb3J0cy5Db2xvcmJsaW5kNSwgQ29sb3JibGluZDY6IGV4cG9ydHMuQ29sb3JibGluZDYsIENvbG9yYmxpbmQ3OiBleHBvcnRzLkNvbG9yYmxpbmQ3LCBDb2xvcmJsaW5kODogZXhwb3J0cy5Db2xvcmJsaW5kOCB9O1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIExpY2Vuc2UgcmVnYXJkaW5nIHRoZSBWaXJpZGlzLCBNYWdtYSwgUGxhc21hIGFuZCBJbmZlcm5vIGNvbG9ybWFwc1xuICogTmV3IG1hdHBsb3RsaWIgY29sb3JtYXBzIGJ5IE5hdGhhbmllbCBKLiBTbWl0aCwgU3RlZmFuIHZhbiBkZXIgV2FsdCxcbiAqIGFuZCAoaW4gdGhlIGNhc2Ugb2YgdmlyaWRpcykgRXJpYyBGaXJpbmcuXG4gKlxuICogVGhlIFZpcmlkaXMsIE1hZ21hLCBQbGFzbWEsIGFuZCBJbmZlcm5vIGNvbG9yIG1hcHMgYXJlIHJlbGVhc2VkIHVuZGVyIHRoZVxuICogQ0MwIGxpY2Vuc2UgLyBwdWJsaWMgZG9tYWluIGRlZGljYXRpb24uIFdlIHdvdWxkIGFwcHJlY2lhdGUgY3JlZGl0IGlmIHlvdVxuICogdXNlIG9yIHJlZGlzdHJpYnV0ZSB0aGVzZSBjb2xvcm1hcHMsIGJ1dCBkbyBub3QgaW1wb3NlIGFueSBsZWdhbFxuICogcmVzdHJpY3Rpb25zLlxuICpcbiAqIFRvIHRoZSBleHRlbnQgcG9zc2libGUgdW5kZXIgbGF3LCB0aGUgcGVyc29ucyB3aG8gYXNzb2NpYXRlZCBDQzAgd2l0aFxuICogbXBsLWNvbG9ybWFwcyBoYXZlIHdhaXZlZCBhbGwgY29weXJpZ2h0IGFuZCByZWxhdGVkIG9yIG5laWdoYm9yaW5nIHJpZ2h0c1xuICogdG8gbXBsLWNvbG9ybWFwcy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBDQzAgbGVnYWxjb2RlIGFsb25nIHdpdGggdGhpc1xuICogd29yay4gIElmIG5vdCwgc2VlIDxodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9wdWJsaWNkb21haW4vemVyby8xLjAvPi5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBUaGlzIHByb2R1Y3QgaW5jbHVkZXMgY29sb3Igc3BlY2lmaWNhdGlvbnMgYW5kIGRlc2lnbnMgZGV2ZWxvcGVkIGJ5XG4gKiBDeW50aGlhIEJyZXdlciAoaHR0cDovL2NvbG9yYnJld2VyMi5vcmcvKS4gIFRoZSBCcmV3ZXIgY29sb3JtYXBzIGFyZVxuICogbGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSB2MiBsaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0IGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIExpY2Vuc2UgcmVnYXJkaW5nIHRoZSBEMyBjb2xvciBwYWxldHRlcyAoQ2F0ZWdvcnkxMCwgQ2F0ZWdvcnkyMCxcbiAqIENhdGVnb3J5MjBiLCBhbmQgQ2F0ZWdvcnkgMjBjKTpcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE1IE1pa2UgQm9zdG9ja1xuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICpcbiAqICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICpcbiAqICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uXG4gKiAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqICogTmVpdGhlciB0aGUgbmFtZSBvZiB0aGUgYXV0aG9yIG5vciB0aGUgbmFtZXMgb2YgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvXG4gKiAgIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljXG4gKiAgIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICogQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICogSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gKiBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIE9XTkVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEVcbiAqIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gKiBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICogU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVJcbiAqIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gKiBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKi9cbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9kZWZhdWx0X3Rvb2xzLCBfZGVmYXVsdF90b29sdGlwcywgX2tub3duX3Rvb2xzLCBfd2l0aF9kZWZhdWx0LCBleHRlbmQgPSBmdW5jdGlvbiAoY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7XG4gICAgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpXG4gICAgICAgIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTtcbn0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LCBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksIHNsaWNlID0gW10uc2xpY2UsIGluZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pXG4gICAgICAgIHJldHVybiBpO1xufSByZXR1cm4gLTE7IH07XG52YXIgXyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlXCIpO1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIHNwcmludGYgPSByZXF1aXJlKFwic3ByaW50ZlwiKTtcbnZhciBkb2N1bWVudF8xID0gcmVxdWlyZShcIi4uL2RvY3VtZW50XCIpO1xudmFyIGVtYmVkID0gcmVxdWlyZShcIi4uL2VtYmVkXCIpO1xudmFyIGVtYmVkXzEgPSByZXF1aXJlKFwiLi4vZW1iZWRcIik7XG52YXIgbW9kZWxzID0gcmVxdWlyZShcIi4vbW9kZWxzXCIpO1xudmFyIHN0cmluZ18xID0gcmVxdWlyZShcIi4uL2NvcmUvdXRpbC9zdHJpbmdcIik7XG5fZGVmYXVsdF90b29sdGlwcyA9IFtbXCJpbmRleFwiLCBcIiRpbmRleFwiXSwgW1wiZGF0YSAoeCwgeSlcIiwgXCIoJHgsICR5KVwiXSwgW1wiY2FudmFzICh4LCB5KVwiLCBcIigkc3gsICRzeSlcIl1dO1xuX2RlZmF1bHRfdG9vbHMgPSBcInBhbix3aGVlbF96b29tLGJveF96b29tLHNhdmUscmVzZXQsaGVscFwiO1xuX2tub3duX3Rvb2xzID0ge1xuICAgIHBhbjogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuUGFuVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ2JvdGgnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgeHBhbjogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuUGFuVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ3dpZHRoJ1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHlwYW46IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLlBhblRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6ICdoZWlnaHQnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgd2hlZWxfem9vbTogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuV2hlZWxab29tVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ2JvdGgnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgeHdoZWVsX3pvb206IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLldoZWVsWm9vbVRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6ICd3aWR0aCdcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB5d2hlZWxfem9vbTogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuV2hlZWxab29tVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ2hlaWdodCdcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB6b29tX2luOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5ab29tSW5Ub29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiAnYm90aCdcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB4em9vbV9pbjogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuWm9vbUluVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ3dpZHRoJ1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHl6b29tX2luOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5ab29tSW5Ub29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiAnaGVpZ2h0J1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHpvb21fb3V0OiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5ab29tT3V0VG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ2JvdGgnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgeHpvb21fb3V0OiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5ab29tT3V0VG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ3dpZHRoJ1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHl6b29tX291dDogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuWm9vbU91dFRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6ICdoZWlnaHQnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVzaXplOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5SZXNpemVUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3RcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjbGljazogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuVGFwVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgYmVoYXZpb3I6IFwiaW5zcGVjdFwiXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgdGFwOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5UYXBUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3RcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcm9zc2hhaXI6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkNyb3NzaGFpclRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGJveF9zZWxlY3Q6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkJveFNlbGVjdFRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHhib3hfc2VsZWN0OiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5Cb3hTZWxlY3RUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiAnd2lkdGgnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgeWJveF9zZWxlY3Q6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkJveFNlbGVjdFRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6ICdoZWlnaHQnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcG9seV9zZWxlY3Q6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLlBvbHlTZWxlY3RUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3RcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBsYXNzb19zZWxlY3Q6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkxhc3NvU2VsZWN0VG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgYm94X3pvb206IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkJveFpvb21Ub29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiAnYm90aCdcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB4Ym94X3pvb206IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkJveFpvb21Ub29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiAnd2lkdGgnXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgeWJveF96b29tOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5Cb3hab29tVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90LFxuICAgICAgICAgICAgZGltZW5zaW9uczogJ2hlaWdodCdcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBob3ZlcjogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuSG92ZXJUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3QsXG4gICAgICAgICAgICB0b29sdGlwczogX2RlZmF1bHRfdG9vbHRpcHNcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzYXZlOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5TYXZlVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcHJldmlld3NhdmU6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLlNhdmVUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3RcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5VbmRvVG9vbCh7XG4gICAgICAgICAgICBwbG90OiBwbG90XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVkbzogZnVuY3Rpb24gKHBsb3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuUmVkb1Rvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHJlc2V0OiBmdW5jdGlvbiAocGxvdCkge1xuICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5SZXNldFRvb2woe1xuICAgICAgICAgICAgcGxvdDogcGxvdFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGhlbHA6IGZ1bmN0aW9uIChwbG90KSB7XG4gICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkhlbHBUb29sKHtcbiAgICAgICAgICAgIHBsb3Q6IHBsb3RcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbl93aXRoX2RlZmF1bHQgPSBmdW5jdGlvbiAodmFsdWUsIGRlZmF1bHRfdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdF92YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59O1xuZXhwb3J0cy5GaWd1cmUgPSAoZnVuY3Rpb24gKHN1cGVyQ2xhc3MpIHtcbiAgICBleHRlbmQoRmlndXJlLCBzdXBlckNsYXNzKTtcbiAgICBmdW5jdGlvbiBGaWd1cmUoYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgYXR0cnMsIHJlZiwgcmVmMSwgcmVmMiwgcmVmMywgcmVmNCwgcmVmNSwgdG9vbHMsIHhfYXhpc19sYWJlbCwgeF9heGlzX2xvY2F0aW9uLCB4X2F4aXNfdHlwZSwgeF9taW5vcl90aWNrcywgeV9heGlzX2xhYmVsLCB5X2F4aXNfbG9jYXRpb24sIHlfYXhpc190eXBlLCB5X21pbm9yX3RpY2tzO1xuICAgICAgICBpZiAoYXR0cmlidXRlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGF0dHJzID0gXy5jbG9uZShhdHRyaWJ1dGVzKTtcbiAgICAgICAgdG9vbHMgPSBfd2l0aF9kZWZhdWx0KGF0dHJzLnRvb2xzLCBfZGVmYXVsdF90b29scyk7XG4gICAgICAgIGRlbGV0ZSBhdHRycy50b29scztcbiAgICAgICAgYXR0cnMueF9yYW5nZSA9IHRoaXMuX2dldF9yYW5nZShhdHRycy54X3JhbmdlKTtcbiAgICAgICAgYXR0cnMueV9yYW5nZSA9IHRoaXMuX2dldF9yYW5nZShhdHRycy55X3JhbmdlKTtcbiAgICAgICAgeF9heGlzX3R5cGUgPSBfLmlzVW5kZWZpbmVkKGF0dHJzLnhfYXhpc190eXBlKSA/IFwiYXV0b1wiIDogYXR0cnMueF9heGlzX3R5cGU7XG4gICAgICAgIHlfYXhpc190eXBlID0gXy5pc1VuZGVmaW5lZChhdHRycy55X2F4aXNfdHlwZSkgPyBcImF1dG9cIiA6IGF0dHJzLnlfYXhpc190eXBlO1xuICAgICAgICBkZWxldGUgYXR0cnMueF9heGlzX3R5cGU7XG4gICAgICAgIGRlbGV0ZSBhdHRycy55X2F4aXNfdHlwZTtcbiAgICAgICAgeF9taW5vcl90aWNrcyA9IChyZWYgPSBhdHRycy54X21pbm9yX3RpY2tzKSAhPSBudWxsID8gcmVmIDogXCJhdXRvXCI7XG4gICAgICAgIHlfbWlub3JfdGlja3MgPSAocmVmMSA9IGF0dHJzLnlfbWlub3JfdGlja3MpICE9IG51bGwgPyByZWYxIDogXCJhdXRvXCI7XG4gICAgICAgIGRlbGV0ZSBhdHRycy54X21pbm9yX3RpY2tzO1xuICAgICAgICBkZWxldGUgYXR0cnMueV9taW5vcl90aWNrcztcbiAgICAgICAgeF9heGlzX2xvY2F0aW9uID0gKHJlZjIgPSBhdHRycy54X2F4aXNfbG9jYXRpb24pICE9IG51bGwgPyByZWYyIDogXCJiZWxvd1wiO1xuICAgICAgICB5X2F4aXNfbG9jYXRpb24gPSAocmVmMyA9IGF0dHJzLnlfYXhpc19sb2NhdGlvbikgIT0gbnVsbCA/IHJlZjMgOiBcImxlZnRcIjtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnhfYXhpc19sb2NhdGlvbjtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnlfYXhpc19sb2NhdGlvbjtcbiAgICAgICAgeF9heGlzX2xhYmVsID0gKHJlZjQgPSBhdHRycy54X2F4aXNfbGFiZWwpICE9IG51bGwgPyByZWY0IDogXCJcIjtcbiAgICAgICAgeV9heGlzX2xhYmVsID0gKHJlZjUgPSBhdHRycy55X2F4aXNfbGFiZWwpICE9IG51bGwgPyByZWY1IDogXCJcIjtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnhfYXhpc19sYWJlbDtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnlfYXhpc19sYWJlbDtcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKGF0dHJzLndpZHRoKSkge1xuICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQoYXR0cnMucGxvdF93aWR0aCkpIHtcbiAgICAgICAgICAgICAgICBhdHRycy5wbG90X3dpZHRoID0gYXR0cnMud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3RoICd3aWR0aCcgYW5kICdwbG90X3dpZHRoJyBjYW4ndCBiZSBnaXZlbiBhdCB0aGUgc2FtZSB0aW1lXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGF0dHJzLndpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChhdHRycy5oZWlnaHQpKSB7XG4gICAgICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZChhdHRycy5wbG90X2hlaWdodCkpIHtcbiAgICAgICAgICAgICAgICBhdHRycy5wbG90X2hlaWdodCA9IGF0dHJzLmhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJvdGggJ2hlaWdodCcgYW5kICdwbG90X2hlaWdodCcgY2FuJ3QgYmUgZ2l2ZW4gYXQgdGhlIHNhbWUgdGltZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSBhdHRycy5oZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgRmlndXJlLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGF0dHJzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fcHJvY2Vzc19ndWlkZXMoMCwgeF9heGlzX3R5cGUsIHhfYXhpc19sb2NhdGlvbiwgeF9taW5vcl90aWNrcywgeF9heGlzX2xhYmVsKTtcbiAgICAgICAgdGhpcy5fcHJvY2Vzc19ndWlkZXMoMSwgeV9heGlzX3R5cGUsIHlfYXhpc19sb2NhdGlvbiwgeV9taW5vcl90aWNrcywgeV9heGlzX2xhYmVsKTtcbiAgICAgICAgdGhpcy5hZGRfdG9vbHMuYXBwbHkodGhpcywgdGhpcy5fcHJvY2Vzc190b29scyh0b29scykpO1xuICAgICAgICB0aGlzLl9sZWdlbmQgPSBuZXcgbW9kZWxzLkxlZ2VuZCh7XG4gICAgICAgICAgICBwbG90OiB0aGlzLFxuICAgICAgICAgICAgaXRlbXM6IFtdXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZF9yZW5kZXJlcnModGhpcy5fbGVnZW5kKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZpZ3VyZS5wcm90b3R5cGUsIFwieGdyaWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbmRlcmVycy5maWx0ZXIoZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gciBpbnN0YW5jZW9mIG1vZGVscy5HcmlkICYmIHIuZGltZW5zaW9uID09PSAwO1xuICAgICAgICAgICAgfSlbMF07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRmlndXJlLnByb3RvdHlwZSwgXCJ5Z3JpZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyZXJzLmZpbHRlcihmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiByIGluc3RhbmNlb2YgbW9kZWxzLkdyaWQgJiYgci5kaW1lbnNpb24gPT09IDE7XG4gICAgICAgICAgICB9KVswXTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGaWd1cmUucHJvdG90eXBlLCBcInhheGlzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iZWxvdy5jb25jYXQodGhpcy5hYm92ZSkuZmlsdGVyKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIgaW5zdGFuY2VvZiBtb2RlbHMuQXhpcztcbiAgICAgICAgICAgIH0pWzBdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZpZ3VyZS5wcm90b3R5cGUsIFwieWF4aXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlZnQuY29uY2F0KHRoaXMucmlnaHQpLmZpbHRlcihmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiByIGluc3RhbmNlb2YgbW9kZWxzLkF4aXM7XG4gICAgICAgICAgICB9KVswXTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuYW5udWxhcl93ZWRnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5Bbm51bGFyV2VkZ2UsIFwieCx5LGlubmVyX3JhZGl1cyxvdXRlcl9yYWRpdXMsc3RhcnRfYW5nbGUsZW5kX2FuZ2xlXCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5hbm51bHVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x5cGgobW9kZWxzLkFubnVsdXMsIFwieCx5LGlubmVyX3JhZGl1cyxvdXRlcl9yYWRpdXNcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmFyYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5BcmMsIFwieCx5LHJhZGl1cyxzdGFydF9hbmdsZSxlbmRfYW5nbGVcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmJlemllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5CZXppZXIsIFwieDAseTAseDEseTEsY3gwLGN5MCxjeDEsY3kxXCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuQ2lyY2xlLCBcIngseVwiLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuZWxsaXBzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5FbGxpcHNlLCBcIngseSx3aWR0aCxoZWlnaHRcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x5cGgobW9kZWxzLkltYWdlLCBcImNvbG9yX21hcHBlcixpbWFnZSxyb3dzLGNvbHMseCx5LGR3LGRoXCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5pbWFnZV9yZ2JhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x5cGgobW9kZWxzLkltYWdlUkdCQSwgXCJpbWFnZSxyb3dzLGNvbHMseCx5LGR3LGRoXCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5pbWFnZV91cmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuSW1hZ2VVUkwsIFwidXJsLHgseSx3LGhcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuTGluZSwgXCJ4LHlcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLm11bHRpX2xpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuTXVsdGlMaW5lLCBcInhzLHlzXCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5vdmFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x5cGgobW9kZWxzLk92YWwsIFwieCx5LHdpZHRoLGhlaWdodFwiLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUucGF0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuUGF0Y2gsIFwieCx5XCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5wYXRjaGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2x5cGgobW9kZWxzLlBhdGNoZXMsIFwieHMseXNcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLnF1YWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuUXVhZCwgXCJsZWZ0LHJpZ2h0LGJvdHRvbSx0b3BcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLnF1YWRyYXRpYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5RdWFkcmF0aWMsIFwieDAseTAseDEseTEsY3gsY3lcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5SYXksIFwieCx5LGxlbmd0aFwiLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUucmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5SZWN0LCBcIngseSx3aWR0aCxoZWlnaHRcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLnNlZ21lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9nbHlwaChtb2RlbHMuU2VnbWVudCwgXCJ4MCx5MCx4MSx5MVwiLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUudGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5UZXh0LCBcIngseSx0ZXh0XCIsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS53ZWRnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKG1vZGVscy5XZWRnZSwgXCJ4LHkscmFkaXVzLHN0YXJ0X2FuZ2xlLGVuZF9hbmdsZVwiLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuYXN0ZXJpc2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIobW9kZWxzLkFzdGVyaXNrLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuY2lyY2xlX2Nyb3NzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyKG1vZGVscy5DaXJjbGVDcm9zcywgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmNpcmNsZV94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyKG1vZGVscy5DaXJjbGVYLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIobW9kZWxzLkNyb3NzLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuZGlhbW9uZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlcihtb2RlbHMuRGlhbW9uZCwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmRpYW1vbmRfY3Jvc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIobW9kZWxzLkRpYW1vbmRDcm9zcywgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLmludmVydGVkX3RyaWFuZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyKG1vZGVscy5JbnZlcnRlZFRyaWFuZ2xlLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyKG1vZGVscy5TcXVhcmUsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5zcXVhcmVfY3Jvc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIobW9kZWxzLlNxdWFyZUNyb3NzLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuc3F1YXJlX3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIobW9kZWxzLlNxdWFyZVgsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS50cmlhbmdsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlcihtb2RlbHMuVHJpYW5nbGUsIGFyZ3MpO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS54ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyKG1vZGVscy5YLCBhcmdzKTtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX3ZlY3RvcmFibGUgPSBbXCJmaWxsX2NvbG9yXCIsIFwiZmlsbF9hbHBoYVwiLCBcImxpbmVfY29sb3JcIiwgXCJsaW5lX2FscGhhXCIsIFwibGluZV93aWR0aFwiLCBcInRleHRfY29sb3JcIiwgXCJ0ZXh0X2FscGhhXCIsIFwidGV4dF9mb250X3NpemVcIl07XG4gICAgRmlndXJlLnByb3RvdHlwZS5fZGVmYXVsdF9jb2xvciA9IFwiIzFmNzdiNFwiO1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX2RlZmF1bHRfYWxwaGEgPSAxLjA7XG4gICAgRmlndXJlLnByb3RvdHlwZS5fcG9wX2NvbG9yc19hbmRfYWxwaGEgPSBmdW5jdGlvbiAoY2xzLCBhdHRycywgcHJlZml4LCBkZWZhdWx0X2NvbG9yLCBkZWZhdWx0X2FscGhhKSB7XG4gICAgICAgIHZhciBfdXBkYXRlX3dpdGgsIGFscGhhLCBjb2xvciwgcmVzdWx0O1xuICAgICAgICBpZiAocHJlZml4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHByZWZpeCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZmF1bHRfY29sb3IgPT0gbnVsbCkge1xuICAgICAgICAgICAgZGVmYXVsdF9jb2xvciA9IHRoaXMuX2RlZmF1bHRfY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZmF1bHRfYWxwaGEgPT0gbnVsbCkge1xuICAgICAgICAgICAgZGVmYXVsdF9hbHBoYSA9IHRoaXMuX2RlZmF1bHRfYWxwaGE7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgIGNvbG9yID0gX3dpdGhfZGVmYXVsdChhdHRyc1twcmVmaXggKyBcImNvbG9yXCJdLCBkZWZhdWx0X2NvbG9yKTtcbiAgICAgICAgYWxwaGEgPSBfd2l0aF9kZWZhdWx0KGF0dHJzW3ByZWZpeCArIFwiYWxwaGFcIl0sIGRlZmF1bHRfYWxwaGEpO1xuICAgICAgICBkZWxldGUgYXR0cnNbcHJlZml4ICsgXCJjb2xvclwiXTtcbiAgICAgICAgZGVsZXRlIGF0dHJzW3ByZWZpeCArIFwiYWxwaGFcIl07XG4gICAgICAgIF91cGRhdGVfd2l0aCA9IGZ1bmN0aW9uIChuYW1lLCBkZWZhdWx0X3ZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoY2xzLnByb3RvdHlwZS5wcm9wc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gX3dpdGhfZGVmYXVsdChhdHRyc1twcmVmaXggKyBuYW1lXSwgZGVmYXVsdF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZSBhdHRyc1twcmVmaXggKyBuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgX3VwZGF0ZV93aXRoKFwiZmlsbF9jb2xvclwiLCBjb2xvcik7XG4gICAgICAgIF91cGRhdGVfd2l0aChcImxpbmVfY29sb3JcIiwgY29sb3IpO1xuICAgICAgICBfdXBkYXRlX3dpdGgoXCJ0ZXh0X2NvbG9yXCIsIFwiYmxhY2tcIik7XG4gICAgICAgIF91cGRhdGVfd2l0aChcImZpbGxfYWxwaGFcIiwgYWxwaGEpO1xuICAgICAgICBfdXBkYXRlX3dpdGgoXCJsaW5lX2FscGhhXCIsIGFscGhhKTtcbiAgICAgICAgX3VwZGF0ZV93aXRoKFwidGV4dF9hbHBoYVwiLCBhbHBoYSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLl9maW5kX3VuaXFfbmFtZSA9IGZ1bmN0aW9uIChkYXRhLCBuYW1lKSB7XG4gICAgICAgIHZhciBpLCBuZXdfbmFtZTtcbiAgICAgICAgaSA9IDE7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBuZXdfbmFtZSA9IG5hbWUgKyBcIl9fXCIgKyBpO1xuICAgICAgICAgICAgaWYgKGRhdGFbbmV3X25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3X25hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX2ZpeHVwX3ZhbHVlcyA9IGZ1bmN0aW9uIChjbHMsIGRhdGEsIGF0dHJzKSB7XG4gICAgICAgIHZhciBuYW1lLCByZXN1bHRzLCB2YWx1ZTtcbiAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKG5hbWUgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYXR0cnNbbmFtZV07XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkLCBwcm9wO1xuICAgICAgICAgICAgICAgICAgICBwcm9wID0gY2xzLnByb3RvdHlwZS5wcm9wc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AudHlwZS5wcm90b3R5cGUuZGF0YXNwZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW25hbWVdICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZCA9IF90aGlzLl9maW5kX3VuaXFfbmFtZShkYXRhLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZCA9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyc1tuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogZmllbGRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXy5pc051bWJlcih2YWx1ZSkgfHwgXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyc1tuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkodGhpcykobmFtZSwgdmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX2dseXBoID0gZnVuY3Rpb24gKGNscywgcGFyYW1zLCBhcmdzKSB7XG4gICAgICAgIHZhciBfbWFrZV9nbHlwaCwgYXR0cnMsIGRhdGEsIGZuLCBnbHlwaCwgZ2x5cGhfY2EsIGdseXBoX3JlbmRlcmVyLCBoYXNfaGdseXBoLCBoYXNfc2dseXBoLCBoZ2x5cGgsIGhnbHlwaF9jYSwgaSwgaiwgaywgbGVnZW5kLCBsZW4sIG5zZ2x5cGgsIG5zZ2x5cGhfY2EsIG9wdHMsIHBhcmFtLCByZWYsIHJlZjEsIHNnbHlwaCwgc2dseXBoX2NhLCBzb3VyY2U7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcy5zcGxpdChcIixcIik7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgYXR0cnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgYXR0cnMgPSBfLmNsb25lKGF0dHJzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlZiA9IGFyZ3MsIGFyZ3MgPSAyIDw9IHJlZi5sZW5ndGggPyBzbGljZS5jYWxsKHJlZiwgMCwgaiA9IHJlZi5sZW5ndGggLSAxKSA6IChqID0gMCwgW10pLCBvcHRzID0gcmVmW2orK107XG4gICAgICAgICAgICBhdHRycyA9IF8uY2xvbmUob3B0cyk7XG4gICAgICAgICAgICBmbiA9IGZ1bmN0aW9uIChwYXJhbSwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdHRyc1twYXJhbV0gPSBhcmdzW2ldO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAoaSA9IGsgPSAwLCBsZW4gPSBwYXJhbXMubGVuZ3RoOyBrIDwgbGVuOyBpID0gKytrKSB7XG4gICAgICAgICAgICAgICAgcGFyYW0gPSBwYXJhbXNbaV07XG4gICAgICAgICAgICAgICAgZm4ocGFyYW0sIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxlZ2VuZCA9IHRoaXMuX3Byb2Nlc3NfbGVnZW5kKGF0dHJzLmxlZ2VuZCwgYXR0cnMuc291cmNlKTtcbiAgICAgICAgZGVsZXRlIGF0dHJzLmxlZ2VuZDtcbiAgICAgICAgaGFzX3NnbHlwaCA9IF8uYW55KF8ua2V5cyhhdHRycyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdfMS5zdGFydHNXaXRoKGtleSwgXCJzZWxlY3Rpb25fXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgaGFzX2hnbHlwaCA9IF8uYW55KF8ua2V5cyhhdHRycyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdfMS5zdGFydHNXaXRoKGtleSwgXCJob3Zlcl9cIik7XG4gICAgICAgIH0pO1xuICAgICAgICBnbHlwaF9jYSA9IHRoaXMuX3BvcF9jb2xvcnNfYW5kX2FscGhhKGNscywgYXR0cnMpO1xuICAgICAgICBuc2dseXBoX2NhID0gdGhpcy5fcG9wX2NvbG9yc19hbmRfYWxwaGEoY2xzLCBhdHRycywgXCJub25zZWxlY3Rpb25fXCIsIHZvaWQgMCwgMC4xKTtcbiAgICAgICAgc2dseXBoX2NhID0gaGFzX3NnbHlwaCA/IHRoaXMuX3BvcF9jb2xvcnNfYW5kX2FscGhhKGNscywgYXR0cnMsIFwic2VsZWN0aW9uX1wiKSA6IHt9O1xuICAgICAgICBoZ2x5cGhfY2EgPSBoYXNfaGdseXBoID8gdGhpcy5fcG9wX2NvbG9yc19hbmRfYWxwaGEoY2xzLCBhdHRycywgXCJob3Zlcl9cIikgOiB7fTtcbiAgICAgICAgc291cmNlID0gKHJlZjEgPSBhdHRycy5zb3VyY2UpICE9IG51bGwgPyByZWYxIDogbmV3IG1vZGVscy5Db2x1bW5EYXRhU291cmNlKCk7XG4gICAgICAgIGRhdGEgPSBfLmNsb25lKHNvdXJjZS5kYXRhKTtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnNvdXJjZTtcbiAgICAgICAgdGhpcy5fZml4dXBfdmFsdWVzKGNscywgZGF0YSwgZ2x5cGhfY2EpO1xuICAgICAgICB0aGlzLl9maXh1cF92YWx1ZXMoY2xzLCBkYXRhLCBuc2dseXBoX2NhKTtcbiAgICAgICAgdGhpcy5fZml4dXBfdmFsdWVzKGNscywgZGF0YSwgc2dseXBoX2NhKTtcbiAgICAgICAgdGhpcy5fZml4dXBfdmFsdWVzKGNscywgZGF0YSwgaGdseXBoX2NhKTtcbiAgICAgICAgdGhpcy5fZml4dXBfdmFsdWVzKGNscywgZGF0YSwgYXR0cnMpO1xuICAgICAgICBzb3VyY2UuZGF0YSA9IGRhdGE7XG4gICAgICAgIF9tYWtlX2dseXBoID0gKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjbHMsIGF0dHJzLCBleHRyYV9hdHRycykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY2xzKF8uZXh0ZW5kKHt9LCBhdHRycywgZXh0cmFfYXR0cnMpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgICBnbHlwaCA9IF9tYWtlX2dseXBoKGNscywgYXR0cnMsIGdseXBoX2NhKTtcbiAgICAgICAgbnNnbHlwaCA9IF9tYWtlX2dseXBoKGNscywgYXR0cnMsIG5zZ2x5cGhfY2EpO1xuICAgICAgICBzZ2x5cGggPSBoYXNfc2dseXBoID8gX21ha2VfZ2x5cGgoY2xzLCBhdHRycywgc2dseXBoX2NhKSA6IG51bGw7XG4gICAgICAgIGhnbHlwaCA9IGhhc19oZ2x5cGggPyBfbWFrZV9nbHlwaChjbHMsIGF0dHJzLCBoZ2x5cGhfY2EpIDogbnVsbDtcbiAgICAgICAgZ2x5cGhfcmVuZGVyZXIgPSBuZXcgbW9kZWxzLkdseXBoUmVuZGVyZXIoe1xuICAgICAgICAgICAgZGF0YV9zb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgIGdseXBoOiBnbHlwaCxcbiAgICAgICAgICAgIG5vbnNlbGVjdGlvbl9nbHlwaDogbnNnbHlwaCxcbiAgICAgICAgICAgIHNlbGVjdGlvbl9nbHlwaDogc2dseXBoLFxuICAgICAgICAgICAgaG92ZXJfZ2x5cGg6IGhnbHlwaFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGxlZ2VuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVfbGVnZW5kKGxlZ2VuZCwgZ2x5cGhfcmVuZGVyZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkX3JlbmRlcmVycyhnbHlwaF9yZW5kZXJlcik7XG4gICAgICAgIHJldHVybiBnbHlwaF9yZW5kZXJlcjtcbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX21hcmtlciA9IGZ1bmN0aW9uIChjbHMsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dseXBoKGNscywgXCJ4LHlcIiwgYXJncyk7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLl9nZXRfcmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgICAgICAgaWYgKHJhbmdlID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbW9kZWxzLkRhdGFSYW5nZTFkKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJhbmdlIGluc3RhbmNlb2YgbW9kZWxzLlJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNBcnJheShyYW5nZSkpIHtcbiAgICAgICAgICAgIGlmIChfLmFsbChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHZhciBqLCBsZW4sIHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbiA9IHJhbmdlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSByYW5nZVtqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKF8uaXNTdHJpbmcoeCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuRmFjdG9yUmFuZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBmYWN0b3JzOiByYW5nZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJhbmdlLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgbW9kZWxzLlJhbmdlMWQoe1xuICAgICAgICAgICAgICAgICAgICBzdGFydDogcmFuZ2VbMF0sXG4gICAgICAgICAgICAgICAgICAgIGVuZDogcmFuZ2VbMV1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5fcHJvY2Vzc19ndWlkZXMgPSBmdW5jdGlvbiAoZGltLCBheGlzX3R5cGUsIGF4aXNfbG9jYXRpb24sIG1pbm9yX3RpY2tzLCBheGlzX2xhYmVsKSB7XG4gICAgICAgIHZhciBheGlzLCBheGlzY2xzLCBncmlkLCByYW5nZTtcbiAgICAgICAgcmFuZ2UgPSBkaW0gPT09IDAgPyB0aGlzLnhfcmFuZ2UgOiB0aGlzLnlfcmFuZ2U7XG4gICAgICAgIGF4aXNjbHMgPSB0aGlzLl9nZXRfYXhpc19jbGFzcyhheGlzX3R5cGUsIHJhbmdlKTtcbiAgICAgICAgaWYgKGF4aXNjbHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGF4aXNjbHMgPT09IG1vZGVscy5Mb2dBeGlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpbSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnhfbWFwcGVyX3R5cGUgPSAnbG9nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMueV9tYXBwZXJfdHlwZSA9ICdsb2cnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF4aXMgPSBuZXcgYXhpc2NscygpO1xuICAgICAgICAgICAgaWYgKGF4aXMudGlja2VyIGluc3RhbmNlb2YgbW9kZWxzLkNvbnRpbnVvdXNUaWNrZXIpIHtcbiAgICAgICAgICAgICAgICBheGlzLnRpY2tlci5udW1fbWlub3JfdGlja3MgPSB0aGlzLl9nZXRfbnVtX21pbm9yX3RpY2tzKGF4aXNjbHMsIG1pbm9yX3RpY2tzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChheGlzX2xhYmVsLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGF4aXMuYXhpc19sYWJlbCA9IGF4aXNfbGFiZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncmlkID0gbmV3IG1vZGVscy5HcmlkKHtcbiAgICAgICAgICAgICAgICBkaW1lbnNpb246IGRpbSxcbiAgICAgICAgICAgICAgICB0aWNrZXI6IGF4aXMudGlja2VyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuYWRkX2xheW91dChheGlzLCBheGlzX2xvY2F0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZF9sYXlvdXQoZ3JpZCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpZ3VyZS5wcm90b3R5cGUuX2dldF9heGlzX2NsYXNzID0gZnVuY3Rpb24gKGF4aXNfdHlwZSwgcmFuZ2UpIHtcbiAgICAgICAgaWYgKGF4aXNfdHlwZSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXhpc190eXBlID09PSBcImxpbmVhclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxzLkxpbmVhckF4aXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF4aXNfdHlwZSA9PT0gXCJsb2dcIikge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGVscy5Mb2dBeGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChheGlzX3R5cGUgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGVscy5EYXRldGltZUF4aXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF4aXNfdHlwZSA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgIGlmIChyYW5nZSBpbnN0YW5jZW9mIG1vZGVscy5GYWN0b3JSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbHMuQ2F0ZWdvcmljYWxBeGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVscy5MaW5lYXJBeGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLl9nZXRfbnVtX21pbm9yX3RpY2tzID0gZnVuY3Rpb24gKGF4aXNfY2xhc3MsIG51bV9taW5vcl90aWNrcykge1xuICAgICAgICBpZiAoXy5pc051bWJlcihudW1fbWlub3JfdGlja3MpKSB7XG4gICAgICAgICAgICBpZiAobnVtX21pbm9yX3RpY2tzIDw9IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudW1fbWlub3JfdGlja3MgbXVzdCBiZSA+IDFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVtX21pbm9yX3RpY2tzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChudW1fbWlub3JfdGlja3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG51bV9taW5vcl90aWNrcyA9PT0gJ2F1dG8nKSB7XG4gICAgICAgICAgICBpZiAoYXhpc19jbGFzcyA9PT0gbW9kZWxzLkxvZ0F4aXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gNTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5fcHJvY2Vzc190b29scyA9IGZ1bmN0aW9uICh0b29scykge1xuICAgICAgICB2YXIgb2JqcywgdG9vbDtcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodG9vbHMpKSB7XG4gICAgICAgICAgICB0b29scyA9IHRvb2xzLnNwbGl0KC9cXHMqLFxccyovKTtcbiAgICAgICAgfVxuICAgICAgICBvYmpzID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBqLCBsZW4sIHJlc3VsdHM7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4gPSB0b29scy5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgIHRvb2wgPSB0b29sc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoXy5pc1N0cmluZyh0b29sKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goX2tub3duX3Rvb2xzW3Rvb2xdKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0b29sKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIG9ianM7XG4gICAgfTtcbiAgICBGaWd1cmUucHJvdG90eXBlLl9wcm9jZXNzX2xlZ2VuZCA9IGZ1bmN0aW9uIChsZWdlbmQsIHNvdXJjZSkge1xuICAgICAgICB2YXIgbGVnZW5kX2l0ZW1fbGFiZWw7XG4gICAgICAgIGxlZ2VuZF9pdGVtX2xhYmVsID0gbnVsbDtcbiAgICAgICAgaWYgKGxlZ2VuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoXy5pc1N0cmluZyhsZWdlbmQpKSB7XG4gICAgICAgICAgICAgICAgbGVnZW5kX2l0ZW1fbGFiZWwgPSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsZWdlbmRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICgoc291cmNlICE9IG51bGwpICYmIChzb3VyY2UuY29sdW1uX25hbWVzICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE9mLmNhbGwoc291cmNlLmNvbHVtbl9uYW1lcywgbGVnZW5kKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWdlbmRfaXRlbV9sYWJlbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogbGVnZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGVnZW5kX2l0ZW1fbGFiZWwgPSBsZWdlbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxlZ2VuZF9pdGVtX2xhYmVsO1xuICAgIH07XG4gICAgRmlndXJlLnByb3RvdHlwZS5fdXBkYXRlX2xlZ2VuZCA9IGZ1bmN0aW9uIChsZWdlbmRfaXRlbV9sYWJlbCwgZ2x5cGhfcmVuZGVyZXIpIHtcbiAgICAgICAgdmFyIGFkZGVkLCBpdGVtLCBqLCBsZW4sIG5ld19pdGVtLCByZWY7XG4gICAgICAgIGFkZGVkID0gZmFsc2U7XG4gICAgICAgIHJlZiA9IHRoaXMuX2xlZ2VuZC5pdGVtcztcbiAgICAgICAgZm9yIChqID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBpdGVtID0gcmVmW2pdO1xuICAgICAgICAgICAgaWYgKF8uaXNFcXVhbChpdGVtLmxhYmVsLCBsZWdlbmRfaXRlbV9sYWJlbCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5sYWJlbC52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVuZGVyZXJzLnB1c2goZ2x5cGhfcmVuZGVyZXIpO1xuICAgICAgICAgICAgICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKGl0ZW0ubGFiZWwuZmllbGQgIT0gbnVsbCkgJiYgZ2x5cGhfcmVuZGVyZXIuZGF0YV9zb3VyY2UgPT09IGl0ZW0ucmVuZGVyZXJzWzBdLmRhdGFfc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVuZGVyZXJzLnB1c2goZ2x5cGhfcmVuZGVyZXIpO1xuICAgICAgICAgICAgICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFkZGVkKSB7XG4gICAgICAgICAgICBuZXdfaXRlbSA9IG5ldyBtb2RlbHMuTGVnZW5kSXRlbSh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGxlZ2VuZF9pdGVtX2xhYmVsLFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyczogW2dseXBoX3JlbmRlcmVyXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGVnZW5kLml0ZW1zLnB1c2gobmV3X2l0ZW0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gRmlndXJlO1xufSkobW9kZWxzLlBsb3QpO1xuZXhwb3J0cy5maWd1cmUgPSBmdW5jdGlvbiAoYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgIGlmIChhdHRyaWJ1dGVzID09IG51bGwpIHtcbiAgICAgICAgYXR0cmlidXRlcyA9IHt9O1xuICAgIH1cbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBleHBvcnRzLkZpZ3VyZShhdHRyaWJ1dGVzLCBvcHRpb25zKTtcbn07XG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiAob2JqLCB0YXJnZXQpIHtcbiAgICB2YXIgX29iaiwgZGl2LCBkb2MsIGosIGxlbiwgbXVsdGlwbGUsIHZpZXdzO1xuICAgIG11bHRpcGxlID0gXy5pc0FycmF5KG9iaik7XG4gICAgZG9jID0gbmV3IGRvY3VtZW50XzEuRG9jdW1lbnQoKTtcbiAgICBpZiAoIW11bHRpcGxlKSB7XG4gICAgICAgIGRvYy5hZGRfcm9vdChvYmopO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gMCwgbGVuID0gb2JqLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBfb2JqID0gb2JqW2pdO1xuICAgICAgICAgICAgZG9jLmFkZF9yb290KF9vYmopO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpdiA9ICQoXCI8ZGl2IGNsYXNzPVwiICsgZW1iZWRfMS5CT0tFSF9ST09UICsgXCI+XCIpO1xuICAgICQodGFyZ2V0ICE9IG51bGwgPyB0YXJnZXQgOiBcImJvZHlcIikuYXBwZW5kKGRpdik7XG4gICAgdmlld3MgPSBlbWJlZC5hZGRfZG9jdW1lbnRfc3RhbmRhbG9uZShkb2MsIGRpdik7XG4gICAgaWYgKCFtdWx0aXBsZSkge1xuICAgICAgICByZXR1cm4gdmlld3Nbb2JqLmlkXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB2aWV3cztcbiAgICB9XG59O1xuZXhwb3J0cy5jb2xvciA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIHNwcmludGYoXCIjJTAyeCUwMnglMDJ4XCIsIHIsIGcsIGIpO1xufTtcbmV4cG9ydHMuZ3JpZHBsb3QgPSBmdW5jdGlvbiAoY2hpbGRyZW4sIG9wdGlvbnMpIHtcbiAgICB2YXIgZ3JpZCwgaXRlbSwgaiwgaywgbCwgbGF5b3V0LCBsZW4sIGxlbjEsIGxlbjIsIG5laWdoYm9yLCByb3csIHJvd19jaGlsZHJlbiwgcm93X3Rvb2xzLCByb3dzLCBzaXppbmdfbW9kZSwgdG9vbGJhciwgdG9vbGJhcl9sb2NhdGlvbiwgdG9vbGJhcl9zaXppbmdfbW9kZSwgdG9vbHM7XG4gICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHRvb2xiYXJfbG9jYXRpb24gPSBfLmlzVW5kZWZpbmVkKG9wdGlvbnMudG9vbGJhcl9sb2NhdGlvbikgPyAnYWJvdmUnIDogb3B0aW9ucy50b29sYmFyX2xvY2F0aW9uO1xuICAgIHNpemluZ19tb2RlID0gXy5pc1VuZGVmaW5lZChvcHRpb25zLnNpemluZ19tb2RlKSA/ICdmaXhlZCcgOiBvcHRpb25zLnNpemluZ19tb2RlO1xuICAgIHRvb2xiYXJfc2l6aW5nX21vZGUgPSBvcHRpb25zLnNpemluZ19tb2RlID09PSAnZml4ZWQnID8gJ3NjYWxlX3dpZHRoJyA6IHNpemluZ19tb2RlO1xuICAgIHRvb2xzID0gW107XG4gICAgcm93cyA9IFtdO1xuICAgIGZvciAoaiA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgIHJvdyA9IGNoaWxkcmVuW2pdO1xuICAgICAgICByb3dfdG9vbHMgPSBbXTtcbiAgICAgICAgcm93X2NoaWxkcmVuID0gW107XG4gICAgICAgIGZvciAoayA9IDAsIGxlbjEgPSByb3cubGVuZ3RoOyBrIDwgbGVuMTsgaysrKSB7XG4gICAgICAgICAgICBpdGVtID0gcm93W2tdO1xuICAgICAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBtb2RlbHMuUGxvdCkge1xuICAgICAgICAgICAgICAgIHJvd190b29scyA9IHJvd190b29scy5jb25jYXQoaXRlbS50b29sYmFyLnRvb2xzKTtcbiAgICAgICAgICAgICAgICBpdGVtLnRvb2xiYXJfbG9jYXRpb24gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGwgPSAwLCBsZW4yID0gcm93Lmxlbmd0aDsgbCA8IGxlbjI7IGwrKykge1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvciA9IHJvd1tsXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yIGluc3RhbmNlb2YgbW9kZWxzLlBsb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0gPSBuZXcgbW9kZWxzLlNwYWNlcih7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBuZWlnaGJvci5wbG90X3dpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG5laWdoYm9yLnBsb3RfaGVpZ2h0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIG1vZGVscy5MYXlvdXRET00pIHtcbiAgICAgICAgICAgICAgICBpdGVtLnNpemluZ19tb2RlID0gc2l6aW5nX21vZGU7XG4gICAgICAgICAgICAgICAgcm93X2NoaWxkcmVuLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IExheW91dERPTSBpdGVtcyBjYW4gYmUgaW5zZXJ0ZWQgaW50byBHcmlkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRvb2xzID0gdG9vbHMuY29uY2F0KHJvd190b29scyk7XG4gICAgICAgIHJvdyA9IG5ldyBtb2RlbHMuUm93KHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiByb3dfY2hpbGRyZW4sXG4gICAgICAgICAgICBzaXppbmdfbW9kZTogc2l6aW5nX21vZGVcbiAgICAgICAgfSk7XG4gICAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgIH1cbiAgICBncmlkID0gbmV3IG1vZGVscy5Db2x1bW4oe1xuICAgICAgICBjaGlsZHJlbjogcm93cyxcbiAgICAgICAgc2l6aW5nX21vZGU6IHNpemluZ19tb2RlXG4gICAgfSk7XG4gICAgbGF5b3V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRvb2xiYXJfbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRvb2xiYXIgPSBuZXcgbW9kZWxzLlRvb2xiYXJCb3goe1xuICAgICAgICAgICAgICAgIHRvb2xzOiB0b29scyxcbiAgICAgICAgICAgICAgICBzaXppbmdfbW9kZTogdG9vbGJhcl9zaXppbmdfbW9kZSxcbiAgICAgICAgICAgICAgICB0b29sYmFyX2xvY2F0aW9uOiB0b29sYmFyX2xvY2F0aW9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbGJhcl9sb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Fib3ZlJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuQ29sdW1uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbdG9vbGJhciwgZ3JpZF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXppbmdfbW9kZTogc2l6aW5nX21vZGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVsb3cnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5Db2x1bW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtncmlkLCB0b29sYmFyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemluZ19tb2RlOiBzaXppbmdfbW9kZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBtb2RlbHMuUm93KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbdG9vbGJhciwgZ3JpZF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXppbmdfbW9kZTogc2l6aW5nX21vZGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IG1vZGVscy5Sb3coe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtncmlkLCB0b29sYmFyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemluZ19tb2RlOiBzaXppbmdfbW9kZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBncmlkO1xuICAgICAgICB9XG4gICAgfSkoKTtcbiAgICByZXR1cm4gbGF5b3V0O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuZXhwb3J0cy5zdGFydHNXaXRoID0gZnVuY3Rpb24gKHN0ciwgc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgIGlmIChwb3NpdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIHBvc2l0aW9uID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHN0ci5zdWJzdHIocG9zaXRpb24sIHNlYXJjaFN0cmluZy5sZW5ndGgpID09PSBzZWFyY2hTdHJpbmc7XG59O1xuIl19