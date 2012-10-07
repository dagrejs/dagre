function createSVGElement(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/*
 * Performs some of the common rendering that is used by both preLayout and
 * render.
 */
function createTextNode(node, x) {
  var fontSize = node.attrs.fontSize;
  var text = createSVGElement("text");
  text.setAttribute("font-family", node.attrs.fontName);
  text.setAttribute("font-size", fontSize);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", node.attrs.fontColor);

  var firstLine = true;
  var lines = node.attrs.label.split("\n");
  lines.forEach(function(line) {
    var tspan = createSVGElement("tspan");
    tspan.textContent = line;
    if (!firstLine) {
      tspan.setAttribute("x", x || 0);
      tspan.setAttribute("dy", "1em");
    }
    text.appendChild(tspan);
    firstLine = false;
  });

  // TODO This constant yields consistently better vertical centering. I
  // suspect it is related to vertical spacing, but I don't know where to get
  // the appropriate value programmatically.
  var adjustConstant = 2;
  text.setAttribute("y", fontSize - adjustConstant - (fontSize * lines.length / 2));

  return text;
}

/*
 * If `obj` does not have a property `prop` then it is added to `obj` with the
 * default value (`def`).
 */
function defaultVal(obj, prop, def) {
  if (!(prop in obj)) {
    obj[prop] = def;
  }
}

/*
 * If `obj` has `prop` then it is coerced to a string. Otherwise it's value is
 * set to `def`.
 */
function defaultStr(obj, prop, def) {
  obj[prop] = prop in obj ? obj[prop].toString() : def;
}

/*
 * If `obj` has `prop` then it is coerced to an int. Otherwise it's value is
 * set to `def`.
 */
function defaultInt(obj, prop, def) {
  obj[prop] = prop in obj ? parseInt(obj[prop]) : def;
}

function defaultFloat(obj, prop, def) {
  obj[prop] = prop in obj ? parseFloat(obj[prop]) : def;
}

/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
function mergeAttributes(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
}

function min(values) {
  return Math.min.apply(null, values);
}

function max(values) {
  return Math.max.apply(null, values);
}

function concat(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

/*
 * Returns an array of all values in the given object.
 */
function values(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
}
