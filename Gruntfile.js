module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkg,
    moduleJs: '<%= pkg.name %>.js',
    moduleMinJs: '<%= pkg.name %>.min.js',
    browserify: {
      build: {
        files: {
          'build/<%= moduleJs %>': ['browser.js']
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
      src: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
      bench: ['bench/**/*.js']
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
          output: 'build/coverage.html',
          files: ['test/**/*.js']
        }
      }
    },
    moduleName: pkg.name,
    uglify: {
      build: {
        files: {
          'build/<%= moduleMinJs %>': ['build/<%= moduleJs %>']
        }
      }
    },
    watch: {
      src: {
        files: ['lib/**/*.js', 'test/**/*.js', '!lib/version.js'],
        tasks: ['test', 'jshint:src:'],
        options: {
          spawn: false
        }
      },
      bench: {
        files: ['bench/**/*.js'],
        tasks: ['jshint:bench'],
        options: {
          spawn: false
        }
      }
    }
  });

  // Plugins
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');

  // Initialization

  // Main invocable targets
  grunt.registerTask('default', ['dist', 'test']);

  grunt.registerTask('build', ['_init', 'browserify', 'uglify']);

  grunt.registerTask('dist', ['build', '_dist']);

  grunt.registerTask('test', ['_init', 'mochacov:test', 'mochacov:coverage']);

  grunt.registerTask('bench', ['_init', '_bench']);

  grunt.registerTask('release', ['dist', '_release']);

  grunt.registerTask('clean', 'Deletes temporary files and dist files', function() {
    deleteFile('lib/version.js');
    deleteFile('build');
    deleteFile('dist');
  });

  // Supporting targets (should be private...)
  grunt.registerTask('_init', function() {
    grunt.file.write('lib/version.js', 'module.exports = \'' + pkg.version + '\';');
  });

  grunt.registerTask('_bench', function() {
    var done = this.async();
    var args = ['bench/bench.js'].concat(grunt.file.expand('bench/graphs/*'));
    var child = grunt.util.spawn({
      cmd: 'node',
      args: args
    }, done);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });

  grunt.registerTask('_dist', function() {
    grunt.file.mkdir('dist');
    grunt.file.copy('build/' + grunt.config('moduleJs'), 'dist/' + grunt.config('moduleJs'));
    grunt.file.copy('build/' + grunt.config('moduleMinJs'), 'dist/' + grunt.config('moduleMinJs'));
  });

  grunt.registerTask('_release', function() {
    var done = this.async();
    var child = grunt.util.spawn({
      cmd: 'src/release/release.sh',
      args: [grunt.config('moduleName'), 'dist']
    }, done);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });

  function deleteFile(file) {
    if (grunt.file.isFile(file)) {
      grunt.file.delete(file);
    }
  }
};

