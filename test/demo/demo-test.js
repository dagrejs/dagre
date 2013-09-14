// A *very* simple test runner to ensure that the demos work as expected.
var webpage = require("webpage"),
    system = require("system"),
    stdout = system.stdout,
    stderr = system.stderr,
    // Too bad this replaces the more function fs module from nodejs...
    fs = require("fs"),
    Set = require("graphlib").data.Set
    start = new Date();

var red = "\033[31m";
var green = "\033[32m";
var grey = "\033[30;1m";
var reset = "\033[0m";

function htmlFile(file) { return file.match(/.*\.html/); }

var remaining = Set.unionAll([ls("./demo", htmlFile),
                              ls("./out/dist/demo", htmlFile)]);
var testCount = remaining.size();
var failures = [];

stdout.write("\n");
stdout.write("  " + grey);

remaining.keys().forEach(function(url) {
  var page = webpage.create();
  page.onError = function(msg, trace) {
    failures.push({ url: url, msg: msg, trace: trace });
    testDone(url);
  };
  page.open(url, function(status) {
    if (status !== "success") {
      failures.push({ url: url, msg: "Could not load page" });
    }
    stdout.write(".");
    testDone(url);
  });
});

function ls(dir, filter) {
  var set = new Set();
  fs.list(dir).forEach(function(file) {
    if (filter(file)) {
      set.add(dir + "/" + file);
    }
  });
  return set;
}

function testDone(url) {
  remaining.remove(url);
  if (remaining.size() === 0) {
    stdout.write(reset + "\n");
    stdout.write("\n");
    failures.forEach(function(failure) {
      stderr.write(red + "FAILED: " + failure.url + reset + "\n");
      stderr.write(grey);
      stderr.write("  " + failure.msg + "\n");
      if (failure.trace) {
        failure.trace.forEach(function(t) {
          stderr.write("    " + t.file + ": " + t.line + (t.function ? " (in function '" + t.function + "')" : "") + "\n");
        });
      }
      stderr.write(reset);
      stderr.write("\n");
    });
    stdout.write("  " + green + (testCount - failures.length) + " passing" + reset);
    if (failures.length) {
      stdout.write(" " + red + (failures.length) + " failing" + reset);
    }
    stdout.write(grey + " (" + (new Date() - start) + "ms)" + reset + "\n\n");
    phantom.exit(failures.length);
  }
}
