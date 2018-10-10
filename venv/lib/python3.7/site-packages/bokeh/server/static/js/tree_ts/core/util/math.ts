export var array_min = function(arr) {
  var len, min, val;
  len = arr.length;
  min = 2e308;
  while (len--) {
    val = arr[len];
    if (val < min) {
      min = val;
    }
  }
  return min;
};

export var array_max = function(arr) {
  var len, max, val;
  len = arr.length;
  max = -2e308;
  while (len--) {
    val = arr[len];
    if (val > max) {
      max = val;
    }
  }
  return max;
};

export var angle_norm = function(angle) {
  while (angle < 0) {
    angle += 2 * Math.PI;
  }
  while (angle > 2 * Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
};

export var angle_dist = function(lhs, rhs) {
  return Math.abs(angle_norm(lhs - rhs));
};

export var angle_between = function(mid, lhs, rhs, direction) {
  var d;
  mid = angle_norm(mid);
  d = angle_dist(lhs, rhs);
  if (direction === "anticlock") {
    return angle_dist(lhs, mid) <= d && angle_dist(mid, rhs) <= d;
  } else {
    return !(angle_dist(lhs, mid) <= d && angle_dist(mid, rhs) <= d);
  }
};

export var random = function() {
  return Math.random();
};

export var atan2 = function(start, end) {
  "Calculate the angle between a line containing start and end points (composed\nof [x, y] arrays) and the positive x-axis.";
  return Math.atan2(end[1] - start[1], end[0] - start[0]);
};

export var rnorm = function(mu, sigma) {
  var r1, r2, rn;
  r1 = null;
  r2 = null;
  while (true) {
    r1 = random();
    r2 = random();
    r2 = (2 * r2 - 1) * Math.sqrt(2 * (1 / Math.E));
    if (-4 * r1 * r1 * Math.log(r1) >= r2 * r2) {
      break;
    }
  }
  rn = r2 / r1;
  rn = mu + sigma * rn;
  return rn;
};

export var clamp = function(val, min, max) {
  if (val > max) {
    return max;
  }
  if (val < min) {
    return min;
  }
  return val;
};
