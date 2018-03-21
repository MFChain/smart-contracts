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
| Holder | Holds 50% amount of got during ICO ETH till alpha version and final version of project release. It is controlled with multisig. |
| SafeMath | Standard library |
| Ownable | Standard implementation |
| multiowned | Standard implementation |

# Code Coverage

Code coverage can be generated using [solidity-coverage](https://www.npmjs.com/package/solidity-coverage), [on github](https://github.com/sc-forks/solidity-coverage):

```
./node_modules/.bin/solidity-coverage
```

The configuration options are in the [.solcover.js](./.solcover.js), here we set same options as for ganache cli (1000 accounts, 100000 ether per account).
