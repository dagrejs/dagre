NODE?=node
NPM?=npm
PEGJS?=node_modules/pegjs/bin/pegjs

all: dagre.js package.json

.INTERMEDIATE dagre.js: \
	src/pre.js \
	src/version.js \
	src/graph.js \
	src/pre-layout.js \
	src/render.js \
	src/dot-grammar.js \
	src/post.js

dagre.js: Makefile node_modules
	@rm -f $@
	cat $(filter %.js, $^) > $@
	@chmod a-w $@

src/dot-grammar.js: node_modules
	$(PEGJS) -e dot_parser src/dot-grammar.pegjs $@

node_modules: package.json
	$(NPM) install

package.json: src/version.js package.js
	@rm -f $@
	$(NODE) package.js > $@

clean:
	rm -f dagre.js package.json
