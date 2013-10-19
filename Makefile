# Binaries we use
NPM = npm

BROWSERIFY = ./node_modules/browserify/bin/cmd.js
ISTANBUL = ./node_modules/istanbul/lib/cli.js
JSHINT = ./node_modules/jshint/bin/jshint
MOCHA = ./node_modules/mocha/bin/_mocha
PHANTOMJS = ./node_modules/phantomjs/bin/phantomjs
UGLIFY = ./node_modules/uglify-js/bin/uglifyjs

# Module def
MODULE = dagre
MODULE_JS = $(MODULE).js
MODULE_MIN_JS = $(MODULE).min.js

# Various files
SRC_FILES = $(wildcard lib/*.js lib/*/*.js lib/*/*/*.js)
TEST_FILES= $(wildcard test/unit/*.js test/unit/**/*.js)

TEST_COV = build/coverage

# Targets
.PHONY: = all test lint release clean fullclean

.DELETE_ON_ERROR:

all: build test

build: build/$(MODULE_JS) build/$(MODULE_MIN_JS)

build/$(MODULE_JS): browser.js node_modules $(SRC_FILES)
	mkdir -p $(@D)
	$(BROWSERIFY) -t brfs $(BROWSERIFY_OPTS) $< > $@

build/$(MODULE_MIN_JS): build/$(MODULE_JS)
	$(UGLIFY) $(UGLIFY_OPTS) $< > $@

dist: build/$(MODULE_JS) build/$(MODULE_MIN_JS) | test
	rm -rf $@
	mkdir -p $@
	cp $^ dist

test: $(TEST_COV) lint

$(TEST_COV): $(TEST_FILES) $(SRC_FILES) node_modules
	rm -rf $@
	$(ISTANBUL) cover $(MOCHA) --dir $@ -- $(MOCHA_OPTS) $(TEST_FILES)

lint: build/lint

build/lint: browser.js index.js $(SRC_FILES) $(TEST_FILES)
	mkdir -p $(@D)
	$(JSHINT) $?
	touch $@
	@echo

release: dist
	src/release/release.sh $(MODULE) dist

clean:
	rm -rf build dist

fullclean: clean
	rm -rf ./node_modules

node_modules: package.json
	$(NPM) install
