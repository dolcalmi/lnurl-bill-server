BIN_DIR=node_modules/.bin

watch-compile:
	yarn watch-compile

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn build

unit-in-ci:
	. ./.envrc && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/jest-unit.config.js --ci --bail
