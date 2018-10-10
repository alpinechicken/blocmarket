var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

import * as _ from "underscore";

import {
  HasProps
} from "./core/has_props";

import * as p from "./core/properties";

export var Model = (function(superClass) {
  extend(Model, superClass);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  Model.prototype.type = "Model";

  Model.define({
    tags: [p.Array, []],
    name: [p.String],
    js_callbacks: [p.Any, {}]
  });

  Model.prototype.initialize = function(options) {
    var callbacks, cb, evt, ref1, results;
    Model.__super__.initialize.call(this, options);
    ref1 = this.js_callbacks;
    results = [];
    for (evt in ref1) {
      callbacks = ref1[evt];
      results.push((function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = callbacks.length; i < len; i++) {
          cb = callbacks[i];
          results1.push(this.listenTo(this, evt, function() {
            return cb.execute(this);
          }));
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  Model.prototype.select = function(selector) {
    if (selector.prototype instanceof Model) {
      return this.references().filter(function(ref) {
        return ref instanceof selector;
      });
    } else if (_.isString(selector)) {
      return this.references().filter(function(ref) {
        return ref.name === selector;
      });
    } else {
      throw new Error("invalid selector");
    }
  };

  Model.prototype.select_one = function(selector) {
    var result;
    result = this.select(selector);
    switch (result.length) {
      case 0:
        return null;
      case 1:
        return result[0];
      default:
        throw new Error("found more than one object matching given selector");
    }
  };

  return Model;

})(HasProps);
