export var startsWith = function(str, searchString, position) {
  if (position == null) {
    position = 0;
  }
  return str.substr(position, searchString.length) === searchString;
};
