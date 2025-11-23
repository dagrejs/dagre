MOD = dagre

NPM = npm

DIST_DIR = dist

SRC_FILES = index.js lib/version.js $(shell find lib -type f -name '*.js')
TEST_FILES = $(shell find test -type f -name '*.js' | grep -v 'bundle-test.js')
BUILD_FILES = $(addprefix $(DIST_DIR)/, $(MOD).cjs.js $(MOD).esm.js $(MOD).min.js $(MOD).js)

.PHONY: all bench clean test dist lint build release node_modules

all: unit-test lint

bench: test
	@src/bench.js

lib/version.js: package.json
	@src/release/make-version.js > $@

lint:
	@echo "Running lint check via npm (ESLint)..."
	@$(NPM) run lint

build:
	@echo "Running project build via npm (esbuild)..."
	@$(NPM) run build

test: lint
	@$(NPM) run test

dist: build test
	@echo "Dist files are built in 'dist/' by the 'build' target."

release: dist
	@echo
	@echo Starting release...
	@echo
	@src/release/release.sh $(MOD) dist

clean:
	rm -rf build dist coverage

node_modules: package.json
	@$(NPM) install
	@touch $@
