var _ = require("lodash");

module.exports = {
  time: time,
  log: log
};

/*
 * Returns a new function that wraps `func` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
function time(name, func) {
  var start = log.level ? _.now() : null;
  try {
    return func();
  } finally {
    log(1, name + " time: " + (_.now() - start) + "ms");
  }
}

/*
 * A global logger with the specification `log(level, message, ...)` that
 * will log a message to the console if `log.level >= level`.
 */
function log(level) {
  if (log.level >= level) {
    console.log.apply(console, _.toArray(arguments).slice(1));
  }
}
log.level = 0;
