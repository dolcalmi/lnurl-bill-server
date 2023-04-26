BIN_DIR=node_modules/.bin

watch-compile:
	yarn watch-compile

start-deps:
	docker compose up -d
	yarn mockoon-cli start --data ./dev/blink.localhost/bill-server-api.json --pname "mocked-bill-server"
	yarn db:migrate

clean-deps:
	docker compose down
	yarn mockoon-cli stop "all"

reset-deps: clean-deps start-deps

start-dev: reset-deps
	yarn start-dev | yarn pino-pretty -c -l

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn build

unit-in-ci:
	. ./.envrc && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/jest-unit.config.js --ci --bail
