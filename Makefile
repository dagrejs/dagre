MOD = dagre

NPM = npm
NYC = npx nyc
BROWSERIFY = ./node_modules/browserify/bin/cmd.js
JSHINT = ./node_modules/jshint/bin/jshint
ESLINT = ./node_modules/eslint/bin/eslint.js
KARMA = ./node_modules/karma/bin/karma
MOCHA = ./node_modules/mocha/bin/_mocha
UGLIFY = ./node_modules/uglify-js/bin/uglifyjs

JSHINT_OPTS = --reporter node_modules/jshint-stylish/index.js
MOCHA_OPTS = -R dot

BUILD_DIR = build
COVERAGE_DIR = ./.nyc_output
DIST_DIR = dist


MJS_FILES = $(shell find mjs-lib -type f -name '*.js')
# CJS_FILES are based off mjs files.
CJS_FILES = $(shell find mjs-lib -type f -name '*.js' -printf lib/%P\\n)
TEST_FILES = $(shell find test -type f -name '*.js' | grep -v 'bundle-test.js')
BUILD_FILES = $(addprefix $(BUILD_DIR)/, $(MOD).js $(MOD).min.js)

DIRS = $(BUILD_DIR)

.PHONY: all bench clean convert-clean browser-test unit-test test dist

all: unit-test lint

bench: test
	@src/bench.js

mjs-lib/version.js: package.json
	@src/release/make-version.js > $@

$(DIRS):
	@mkdir -p $@

test: unit-test browser-test

unit-test: convert index.js $(CJS_FILES) $(TEST_FILES) node_modules | $(BUILD_DIR)
	@$(NYC) $(MOCHA) --dir $(COVERAGE_DIR) -- $(MOCHA_OPTS) $(TEST_FILES) || $(MOCHA) $(MOCHA_OPTS) $(TEST_FILES)

browser-test: $(BUILD_DIR)/$(MOD).js
	$(KARMA) start --single-run $(KARMA_OPTS)

bower.json: package.json src/release/make-bower.json.js
	@src/release/make-bower.json.js > $@

# index.js still uses require!
index.js: convert

lint:
	@$(JSHINT) $(JSHINT_OPTS) $(filter-out node_modules, $?)
	@$(ESLINT) $(MJS_FILES) $(TEST_FILES)

$(BUILD_DIR)/$(MOD).js: index.js $(CJS_FILES) | unit-test
	@$(BROWSERIFY) $< > $@ -s dagre

$(BUILD_DIR)/$(MOD).min.js: $(BUILD_DIR)/$(MOD).js
	@$(UGLIFY) $< --comments '@license' > $@

dist: $(BUILD_FILES) | bower.json test
	@rm -rf $@
	@mkdir -p $@
	@cp $^ dist

release: dist
	@echo
	@echo Starting release...
	@echo
	@src/release/release.sh $(MOD) dist

clean:
	rm -rf $(BUILD_DIR)

node_modules: package.json
	@$(NPM) install
	@touch $@

lib/%.js: mjs-lib/%.js
	npx babel "$<" -o "$@"

convert-clean:
	rsync --existing --ignore-existing --delete -r mjs-lib/ lib/

convert: convert-clean $(CJS_FILES)

