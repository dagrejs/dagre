MOD = dagre

NPM = npm
BROWSERIFY = ./node_modules/browserify/bin/cmd.js
ISTANBUL = ./node_modules/istanbul/lib/cli.js
JSHINT = ./node_modules/jshint/bin/jshint
JSCS = ./node_modules/jscs/bin/jscs
KARMA = ./node_modules/karma/bin/karma
MOCHA = ./node_modules/mocha/bin/_mocha
UGLIFY = ./node_modules/uglify-js/bin/uglifyjs

ISTANBUL_OPTS = --dir $(COVERAGE_DIR) --report html
JSHINT_OPTS = --reporter node_modules/jshint-stylish/stylish.js
MOCHA_OPTS = -R dot

BUILD_DIR = build
COVERAGE_DIR = $(BUILD_DIR)/cov
DIST_DIR = dist

SRC_FILES = index.js lib/version.js $(shell find lib -type f -name '*.js')
TEST_FILES = $(shell find test -type f -name '*.js' | grep -v 'bundle-test.js')
BUILD_FILES = $(addprefix $(BUILD_DIR)/, \
						$(MOD).js $(MOD).min.js \
						$(MOD).core.js $(MOD).core.min.js)

DIRS = $(BUILD_DIR)

.PHONY: all bench clean browser-test unit-test test dist

all: unit-test

bench: test
	@src/bench.js

lib/version.js: package.json
	@src/release/make-version.js > $@

$(DIRS):
	@mkdir -p $@

test: unit-test browser-test

unit-test: $(SRC_FILES) $(TEST_FILES) node_modules | $(BUILD_DIR)
	@$(ISTANBUL) cover $(ISTANBUL_OPTS) $(MOCHA) --dir $(COVERAGE_DIR) -- $(MOCHA_OPTS) $(TEST_FILES) || $(MOCHA) $(MOCHA_OPTS) $(TEST_FILES)
	@$(JSHINT) $(JSHINT_OPTS) $(filter-out node_modules, $?)
	@$(JSCS) $(filter-out node_modules, $?)

browser-test: $(BUILD_DIR)/$(MOD).js $(BUILD_DIR)/$(MOD).core.js
	$(KARMA) start --single-run $(KARMA_OPTS)
	$(KARMA) start karma.core.conf.js --single-run $(KARMA_OPTS)

bower.json: package.json src/release/make-bower.json.js
	@src/release/make-bower.json.js > $@

$(BUILD_DIR)/$(MOD).js: index.js $(SRC_FILES) | unit-test
	@$(BROWSERIFY) $< > $@ -s dagre

$(BUILD_DIR)/$(MOD).min.js: $(BUILD_DIR)/$(MOD).js
	@$(UGLIFY) $< --comments '@license' > $@

$(BUILD_DIR)/$(MOD).core.js: index.js $(SRC_FILES) | unit-test
	@$(BROWSERIFY) $< > $@ --no-bundle-external -s dagre

$(BUILD_DIR)/$(MOD).core.min.js: $(BUILD_DIR)/$(MOD).core.js
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
