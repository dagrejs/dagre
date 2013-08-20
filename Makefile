NODE?=node
NPM?=npm
BROWSERIFY?=node_modules/browserify/bin/cmd.js
PEGJS?=node_modules/pegjs/bin/pegjs
MOCHA?=node_modules/mocha/bin/mocha
MOCHA_OPTS?=--recursive
JS_COMPILER=node_modules/uglify-js/bin/uglifyjs
JS_COMPILER_OPTS?=--no-seqs

all: package.json dagre.js dagre.min.js

.INTERMEDIATE dagre.js: lib/dot-grammar.js 
dagre.js: Makefile index.js node_modules
	@rm -f $@
	$(BROWSERIFY) browser.js > dagre.js
	@chmod a-w $@

dagre.min.js: dagre.js
	@rm -f $@
	$(JS_COMPILER) $(JS_COMPILER_OPTS) dagre.js > $@
	@chmod a-w $@

lib/dot-grammar.js: src/dot-grammar.pegjs node_modules
	$(PEGJS) -e 'module.exports' src/dot-grammar.pegjs $@

node_modules: package.json
	$(NPM) install

package.json: lib/version.js package.js
	@rm -f $@
	$(NODE) package.js > $@

.PHONY: test
test: dagre.js
	$(MOCHA) $(MOCHA_OPTS)

.PHONY: score
score: dagre.js
	$(NODE) score/score.js

clean:
	rm -f dagre.js package.json dagre.min.js
