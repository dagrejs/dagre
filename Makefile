MOD = dagre

NPM = npm
NYC = nyc
KARMA = ./node_modules/karma/bin/karma
MOCHA = ./node_modules/mocha/bin/_mocha

MOCHA_OPTS = -R dot

BUILD_DIR = build
COVERAGE_DIR = ./.nyc_output
DIST_DIR = dist

SRC_FILES = index.js lib/version.js $(shell find lib -type f -name '*.js')
TEST_FILES = $(shell find test -type f -name '*.js' | grep -v 'bundle-test.js')
BUILD_FILES = $(addprefix $(DIST_DIR)/, $(MOD).cjs.js $(MOD).esm.js $(MOD).min.js $(MOD).js)

DIRS = $(BUILD_DIR)

.PHONY: all bench clean browser-test unit-test test dist lint build release

all: unit-test lint

bench: test
	@src/bench.js

lib/version.js: package.json
	@src/release/make-version.js > $@

$(DIRS):
	@mkdir -p $@

test: unit-test browser-test

unit-test: $(SRC_FILES) $(TEST_FILES) node_modules | $(BUILD_DIR)
	@$(NYC) $(MOCHA) --dir $(COVERAGE_DIR) -- $(MOCHA_OPTS) $(TEST_FILES) || $(MOCHA) $(MOCHA_OPTS) $(TEST_FILES)

browser-test: $(BUILD_DIR)/$(MOD).min.js
	$(KARMA) start --single-run $(KARMA_OPTS)

lint:
	@echo "Running lint check via npm (ESLint)..."
	@$(NPM) run lint

build:
	@echo "Running project build via npm (esbuild)..."
	@$(NPM) run build

dist: build test
	@echo "Dist files are built in 'dist/' by the 'build' target."

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
