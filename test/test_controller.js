var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var Web3 = require('web3');

var BN = require('bn.js');
var BigNumber = require('bignumber.js');


Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


/*
function wait(delay) {
    var stop = new Date().getTime() / 1000 + delay;
    while (new Date().getTime() / 1000 < stop) {
        ;
    }
}

const increaseTime = function (duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.sendAsync({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id + 1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res)
            })
        })
    })
};

contract('ICO Controller', function (accounts) {

    it("test addBuyerToWhitelist function", function () {
        var owner = accounts[0];
        var addAccount = accounts[2];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.isAddressWhitelisted.call(addAccount);
            }).then(
            function (isAddrWhite) {
                assert.isFalse(isAddrWhite, "Address was whitelisted by default");
                return controller_instance.addBuyerToWhitelist(addAccount, {from: addAccount});
            }).then(
            function () {
                assert.isFalse(true, "Expected access exception. The function is only for owner");
            }).catch(
            function (error) {
                return controller_instance.addBuyerToWhitelist(addAccount);
            }).then(
            function () {
                return controller_instance.isAddressWhitelisted.call(addAccount);
            }).then(
            function (isAddrWhite) {
                assert.isTrue(isAddrWhite.valueOf(), "Address is not whitelisted");
            }
        );
    });

    it("test removeBuyerFromWhitelist function", function () {
        var owner = accounts[0];
        var addAccount = accounts[3];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addBuyerToWhitelist(addAccount);
            }).then(
            function () {
                return controller_instance.addBuyerToWhitelist(addAccount, {from: addAccount});
            }).then(
            function () {
                assert.isFalse(true, "Expect access exception. The function is only for owner");
            }).catch(
            function (error) {
                return controller_instance.removeBuyerFromWhitelist(addAccount);
            }).then(
            function () {
                return controller_instance.isAddressWhitelisted.call(addAccount);
            }).then(
            function (isAddrWhite) {
                assert.isFalse(isAddrWhite.valueOf(), "Address is whitelisted");
            });
    });

    it("test addBuyers function", function () {
        var addAccounts = [accounts[4], accounts[5]];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addBuyers(addAccounts, {from: addAccounts[0]});
            }).then(
            function () {
                assert.isFalse(true, "Expect access exception. The function is only for owner");
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception");
                return controller_instance.addBuyers(addAccounts);
            }).then(
            function () {
                return controller_instance.isAddressWhitelisted.call(addAccounts[0]);
            }).then(
            function (isWhitelisted) {
                assert.isTrue(isWhitelisted.valueOf(), "0 index address is not whitelisted");
                return controller_instance.isAddressWhitelisted.call(addAccounts[1]);
            }).then(
            function (isWhitelisted) {
                assert.isTrue(isWhitelisted.valueOf(), "1 index address is not whitelisted");
            });
    });

    it("test removeBuyers from whitelist", function () {
        var addAccounts = [accounts[6], accounts[7]];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addBuyers(addAccounts);
            }).then(
            function () {
                return controller_instance.removeBuyers(addAccounts);
            }).then(
            function () {
                return controller_instance.isAddressWhitelisted.call(addAccounts[0]);
            }).then(
            function (isWhitelisted) {
                assert.isFalse(isWhitelisted.valueOf(), "0 index address is whitelisted");
                return controller_instance.isAddressWhitelisted.call(addAccounts[1]);
            }).then(
            function (isWhitelisted) {
                assert.isFalse(isWhitelisted.valueOf(), "1 index address is whitelisted");
            });
    });
});

contract('ICO Controller Airdrop', function (accounts) {
    it("test addAirdrop", function () {
        var addAccounts = [accounts[1], accounts[2]];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.airdropList.call(addAccounts[0]);
            }).then(
            function (inDroplist) {
                assert.isFalse(inDroplist.valueOf(), "account in airdrop list by default");
                return controller_instance.totalAirdropAdrresses.call();
            }).then(
            function (totalAdrresses) {
                assert.equal(totalAdrresses.valueOf(), 0, "account total number is not 0 by default");
                return controller_instance.addAirdrop(addAccounts);
            }).then(
            function () {
                return controller_instance.totalAirdropAdrresses.call();
            }).then(
            function (total_addr) {
                assert.equal(total_addr.valueOf(), addAccounts.length, "Expect totalAirdropAdrresses become: " + addAccounts.length);
                return controller_instance.airdropList.call(addAccounts[0]);
            }).then(
            function (inDroplist) {
                assert.isTrue(inDroplist.valueOf(), "Excpect Account 0 to be in airdrop list");
                return controller_instance.airdropList.call(addAccounts[1]);
            }).then(
            function (inDroplist) {
                assert.isTrue(inDroplist.valueOf(), "Excpect Account 1 to be in airdrop list");
            });
    });

    it("test removeAirdrop", function () {
        var addAccounts = [accounts[3], accounts[4]];
        var controller_instance;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addAirdrop(addAccounts);
            }).then(
            function () {
                return controller_instance.removeAirdrop(addAccounts);
            }).then(
            function () {
                return controller_instance.airdropList.call(addAccounts[0]);
            }).then(
            function (inDroplist) {
                assert.isFalse(inDroplist.valueOf(), "Excpect Account 0 not to be in airdrop list");
                return controller_instance.airdropList.call(addAccounts[1]);
            }).then(
            function (inDroplist) {
                assert.isFalse(inDroplist.valueOf(), "Excpect Account 1 not to be in airdrop list");
            });
    });
});

contract('ICO Controller Airdrop long', function (accounts) {
    it("test getAirdropTokens", function () {
        var addAccounts = [accounts[3], accounts[4]];
        var controller_instance;
        var token_instance;
        var airdropTokensSupply;
        var expectAirdropTokensSupply = 5000000000000000000000000;
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addAirdrop(addAccounts);
            }).then(
            function () {
                // stat ICOs
                return controller_instance.startPrivateOffer(
                    Math.ceil(Date.now() / 1000), Math.ceil(Date.now() / 1000));
            }).then(
            function () {
                wait(2);
                return controller_instance.startPreSaleIco(
                    Math.ceil(Date.now() / 1000), Math.ceil(Date.now() / 1000));
            }).then(
            function () {
                wait(2);
                return controller_instance.startCrowdsale(
                    Math.ceil(Date.now() / 1000), Math.ceil(Date.now() / 1000));
            }).then(
            function () {
                wait(20);
                return controller_instance.finishCrowdsale();
            }).then(
            function () {
                return controller_instance.getAirdropTokens();
            }).then(
            function () {
                assert.isFalse(true, "Expect access exception. The function is only for airdrop accounts")
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception");
                return controller_instance.getAirdropTokens({from: addAccounts[0]});
            }).then(
            function () {
                return controller_instance.token();
            }).then(
            function (token_addr) {
                token_instance = Token.at(token_addr);
                return controller_instance.AIRDROP_SUPPLY.call();
            }).then(
            function (amount) {
                airdropTokensSupply = amount.valueOf();
                assert.equal(airdropTokensSupply, expectAirdropTokensSupply, "Wrong amount of airdrop tokens");
                return token_instance.balanceOf(addAccounts[0]);
            }).then(
            function (balance) {
                assert.equal(balance.valueOf(), expectAirdropTokensSupply / addAccounts.length, "Wrong amount of account token balance");
            });
    });

});

contract('ICO Controller dev reward', function (accounts) {
    it("test addDevReward", function () {
        var addAccount = accounts[2];
        var controller_instance;
        var expectedDevSupply = new BN('40000000000000000000000000', 10);
        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addDevReward(addAccount, 10, {from: addAccount});
            }).then(
            function () {
                assert.isFalse(true, "Expect access exception. The function is only for owner")
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception");
                return controller_instance.MAX_DEV_REWARD.call();
            }).then(
            function (supply) {
                supply = web3.utils.toBN(supply);
                assert.equal(supply.toString(), expectedDevSupply.toString(), "Unexpected devreward supply");
                return controller_instance.addDevReward(addAccount, (expectedDevSupply + 1).toString());
            }).then(
            function () {
                assert.isFalse(true, "Expect exception. Too many dev tokens required")
            }).catch(
            function (error) {
                assert.equal(error.toString(), 'Error: VM Exception while processing transaction: invalid opcode', "Excpected revert exception while attempt to add to many tokens");
                return controller_instance.addDevReward(addAccount, 10);
            }).then(
            function () {
                return controller_instance.devRewards.call(addAccount);
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), 10, "Wrong amount value");
                return controller_instance.totalDevReward.call();
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), 10, "wrong total amount value");
                return controller_instance.addDevReward(addAccount, expectedDevSupply - 9);
            }).then(
            function () {
                assert.isFalse(true, "Expect exception. Too many dev tokens required");
            }).catch(
            function (error) {
                assert.equal(error.toString(), 'Error: VM Exception while processing transaction: invalid opcode', "Excpected revert exception too");
            });
    });

    it("test addRewards", function () {
        var addAccounts = [accounts[3], accounts[4]];
        var amounts = [11, 12];
        var controller_instance;

        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addRewards(addAccounts, amounts, {from: addAccounts[0]});
            }).then(
            function () {
                assert.isFalse(true, "Expect access exception. The function is only for owner")
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception");
                return controller_instance.addRewards(addAccounts, amounts)
            }).then(
            function () {
                return controller_instance.devRewards.call(addAccounts[0]);
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), amounts[0], "Wrong amount for 0 index account");
                return controller_instance.devRewards.call(addAccounts[1]);
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), amounts[1], "Wrong amount for 1 index account");
                return controller_instance.totalDevReward.call();
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), 10 + amounts[0] + amounts[1], "Wrong totalDevReward value");
            })
    });

});
*/
contract('ICO_controller tests constructor', async function(accounts) {
    /* Task 43 - Create test for ICO_controller constructor() */

    /* Using Truffle, we check constructor for ICO_controller and test if the all initialSupply is at controller balance. */
    it("should specify that all initialSupply is at the balance of controller", async function() {
        let contract = await Controller.deployed();
        let token_addr = await contract.token();
        let token = Token.at(token_addr);

        let controller_balance = await token.balanceOf.call(contract.address);
        let initialSupply = await token.INITIAL_SUPPLY.call();

        assert.isTrue(BigNumber(controller_balance).isEqualTo(BigNumber(initialSupply)), "Controller do not contain all initial balance.");
    });
});

contract('ICO_controller tests onlyICO', async function(accounts) {
    /* Task 44 - Create test for ICO_controller onlyIco modifier */

    /* Using Truffle, we check modifier for _ICO_controller onlyIco_ and test if the functions with this
       modifier rejected calls of the addresses which is not ICO contracts of this controller. */
    it("test the onlyIco modifier", async function() {
        let owner = accounts[0];
        let user = accounts[37];

        let contract = await Controller.deployed();

        try {
            await contract.addBuyerSpent(user, 1, {'from': owner});
            assert.ifError('Error, the owner should not be able to call this method');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };

        try {
            await contract.addBuyerSpent(owner, 1, {'from': user});
            assert.ifError('Error, the user should not be able to call this method');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });
});

contract('ICO_controller tests addDevReward', async function(accounts) {
    /* Task 47 - Create test for ICO_controller addDevReward */

    /* Test 5 variants:
       - regular1 address not in devRewards, address correct and MAX_DEV_REWARD - totalDevReward >= amount */
    it("test the addDevReward if it is first reward for address and this reward allowed", async function() {
        let owner = accounts[0];
        let user = accounts[38];

        let contract = await Controller.deployed();
        let max_reward = await contract.MAX_DEV_REWARD.call();
        let total_reward = await contract.totalDevReward.call();
        let total_reward_bn = BigNumber(total_reward);
        let reward = BigNumber(max_reward).minus(total_reward_bn).dividedBy(1000000000000).toNumber();

        await contract.addDevReward(user, reward, {'from': owner});

        let total_reward_after = await contract.totalDevReward.call();
        let total_reward_after_bn = BigNumber(total_reward_after);
        let dev_reward = await contract.devRewards.call(user);

        assert.equal(dev_reward.toNumber(), reward, 'The reward has the wrong value');
        assert.equal(total_reward_after_bn.minus(total_reward_bn).toNumber(), reward, 'The total reward has changed to an incorrect value.');
    });

    /* regular2 address in devRewards and MAX_DEV_REWARD - totalDevReward >= amount */
    it("test the addDevReward if it isn't first reward for address and this reward allowed", async function() {
        let owner = accounts[0];
        let user = accounts[39];

        let contract = await Controller.deployed();
        let max_reward = await contract.MAX_DEV_REWARD.call();
        let total_reward = await contract.totalDevReward.call();
        let total_reward_bn = BigNumber(total_reward);
        let reward = BigNumber(max_reward).minus(total_reward_bn).dividedBy(1000000000000).toNumber();

        await contract.addDevReward(user, reward, {'from': owner});
        await contract.addDevReward(user, reward, {'from': owner});

        let total_reward_after = await contract.totalDevReward.call();
        let total_reward_after_bn = BigNumber(total_reward_after);
        let dev_reward = await contract.devRewards.call(user);

        assert.equal(dev_reward.toNumber(), reward * 2, 'The reward has the wrong value');
        assert.equal(total_reward_after_bn.minus(total_reward_bn).toNumber(), reward * 2, 'The total reward has changed to an incorrect value.');
    });

    /* address is zero */
    it("test the addDevReward if reward assign to zero address", async function() {
        let owner = accounts[0];
        let zero_address = '0x0';

        let contract = await Controller.deployed();
        let max_reward = await contract.MAX_DEV_REWARD.call();
        let total_reward = await contract.totalDevReward.call();
        let total_reward_bn = BigNumber(total_reward);
        let reward = BigNumber(max_reward).minus(total_reward_bn).dividedBy(1000000000000).toNumber();

        try {
            await contract.addDevReward(zero_address, reward, {'from': owner});
            assert.ifError('Error, the owner should not be able to specify reward for zero address');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* address is correct, not in devRewards and MAX_DEV_REWARD - totalDevReward < amount */
    it("test the addDevReward if it is first reward for address and this reward not allowed", async function() {
        let owner = accounts[0];
        let user = accounts[40];

        let contract = await Controller.deployed();
        let max_reward = await contract.MAX_DEV_REWARD.call();
        let total_reward = await contract.totalDevReward.call();
        let total_reward_bn = BigNumber(total_reward);
        // add to max reward 1000000000000 because in order to compare numbers in js is not enough bit capacity with a smaller difference
        let reward = BigNumber(max_reward).minus(total_reward_bn).plus(1000000000000).toNumber();

        try {
            await contract.addDevReward(user, reward, {'from': owner});
            assert.ifError('Error, the owner should not be able to specify reward for zero address');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* address is correct, in devRewards and MAX_DEV_REWARD - totalDevReward < amount */
    it("test the addDevReward if it is second reward for address and this reward not allowed", async function() {
        let owner = accounts[0];
        let user = accounts[41];

        let contract = await Controller.deployed();
        let max_reward = await contract.MAX_DEV_REWARD.call();
        let total_reward = await contract.totalDevReward.call();
        let total_reward_bn = BigNumber(total_reward);
        let base_reward = BigNumber(max_reward).minus(total_reward_bn);
        let first_reward = base_reward.minus(2000000000000);
        let add_reward = 3000000000000;

        await contract.addDevReward(user, first_reward.toNumber(), {'from': owner});

        try {
            await contract.addDevReward(user, add_reward, {'from': owner});
            assert.ifError('Error, the owner should not be able to specify reward for zero address');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });
});