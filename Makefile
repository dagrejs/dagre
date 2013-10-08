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

GRUNT_CMDS = default release build dist test jshint bench watch clean

.PHONY: $(GRUNT_CMDS) fullclean

$(GRUNT_CMDS): node_modules
	$(GRUNT) $@

fullclean: clean
	rm -rf node_modules

node_modules: package.json
	$(NPM) install
