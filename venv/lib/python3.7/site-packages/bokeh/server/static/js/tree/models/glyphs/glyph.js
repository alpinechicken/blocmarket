"use strict";
var extend = function (child, parent) { for (var key in parent) {
    if (hasProp.call(parent, key))
        child[key] = parent[key];
} function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }, hasProp = {}.hasOwnProperty;
var _ = require("underscore");
var rbush = require("rbush");
var categorical_mapper_1 = require("../mappers/categorical_mapper");
var p = require("../../core/properties");
var bbox = require("../../core/util/bbox");
var proj = require("../../core/util/projections");
var bokeh_view_1 = require("../../core/bokeh_view");
var model_1 = require("../../model");
var visuals_1 = require("../../core/visuals");
var bokehgl = require("./webgl/main");
var logging_1 = require("../../core/logging");
exports.GlyphView = (function (superClass) {
    extend(GlyphView, superClass);
    function GlyphView() {
        return GlyphView.__super__.constructor.apply(this, arguments);
    }
    GlyphView.prototype.initialize = function (options) {
        var Cls, ctx, ref;
        GlyphView.__super__.initialize.call(this, options);
        this._nohit_warned = {};
        this.renderer = options.renderer;
        this.visuals = new visuals_1.Visuals(this.model);
        if (((ref = this.renderer) != null ? ref.plot_view : void 0) != null) {
            ctx = this.renderer.plot_view.canvas_view.ctx;
            if (ctx.glcanvas != null) {
                Cls = bokehgl[this.model.type + 'GLGlyph'];
                if (Cls) {
                    return this.glglyph = new Cls(ctx.glcanvas.gl, this);
                }
            }
        }
    };
    GlyphView.prototype.set_visuals = function (source) {
        this.visuals.warm_cache(source);
        if (this.glglyph != null) {
            return this.glglyph.set_visuals_changed();
        }
    };
    GlyphView.prototype.render = function (ctx, indices, data) {
        if (this.model.visible) {
            ctx.beginPath();
            if (this.glglyph != null) {
                if (this.glglyph.render(ctx, indices, data)) {
                    return;
                }
            }
            this._render(ctx, indices, data);
        }
    };
    GlyphView.prototype.bounds = function () {
        var bb, d;
        if (this.index == null) {
            return bbox.empty();
        }
        d = this.index.data;
        bb = {
            minX: d.minX,
            minY: d.minY,
            maxX: d.maxX,
            maxY: d.maxY
        };
        return this._bounds(bb);
    };
    GlyphView.prototype.log_bounds = function () {
        var bb, j, k, len, len1, positive_x_bbs, positive_y_bbs, x, y;
        if (this.index == null) {
            return bbox.empty();
        }
        bb = bbox.empty();
        positive_x_bbs = this.index.search(bbox.positive_x());
        positive_y_bbs = this.index.search(bbox.positive_y());
        for (j = 0, len = positive_x_bbs.length; j < len; j++) {
            x = positive_x_bbs[j];
            if (x.minX < bb.minX) {
                bb.minX = x.minX;
            }
            if (x.maxX > bb.maxX) {
                bb.maxX = x.maxX;
            }
        }
        for (k = 0, len1 = positive_y_bbs.length; k < len1; k++) {
            y = positive_y_bbs[k];
            if (y.minY < bb.minY) {
                bb.minY = y.minY;
            }
            if (y.maxY > bb.maxY) {
                bb.maxY = y.maxY;
            }
        }
        return this._bounds(bb);
    };
    GlyphView.prototype.max_wh2_bounds = function (bds) {
        return {
            minX: bds.minX - this.max_w2,
            maxX: bds.maxX + this.max_w2,
            minY: bds.minY - this.max_h2,
            maxY: bds.maxY + this.max_h2
        };
    };
    GlyphView.prototype.get_anchor_point = function (anchor, i, arg) {
        var sx, sy;
        sx = arg[0], sy = arg[1];
        switch (anchor) {
            case "center":
                return {
                    x: this.scx(i, sx, sy),
                    y: this.scy(i, sx, sy)
                };
            default:
                return null;
        }
    };
    GlyphView.prototype.scx = function (i) {
        return this.sx[i];
    };
    GlyphView.prototype.scy = function (i) {
        return this.sy[i];
    };
    GlyphView.prototype._xy_index = function () {
        var i, index, j, pts, ref, x, xx, y, yy;
        index = rbush();
        pts = [];
        if (this.renderer.xmapper instanceof categorical_mapper_1.CategoricalMapper) {
            xx = this.renderer.xmapper.v_map_to_target(this._x, true);
        }
        else {
            xx = this._x;
        }
        if (this.renderer.ymapper instanceof categorical_mapper_1.CategoricalMapper) {
            yy = this.renderer.ymapper.v_map_to_target(this._y, true);
        }
        else {
            yy = this._y;
        }
        for (i = j = 0, ref = xx.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            x = xx[i];
            if (isNaN(x) || !isFinite(x)) {
                continue;
            }
            y = yy[i];
            if (isNaN(y) || !isFinite(y)) {
                continue;
            }
            pts.push({
                minX: x,
                minY: y,
                maxX: x,
                maxY: y,
                i: i
            });
        }
        index.load(pts);
        return index;
    };
    GlyphView.prototype.sdist = function (mapper, pts, spans, pts_location, dilate) {
        var d, halfspan, i, pt0, pt1, spt0, spt1;
        if (pts_location == null) {
            pts_location = "edge";
        }
        if (dilate == null) {
            dilate = false;
        }
        if (_.isString(pts[0])) {
            pts = mapper.v_map_to_target(pts);
        }
        if (pts_location === 'center') {
            halfspan = (function () {
                var j, len, results;
                results = [];
                for (j = 0, len = spans.length; j < len; j++) {
                    d = spans[j];
                    results.push(d / 2);
                }
                return results;
            })();
            pt0 = (function () {
                var j, ref, results;
                results = [];
                for (i = j = 0, ref = pts.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                    results.push(pts[i] - halfspan[i]);
                }
                return results;
            })();
            pt1 = (function () {
                var j, ref, results;
                results = [];
                for (i = j = 0, ref = pts.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                    results.push(pts[i] + halfspan[i]);
                }
                return results;
            })();
        }
        else {
            pt0 = pts;
            pt1 = (function () {
                var j, ref, results;
                results = [];
                for (i = j = 0, ref = pt0.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                    results.push(pt0[i] + spans[i]);
                }
                return results;
            })();
        }
        spt0 = mapper.v_map_to_target(pt0);
        spt1 = mapper.v_map_to_target(pt1);
        if (dilate) {
            return (function () {
                var j, ref, results;
                results = [];
                for (i = j = 0, ref = spt0.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                    results.push(Math.ceil(Math.abs(spt1[i] - spt0[i])));
                }
                return results;
            })();
        }
        else {
            return (function () {
                var j, ref, results;
                results = [];
                for (i = j = 0, ref = spt0.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                    results.push(Math.abs(spt1[i] - spt0[i]));
                }
                return results;
            })();
        }
    };
    GlyphView.prototype.draw_legend_for_index = function (ctx, x0, x1, y0, y1, index) {
        return null;
    };
    GlyphView.prototype._generic_line_legend = function (ctx, x0, x1, y0, y1, index) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, (y0 + y1) / 2);
        ctx.lineTo(x1, (y0 + y1) / 2);
        if (this.visuals.line.doit) {
            this.visuals.line.set_vectorize(ctx, index);
            ctx.stroke();
        }
        return ctx.restore();
    };
    GlyphView.prototype._generic_area_legend = function (ctx, x0, x1, y0, y1, index) {
        var dh, dw, h, indices, sx0, sx1, sy0, sy1, w;
        indices = [index];
        w = Math.abs(x1 - x0);
        dw = w * 0.1;
        h = Math.abs(y1 - y0);
        dh = h * 0.1;
        sx0 = x0 + dw;
        sx1 = x1 - dw;
        sy0 = y0 + dh;
        sy1 = y1 - dh;
        if (this.visuals.fill.doit) {
            this.visuals.fill.set_vectorize(ctx, index);
            ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
        }
        if (this.visuals.line.doit) {
            ctx.beginPath();
            ctx.rect(sx0, sy0, sx1 - sx0, sy1 - sy0);
            this.visuals.line.set_vectorize(ctx, index);
            return ctx.stroke();
        }
    };
    GlyphView.prototype.hit_test = function (geometry) {
        var func, result;
        result = null;
        func = "_hit_" + geometry.type;
        if (this[func] != null) {
            result = this[func](geometry);
        }
        else if (this._nohit_warned[geometry.type] == null) {
            logging_1.logger.debug("'" + geometry.type + "' selection not available for " + this.model.type);
            this._nohit_warned[geometry.type] = true;
        }
        return result;
    };
    GlyphView.prototype.set_data = function (source) {
        var data, ref, ref1;
        data = this.model.materialize_dataspecs(source);
        _.extend(this, data);
        if (this.renderer.plot_view.model.use_map) {
            if (this._x != null) {
                ref = proj.project_xy(this._x, this._y), this._x = ref[0], this._y = ref[1];
            }
            if (this._xs != null) {
                ref1 = proj.project_xsys(this._xs, this._ys), this._xs = ref1[0], this._ys = ref1[1];
            }
        }
        if (this.glglyph != null) {
            this.glglyph.set_data_changed(this._x.length);
        }
        this._set_data(source);
        return this.index = this._index_data();
    };
    GlyphView.prototype._set_data = function () { };
    GlyphView.prototype._index_data = function () { };
    GlyphView.prototype.mask_data = function (indices) {
        if (this.glglyph != null) {
            return indices;
        }
        else {
            return this._mask_data(indices);
        }
    };
    GlyphView.prototype._mask_data = function (indices) {
        return indices;
    };
    GlyphView.prototype._bounds = function (bounds) {
        return bounds;
    };
    GlyphView.prototype.map_data = function () {
        var i, j, k, len, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, sx, sxname, sy, syname, xname, yname;
        ref = this.model._coords;
        for (j = 0, len = ref.length; j < len; j++) {
            ref1 = ref[j], xname = ref1[0], yname = ref1[1];
            sxname = "s" + xname;
            syname = "s" + yname;
            xname = "_" + xname;
            yname = "_" + yname;
            if (_.isArray((ref2 = this[xname]) != null ? ref2[0] : void 0) || ((ref3 = this[xname]) != null ? (ref4 = ref3[0]) != null ? ref4.buffer : void 0 : void 0) instanceof ArrayBuffer) {
                ref5 = [[], []], this[sxname] = ref5[0], this[syname] = ref5[1];
                for (i = k = 0, ref6 = this[xname].length; 0 <= ref6 ? k < ref6 : k > ref6; i = 0 <= ref6 ? ++k : --k) {
                    ref7 = this.map_to_screen(this[xname][i], this[yname][i]), sx = ref7[0], sy = ref7[1];
                    this[sxname].push(sx);
                    this[syname].push(sy);
                }
            }
            else {
                ref8 = this.map_to_screen(this[xname], this[yname]), this[sxname] = ref8[0], this[syname] = ref8[1];
            }
        }
        return this._map_data();
    };
    GlyphView.prototype._map_data = function () { };
    GlyphView.prototype.map_to_screen = function (x, y) {
        return this.renderer.plot_view.map_to_screen(x, y, this.model.x_range_name, this.model.y_range_name);
    };
    return GlyphView;
})(bokeh_view_1.BokehView);
exports.Glyph = (function (superClass) {
    extend(Glyph, superClass);
    function Glyph() {
        return Glyph.__super__.constructor.apply(this, arguments);
    }
    Glyph.prototype._coords = [];
    Glyph.coords = function (coords) {
        var _coords, j, len, ref, result, x, y;
        _coords = this.prototype._coords.concat(coords);
        this.prototype._coords = _coords;
        result = {};
        for (j = 0, len = coords.length; j < len; j++) {
            ref = coords[j], x = ref[0], y = ref[1];
            result[x] = [p.NumberSpec];
            result[y] = [p.NumberSpec];
        }
        return this.define(result);
    };
    Glyph.define({
        visible: [p.Bool, true]
    });
    Glyph.internal({
        x_range_name: [p.String, 'default'],
        y_range_name: [p.String, 'default']
    });
    return Glyph;
})(model_1.Model);
