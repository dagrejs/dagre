NODE?=node
NPM?=npm
BROWSERIFY?=node_modules/browserify/bin/cmd.js
PEGJS?=node_modules/pegjs/bin/pegjs
MOCHA?=node_modules/mocha/bin/mocha
MOCHA_OPTS?=--recursive
JS_COMPILER=node_modules/uglify-js/bin/uglifyjs
JS_COMPILER_OPTS?=--no-seqs

all: package.json dagre.js dagre.min.js

.INTERMEDIATE dagre-old.js: \
	src/pre.js \
	src/version.js \
	src/layout/layout.js \
	src/layout/acyclic.js \
	src/layout/rank.js \
	src/layout/order.js \
	src/layout/position.js \
	src/dot-grammar.js \
	src/post.js

dagre-old.js: Makefile node_modules
	@rm -f $@
	cat $(filter %.js, $^) > $@
	@chmod a-w $@

dagre.js: dagre-old.js
	$(BROWSERIFY) -r ./lib/util -r ./lib/dot index.js > dagre.js

dagre.min.js: dagre.js
	@rm -f $@
	$(JS_COMPILER) $(JS_COMPILER_OPTS) dagre.js > $@
	@chmod a-w $@

src/dot-grammar.js: src/dot-grammar.pegjs node_modules
	$(PEGJS) -e dot_parser src/dot-grammar.pegjs $@

node_modules: package.json
	$(NPM) install

package.json: src/version.js package.js
	@rm -f $@
	$(NODE) package.js > $@

.PHONY: test
test: dagre.js
	$(MOCHA) $(MOCHA_OPTS)

.PHONY: score
score: dagre.js
	$(NODE) score/score.js

clean:
	rm -f dagre.js package.json dagre.min.js dagre-old.js
