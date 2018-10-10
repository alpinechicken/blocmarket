"use strict";
var bokehjs, pkg, root;
var path = require("path");
var assert = require("assert");
var rootRequire = require("root-require");
root = rootRequire.packpath.parent();
pkg = rootRequire("./package.json");
module.constructor.prototype.require = function (modulePath) {
    var overridePath;
    assert(modulePath, 'missing path');
    assert(typeof modulePath === 'string', 'path must be a string');
    overridePath = pkg.browser[modulePath];
    if (overridePath != null) {
        modulePath = path.join(root, overridePath);
    }
    return this.constructor._load(modulePath, this);
};
bokehjs = function () {
    var Bokeh, load_plugin;
    if ((typeof window !== "undefined" && window !== null ? window.document : void 0) == null) {
        throw new Error("bokehjs requires a window with a document. If your runtime environment doesn't provide those, e.g. pure node.js, you can use jsdom library to configure window and document.");
    }
    Bokeh = require('./main');
    load_plugin = function (path) {
        var i, len, name, plugin, results;
        plugin = require(path);
        Bokeh.Models.register_models(plugin.models);
        results = [];
        for (i = 0, len = plugin.length; i < len; i++) {
            name = plugin[i];
            if (name !== "models") {
                results.push(Bokeh[name] = plugin[name]);
            }
            else {
                results.push(void 0);
            }
        }
        return results;
    };
    load_plugin('./api');
    load_plugin('./models/widgets/main');
    return Bokeh;
};
module.exports = (typeof window !== "undefined" && window !== null ? window.document : void 0) != null ? bokehjs() : bokehjs;
