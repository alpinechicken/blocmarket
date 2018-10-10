"use strict";
var extend = function (child, parent) { for (var key in parent) {
    if (hasProp.call(parent, key))
        child[key] = parent[key];
} function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }, hasProp = {}.hasOwnProperty;
var logging_1 = require("../../core/logging");
var gmap_plot_canvas_1 = require("./gmap_plot_canvas");
var plot_1 = require("./plot");
var p = require("../../core/properties");
exports.GMapPlotView = (function (superClass) {
    extend(GMapPlotView, superClass);
    function GMapPlotView() {
        return GMapPlotView.__super__.constructor.apply(this, arguments);
    }
    return GMapPlotView;
})(plot_1.PlotView);
exports.GMapPlot = (function (superClass) {
    extend(GMapPlot, superClass);
    function GMapPlot() {
        return GMapPlot.__super__.constructor.apply(this, arguments);
    }
    GMapPlot.prototype.type = 'GMapPlot';
    GMapPlot.prototype.default_view = exports.GMapPlotView;
    GMapPlot.prototype.initialize = function (options) {
        GMapPlot.__super__.initialize.call(this, options);
        if (!this.api_key) {
            logging_1.logger.error("api_key is required. See https://developers.google.com/maps/documentation/javascript/get-api-key for more information on how to obtain your own.");
        }
        this._plot_canvas = new gmap_plot_canvas_1.GMapPlotCanvas({
            plot: this
        });
        return this.plot_canvas.toolbar = this.toolbar;
    };
    GMapPlot.define({
        map_options: [p.Any],
        api_key: [p.String]
    });
    return GMapPlot;
})(plot_1.Plot);
