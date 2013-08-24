NODE?=node
NPM?=npm
BROWSERIFY?=node_modules/browserify/bin/cmd.js
PEGJS?=node_modules/pegjs/bin/pegjs
MOCHA?=node_modules/mocha/bin/mocha
MOCHA_OPTS?=
JS_COMPILER=node_modules/uglify-js/bin/uglifyjs
JS_COMPILER_OPTS?=--no-seqs

# There does not appear to be an easy way to define recursive expansion, so
# we do our own expansion a few levels deep.
JS_SRC:=$(wildcard lib/*.js lib/*/*.js lib/*/*/*.js)
JS_TEST:=$(wildcard test/*.js test/*/*.js test/*/*/*.js)

all: dagre.js dagre.min.js test

dagre.js: Makefile browser.js node_modules lib/dot-grammar.js lib/version.js $(JS_SRC)
	@rm -f $@
	$(NODE) $(BROWSERIFY) browser.js > dagre.js
	@chmod a-w $@

dagre.min.js: dagre.js
	@rm -f $@
	$(NODE) $(JS_COMPILER) $(JS_COMPILER_OPTS) dagre.js > $@
	@chmod a-w $@

lib/version.js: src/version.js package.json
	$(NODE) src/version.js > $@

lib/dot-grammar.js: src/dot-grammar.pegjs node_modules
	$(NODE) $(PEGJS) -e 'module.exports' src/dot-grammar.pegjs $@

node_modules: package.json
	$(NPM) install

.PHONY: test
test: dagre.js $(JS_TEST)
	$(NODE) $(MOCHA) $(MOCHA_OPTS) $(JS_TEST)

.PHONY: bench
bench: bench/bench.js
	$(NODE) bench/bench.js

clean:
	rm -f dagre.js dagre.min.js
