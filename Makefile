all: dagre.js

.INTERMEDIATE dagre.js: \
	src/pre.js \
	src/version.js \
	src/post.js

dagre.js: Makefile
	@rm -f $@
	cat $(filter %.js, $^) > $@
	@chmod a-w $@

clean:
	rm -f dagre.js
