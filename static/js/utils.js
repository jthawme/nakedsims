export function calculateAngle(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx);

    return theta;
}

export function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
  );
}

export function roundTo(num, nearest) {
  return Math.ceil(num / nearest) * nearest;
}
