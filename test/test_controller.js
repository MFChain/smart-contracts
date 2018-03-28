var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var WhitelistedCrowdsale =artifacts.require("WhitelistedCrowdsale");
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


contract('ICO_controller tests constructor', async function (accounts) {
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
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the function from non-Ico address");
        };

        try {
            await contract.addBuyerSpent(owner, 1, {'from': user});
            assert.ifError('Error, the user should not be able to call this method');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "WWrong error after try to use the function from non-Ico address");
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
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after attempt to add Dev Reward for zero address");
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
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after attempt to add Dev Reward more then available");
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
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after attempt to add Dev Reward more then available");
        }
        ;
    });

});

contract('ICO Controller', function (accounts) {
    it("should to change the owner of controller", async function () {
        let owner = accounts[0];
        let holder = accounts[1];
        let escrowAccount = accounts[2];
        let newOwner = accounts[3];
        let contract = await Controller.new(holder, escrowAccount, {from: owner});

        assert.equal(await contract.owner.call(), owner);

        await contract.transferOwnership.sendTransaction(newOwner, {from: owner});

        assert.equal(await contract.owner.call(), newOwner);
        assert.notEqual(await contract.owner.call(), owner);
    });
    
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
                return controller_instance.removeBuyerFromWhitelist(addAccount, {from: addAccount});
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

    it("test addAirdrop add one account twice and zero address", async function () {
        let controller = await Controller.deployed();
        let addAccounts = [accounts[10]];
        let zeroAccount = ['0x0000000000000000000000000000000000000000'];
        let controller_instance;

        try {
            await controller.addAirdrop(zeroAccount);
            assert.ifError("Expect exception. The function doesn't allow zero address");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception after attemp to add zero address");
        };
        await controller.addAirdrop(addAccounts);
        try {
            await controller.addAirdrop(addAccounts);
            assert.ifError("Expect exception. The function doesn't allow to add one address twice");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception after atempt to add one address twice");
        };

    });

});

contract('ICO_controller', async function (accounts) {
        it("test increasePrivateOfferEndTime func", async function() {

        let controller_instance = await Controller.deployed();
        let startTime = Math.ceil(Date.now() / 1000) + 3;
        let endTime = Math.ceil(Date.now() / 1000) + 5;
        let newEndTime = endTime + 10;
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            accounts[5]);

        let privateOffer = new WhitelistedCrowdsale(await controller_instance.privateOffer.call());

        try {
            await controller_instance.increasePrivateOfferEndTime(newEndTime, {'from': accounts[1]});
            assert.ifError('Only owner should not be able to run increasePrivateOfferEndTime');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after run increasePrivateOfferEndTime as user");
        };
        try{
            await controller_instance.increasePrivateOfferEndTime(endTime);
            assert.ifError('New end time should be greater than previous one');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after run increasePrivateOfferEndTime with wrong time");
        };

        await controller_instance.increasePrivateOfferEndTime(newEndTime);
        assert.equal(newEndTime, await privateOffer.endTime.call(), "Wrong value of private offer endtime");
    });
});

//The test checks airdrop correct amount of token distribution between aitdrop accounts after all ICOs finished
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
                    Math.ceil(Date.now() / 1000), Math.ceil(Date.now() / 1000), accounts[5]);
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
                wait(2);
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
