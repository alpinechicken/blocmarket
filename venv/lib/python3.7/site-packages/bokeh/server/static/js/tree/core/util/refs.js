"use strict";
var _ = require("underscore");
var has_props_1 = require("../has_props");
exports.create_ref = function (obj) {
    var ref;
    if (!(obj instanceof has_props_1.HasProps)) {
        throw new Error("can only create refs for HasProps subclasses");
    }
    ref = {
        'type': obj.type,
        'id': obj.id
    };
    if (obj._subtype != null) {
        ref['subtype'] = obj._subtype;
    }
    return ref;
};
exports.is_ref = function (arg) {
    var keys;
    if (_.isObject(arg)) {
        keys = _.keys(arg).sort();
        if (keys.length === 2) {
            return keys[0] === 'id' && keys[1] === 'type';
        }
        if (keys.length === 3) {
            return keys[0] === 'id' && keys[1] === 'subtype' && keys[2] === 'type';
        }
    }
    return false;
};
exports.convert_to_ref = function (value) {
    if (_.isArray(value)) {
        return value.map(exports.convert_to_ref);
    }
    else {
        if (value instanceof has_props_1.HasProps) {
            return value.ref();
        }
    }
};
