"use strict";
var extend = function (child, parent) { for (var key in parent) {
    if (hasProp.call(parent, key))
        child[key] = parent[key];
} function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }, hasProp = {}.hasOwnProperty;
var $ = require("jquery");
var markup_1 = require("./markup");
exports.ParagraphView = (function (superClass) {
    extend(ParagraphView, superClass);
    function ParagraphView() {
        return ParagraphView.__super__.constructor.apply(this, arguments);
    }
    ParagraphView.prototype.render = function () {
        var $para;
        ParagraphView.__super__.render.call(this);
        $para = $('<p style="margin: 0;"></p>').text(this.model.text);
        return this.$el.find('.bk-markup').append($para);
    };
    return ParagraphView;
})(markup_1.MarkupView);
exports.Paragraph = (function (superClass) {
    extend(Paragraph, superClass);
    function Paragraph() {
        return Paragraph.__super__.constructor.apply(this, arguments);
    }
    Paragraph.prototype.type = "Paragraph";
    Paragraph.prototype.default_view = exports.ParagraphView;
    return Paragraph;
})(markup_1.Markup);
