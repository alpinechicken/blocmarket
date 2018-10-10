var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

import * as $ from "jquery";

import {
  Markup,
  MarkupView
} from "./markup";

import * as p from "../../core/properties";

export var PreTextView = (function(superClass) {
  extend(PreTextView, superClass);

  function PreTextView() {
    return PreTextView.__super__.constructor.apply(this, arguments);
  }

  PreTextView.prototype.render = function() {
    var $pre;
    PreTextView.__super__.render.call(this);
    $pre = $('<pre style="overflow: auto"></pre>').text(this.model.text);
    return this.$el.find('.bk-markup').append($pre);
  };

  return PreTextView;

})(MarkupView);

export var PreText = (function(superClass) {
  extend(PreText, superClass);

  function PreText() {
    return PreText.__super__.constructor.apply(this, arguments);
  }

  PreText.prototype.type = "PreText";

  PreText.prototype.default_view = PreTextView;

  return PreText;

})(Markup);
