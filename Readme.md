# MFC Smart Contracts

MFC ICO smart-contracts project

# Setup

Use `./init.sh` to setup the project locally.
It uses `nvm` to manage node versions and creates python virtual environment.

To activate the environment when it is set up already:

```
nvm use 8.10.0
source venv/bin/activate
```

# Run Tests

To run tests, start the docker compose setup under `simulation`:

```
cd simulation
docker-compose up
```

Note: alternatively, run `ganache-cli -a 1000 -e 100000` (1000 accounts and 100000 account balance).
See ganache cli options here: [ganache-cli](https://github.com/trufflesuite/ganache-cli).

Then run tests with `truffle test`.

# Smart-contracts goals

| Contract | Goal |
| ------ | ------ |
| MFC_coin | ERC23 burnable token. |
| ICO_controller | Creates ICOs, holds reward and marketing tokens until some date. |
| ICO_crowdsale | ICO contract (private offer, preSaleICO, ICO). |
| Holder | Holds 50% amount of ETH till alpha version and final version of project release. It is controlled with multisig. |
| SafeMath | Standard library |
| Ownable | Standard implementation |
| multiowned | Standard implementation |

# Code Coverage

Code coverage can be generated using [solidity-coverage](https://www.npmjs.com/package/solidity-coverage), [on github](https://github.com/sc-forks/solidity-coverage):

```
./node_modules/.bin/solidity-coverage
```

The configuration options are in the [.solcover.js](./.solcover.js), here we set same options as for ganache cli (1000 accounts, 100000 ether per account).

Note: solidity coverage leaves the test rpc process running, so it fails to run second time.
To stop the process, use the following command:

```
pkill -f "node ./node_modules/ethereumjs-testrpc-sc/build/cli.node.js"
```

See also [solidity coverage faq](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md) for additional information.

# Linting

We have [Solium](https://github.com/duaraghav8/Solium/) and [solhint](https://github.com/protofire/solhint) installed as project dependencies.

To run Solium execute this command:

```
./node_modules/.bin/solium -d contracts/
```

To run solhint execute this command:

```
./node_modules/.bin/solhint contracts/**/*.sol
```

# How to Debug Truffle Tests

Truffle tests can be debugged with `node inspector` (shipped with node since node 6.3).
In order to do that, we need to run `truffle test` command through the `node` command instead of `truffle`:

```
node --inspect-brk ./node_modules/truffle-core/cli.js test test/test_to_debug.js
```

The `truflle-core` package (installed as a part of project dependencies) contains the actual code for truffle commands.
While the `truffle` package is a wrapper built with webpack that brings everything together.

So here instead of `truffle test` we use `./node_modules/truffle-core/cli.js test`.

And we specify the `--inspect-brk` parameter for node which will pause the execution as long as the first line of the `cli.js` is reached.

Now we can debug the script code in the dev tools of the Chrome browser:

- Open `chrome://inspect` page and click the "Open dedicated DevTools for Node" link.
- We should see the `cli.js` file with execution paused on the first line.
- Add the test sources into the inspector: click the "Filesystem" on the left and then "Add folder to workspace".
- Browse to the folder with tests and add it.
- Open the file with the test to debug and set the breakpoint, continue the execution until it reaches the breakpoint
- Step through you test

Now open the file with test to debug and set the breakpoint inside the test, continue the code execution and wait until the breakpoint is reached.
And now you can step through the code and fix any problems in the test you might have or learn how it works.
