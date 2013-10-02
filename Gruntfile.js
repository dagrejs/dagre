module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkg,
    browserify: {
      dist: {
        files: {
          'out/dist/<%= pkg.name %>.js': ['browser.js']
        }
      }
    },
    jshint: {
      options: {
        eqeqeq: true,
        newcap: true,
        quotmark: true,
        unused: true,
        trailing: true,
        laxbreak: true
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },
    mochacov: {
      test: {
        options: {
          reporter: 'dot',
          files: ['test/**/*.js']
        }
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          output: 'out/coverage.html',
          files: ['test/**/*.js']
        }
      }
    },
    moduleName: pkg.name,
    uglify: {
      dist: {
        files: {
          'out/dist/<%= pkg.name %>.min.js': ['out/dist/<%= pkg.name %>.js']
        }
      }
    }
  });

  // Plugins
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cov');

  // Initialization
  grunt.file.mkdir('out/dist');
  grunt.file.write('lib/version.js', 'module.exports = \'' + pkg.version + '\';');

  // Main invocable targets
  grunt.registerTask('default', ['dist', 'test']);
  grunt.registerTask('dist', ['browserify', 'uglify']);
  grunt.registerTask('test', ['mochacov:test', 'mochacov:coverage']);
  grunt.registerTask('bench', function() {
    var done = this.async();
    var args = ['bench/bench.js'].concat(grunt.file.expand('bench/graphs/*'));
    var child = grunt.util.spawn({
      cmd: 'node',
      args: args
    }, done);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
  grunt.registerTask('release', function() {
    var done = this.async();
    var child = grunt.util.spawn({
      cmd: 'src/release/release.sh',
      args: [grunt.config('moduleName'), 'out/dist']
    }, done);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
  grunt.registerTask('clean', 'Deletes temporary files and dist files', function() {
    grunt.file.delete('lib/version.js');
    grunt.file.delete('out');
  });
};
