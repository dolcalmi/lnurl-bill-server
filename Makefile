BIN_DIR=node_modules/.bin

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn build
