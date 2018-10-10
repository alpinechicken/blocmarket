"use strict";
require("./core/util/underscore");
var version_1 = require("./version");
exports.version = version_1.version;
var _ = require("underscore");
var $ = require("jquery");
Object.defineProperty(module.exports, "_", {
    get: function () {
        console.warn("Bokeh._ was deprecated in Bokeh 0.12.4 and will be removed. You have to provide your own copy of underscore if necessary.");
        return _;
    }
});
Object.defineProperty(module.exports, "$", {
    get: function () {
        console.warn("Bokeh.$ was deprecated in Bokeh 0.12.4 and will be removed. You have to provide your own copy of jquery if necessary.");
        return $;
    }
});
var embed = require("./embed");
exports.embed = embed;
var logging_1 = require("./core/logging");
exports.logger = logging_1.logger;
exports.set_log_level = logging_1.set_log_level;
var base_1 = require("./base");
exports.Models = base_1.Models;
exports.index = base_1.index;
var safely_1 = require("./safely");
exports.safely = safely_1.safely;
