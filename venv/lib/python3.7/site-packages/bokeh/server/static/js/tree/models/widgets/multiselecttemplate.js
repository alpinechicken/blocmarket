"use strict";
var _ = require("underscore");
var DOM = require("../../core/util/dom");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (props) {
    return (DOM.createElement("fragment", null,
        DOM.createElement("label", { for: props.id },
            " ",
            props.title,
            " "),
        DOM.createElement("select", { multiple: true, class: "bk-widget-form-input", id: props.id, name: props.name }, props.options.map(function (option) {
            var value, label;
            if (_.isString(option)) {
                value = label = option;
            }
            else {
                value = option[0], label = option[1];
            }
            var selected = props.value.indexOf(value) > -1;
            return DOM.createElement("option", { selected: selected, value: value }, label);
        }))));
};
