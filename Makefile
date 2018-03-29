lint-solium:
	./node_modules/.bin/solium -d contracts/

lint-solhint:
	./node_modules/.bin/solhint contracts/**/*.sol

solidity-coverage:
	./node_modules/.bin/solidity-coverage
	# Solidity coverage leaves hanging node process
	pkill -f "node ./node_modules/ethereumjs-testrpc-sc/build/cli.node.js"
