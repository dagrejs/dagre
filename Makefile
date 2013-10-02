NODE?=node
NPM?=npm
BROWSERIFY?=node_modules/browserify/bin/cmd.js
MOCHA?=node_modules/mocha/bin/mocha
MOCHA_OPTS?=
JS_COMPILER=node_modules/uglify-js/bin/uglifyjs
JS_COMPILER_OPTS?=--no-seqs

MODULE=dagre

# There does not appear to be an easy way to define recursive expansion, so
# we do our own expansion a few levels deep.
JS_SRC:=$(wildcard lib/*.js lib/*/*.js lib/*/*/*.js)
JS_TEST:=$(wildcard test/*.js test/*/*.js test/*/*/*.js)

BENCH_FILES?=$(wildcard bench/graphs/*)

OUT_DIRS=out out/dist

.PHONY: all release dist test coverage bench clean fullclean

all: dist test coverage

release: all
	src/release/release.sh $(MODULE) out/dist

dist: out/dist/$(MODULE).js out/dist/$(MODULE).min.js

test: out/dist/$(MODULE).js $(JS_TEST)
	$(NODE) $(MOCHA) $(MOCHA_OPTS) $(JS_TEST)

coverage: out/coverage.html

bench: bench/bench.js out/dist/$(MODULE).js
	@$(NODE) $< $(BENCH_FILES)

clean:
	rm -f lib/version.js
	rm -rf out

fullclean: clean
	rm -rf node_modules

$(OUT_DIRS):
	mkdir -p $@

out/dist/$(MODULE).js: browser.js Makefile out/dist node_modules lib/version.js $(JS_SRC)
	$(NODE) $(BROWSERIFY) $< > $@

out/dist/$(MODULE).min.js: out/dist/$(MODULE).js
	$(NODE) $(JS_COMPILER) $(JS_COMPILER_OPTS) $< > $@

out/coverage.html: out/dist/$(MODULE).js $(JS_TEST) $(JS_SRC)
	$(NODE) $(MOCHA) $(JS_TEST) --require blanket -R html-cov > $@

lib/version.js: src/version.js package.json
	$(NODE) src/version.js > $@

node_modules: package.json
	$(NPM) install
