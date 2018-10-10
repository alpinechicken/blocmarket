"use strict";
var DOM = require("../../core/util/dom");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (props) {
    return (DOM.createElement("button", { type: "button", class: "bk-bs-btn bk-bs-btn-" + props.button_type }, props.label));
};
