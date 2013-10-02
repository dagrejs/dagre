# This Makefile acts as a simple wrapper over grunt. It ensures that all NPM
# dependencies are up-to-date. This Makefile requires grunt-cli, npm, and node
# to be installed.
#
# Once npm is installed, install grunt-cli globally with:
#
#      npm install grunt-cli -g
#

GRUNT=grunt
NODE=node
NPM=npm

.PHONY: default release dist test bench watch clean fullclean

default: node_modules
	$(GRUNT) default

release: node_modules
	$(GRUNT) release

dist: node_modules
	$(GRUNT) dist

test: node_modules
	$(GRUNT) test

bench: node_modules
	$(GRUNT) bench

watch: node_modules
	$(GRUNT) watch

clean: node_modules
	$(GRUNT) clean

fullclean: clean
	rm -rf node_modules

node_modules: package.json
	$(NPM) install
