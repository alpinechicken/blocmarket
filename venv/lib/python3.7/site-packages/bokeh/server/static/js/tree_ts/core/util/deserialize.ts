var ARRAY_TYPES;

import * as base64 from "base64-js";

import * as _ from "underscore";

ARRAY_TYPES = {
  float32: Float32Array,
  float64: Float64Array,
  uint8: Uint8Array,
  int8: Int8Array,
  uint16: Uint16Array,
  int16: Int16Array,
  uint32: Uint32Array,
  int32: Int32Array
};

export var convert_base64 = function(input) {
  var array, bytes, dtype, shape;
  bytes = base64.toByteArray(input['data']).buffer;
  dtype = input['dtype'];
  if (dtype in ARRAY_TYPES) {
    array = new ARRAY_TYPES[dtype](bytes);
  }
  shape = input['shape'];
  return [array, shape];
};

export var decode_column_data = function(data) {
  var arr, arrays, data_shapes, i, k, len, new_data, ref, ref1, shape, shapes, v;
  new_data = {};
  data_shapes = {};
  for (k in data) {
    v = data[k];
    if (_.isArray(v)) {
      arrays = [];
      shapes = [];
      for (i = 0, len = v.length; i < len; i++) {
        arr = v[i];
        if (_.isObject(arr) && 'shape' in arr) {
          ref = convert_base64(arr), arr = ref[0], shape = ref[1];
          shapes.push(shape);
          arrays.push(arr);
        } else if (_.isArray(arr)) {
          shapes.push([]);
          arrays.push(arr);
        }
      }
      if (shapes.length > 0) {
        new_data[k] = arrays;
        data_shapes[k] = shapes;
      } else {
        new_data[k] = v;
      }
    } else if (_.isObject(v) && 'shape' in v) {
      ref1 = convert_base64(v), arr = ref1[0], shape = ref1[1];
      new_data[k] = arr;
      data_shapes[k] = shape;
    }
  }
  return [new_data, data_shapes];
};
