NODE?=node
NPM?=npm

all: dagre.js package.json

.INTERMEDIATE dagre.js: \
	src/pre.js \
	src/version.js \
	src/post.js

dagre.js: Makefile node_modules
	@rm -f $@
	cat $(filter %.js, $^) > $@
	@chmod a-w $@

node_modules: package.json
	$(NPM) install

package.json: src/version.js package.js
	@rm -f $@
	$(NODE) package.js > $@

clean:
	rm -f dagre.js package.json
