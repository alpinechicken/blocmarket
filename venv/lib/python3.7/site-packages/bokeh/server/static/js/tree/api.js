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
