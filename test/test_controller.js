var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var IcoControllerMock = artifacts.require("IcoControllerMock");
var WhitelistedCrowdsale =artifacts.require("WhitelistedCrowdsale");
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;


contract('ICO_controller tests constructor', async function (accounts) {
    /* Task 43 - Create test for ICO_controller constructor() */

    /* Using Truffle, we check constructor for ICO_controller and test if the all initialSupply is at controller balance. */
    it("should specify that all initialSupply is at the balance of controller", async function () {
        let contract = await Controller.deployed();
        let token_addr = await contract.token();
        let token = Token.at(token_addr);

        let controller_balance = await token.balanceOf.call(contract.address);
        let initialSupply = await token.INITIAL_SUPPLY.call();

        assert.isTrue(BigNumber(controller_balance).isEqualTo(BigNumber(initialSupply)), "Controller do not contain all initial balance.");
    });
});

contract('ICO_controller tests onlyICO', async function (accounts) {
    /* Task 44 - Create test for ICO_controller onlyIco modifier */

    /* Using Truffle, we check modifier for _ICO_controller onlyIco_ and test if the functions with this
     modifier rejected calls of the addresses which is not ICO contracts of this controller. */
    it("test the onlyIco modifier", async function () {
        let owner = accounts[0];
        let user = accounts[37];

        let contract = await Controller.deployed();

        try {
            await contract.addBuyerSpent(user, 1, {'from': owner});
            assert.ifError('Error, the owner should not be able to call this method');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the function from non-Ico address");
        }

        try {
            await contract.addBuyerSpent(owner, 1, {'from': user});
            assert.ifError('Error, the user should not be able to call this method');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "WWrong error after try to use the function from non-Ico address");
        }
    });
});

contract('ICO_controller tests addDevReward', async function (accounts) {
    /* Task 47 - Create test for ICO_controller addDevReward */

    /* Test 5 variants:
     - regular1 address not in devRewards, address correct and MAX_DEV_REWARD - totalDevReward >= amount */
    it("test the addDevReward if it is first reward for address and this reward allowed", async function () {
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
    it("test the addDevReward if it isn't first reward for address and this reward allowed", async function () {
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
    it("test the addDevReward if reward assign to zero address", async function () {
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
        }
    });

    /* address is correct, not in devRewards and MAX_DEV_REWARD - totalDevReward < amount */
    it("test the addDevReward if it is first reward for address and this reward not allowed", async function () {
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
        }
    });

    /* address is correct, in devRewards and MAX_DEV_REWARD - totalDevReward < amount */
    it("test the addDevReward if it is second reward for address and this reward not allowed", async function () {
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
    });

});

contract('ICO_controller tests getDevReward', async function(accounts) {
    let owner = accounts[0];
    let holder = accounts[1];
    let escrowAccount = accounts[2];
    let user = accounts[3];
    let otherUser = accounts[4];

    let controllerInstance = null;
    let maxReward = null;
    let token = null;
    let totalReward = null;
    let totalRewardBn = null;
    let rewardBn = null;
    let reward = null;

    beforeEach(async function() {
        controllerInstance = await IcoControllerMock.new(
            holder, escrowAccount,
            {from: owner}
        );
        token = Token.at(await controllerInstance.token.call());
        maxReward = await controllerInstance.MAX_DEV_REWARD.call();
        totalReward = await controllerInstance.totalDevReward.call();
        totalRewardBn = BigNumber(totalReward);
        rewardBn = BigNumber(maxReward).minus(totalRewardBn).dividedBy(1000000000000)
        reward = rewardBn.toNumber();
    });

    it("should throw error when devRewardReleaseTime >= now", async function() {
        await controllerInstance.addDevReward(user, reward, {'from': owner});

        let now = Math.ceil(Date.now() / 1000);

        await controllerInstance.setDevRewardReleaseTime.sendTransaction(now + 100);
        try {
            await controllerInstance.getDevReward.sendTransaction({from: user});
            assert.ifError('Error, devRewardReleaseTime < now');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "devRewardReleaseTime >= now");
        }
    });

    it("test when msg.sender in mapping and amount > 0", async function() {
        await controllerInstance.addDevReward(user, reward, {'from': owner});

        let now = Math.ceil(Date.now() / 1000);
        let currentUserBalance = await token.balanceOf(user);

        await controllerInstance.setDevRewardReleaseTime.sendTransaction(now - 100);
        await controllerInstance.getDevReward.sendTransaction({from: user});

        let newUserBalance = await token.balanceOf(user);
        assert.isOk(newUserBalance.eq(currentUserBalance.plus(rewardBn)));
    });

    it("test when msg.sender in mapping and amount = 0", async function() {
        rewardBn = BigNumber(0);
        reward = rewardBn.toNumber();

        await controllerInstance.addDevReward(user, reward, {'from': owner});

        let now = Math.ceil(Date.now() / 1000);
        let currentUserBalance = await token.balanceOf(user);

        await controllerInstance.setDevRewardReleaseTime.sendTransaction(now - 100);
        await controllerInstance.getDevReward.sendTransaction({from: user});

        let newUserBalance = await token.balanceOf(user);
        assert.isOk(newUserBalance.eq(currentUserBalance.plus(rewardBn)));
    });

    it("test when msg.sender not in mapping", async function() {
        await controllerInstance.addDevReward(user, reward, {'from': owner});

        let now = Math.ceil(Date.now() / 1000);
        let currentOtherUserBalance = await token.balanceOf(otherUser);

        await controllerInstance.setDevRewardReleaseTime.sendTransaction(now - 100);
        await controllerInstance.getDevReward.sendTransaction({from: otherUser});

        let newOtherUserBalance = await token.balanceOf(otherUser);
        assert.isOk(newOtherUserBalance.eq(currentOtherUserBalance));
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

contract('ICO_controller', async function (accounts) {
    it("test increasePrivateOfferEndTime func", async function () {

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
            await controller_instance.increaseCurrentIcoEndTime(newEndTime, {'from': accounts[1]});
            assert.ifError('Only owner should not be able to run increaseCurrentIcoEndTime');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after run increaseCurrentIcoEndTime as user");
        }
        try {
            await controller_instance.increaseCurrentIcoEndTime(endTime);
            assert.ifError('New end time should be greater than previous one');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after run increaseCurrentIcoEndTime with wrong time");
        }

        await controller_instance.increaseCurrentIcoEndTime(newEndTime);
        assert.equal(newEndTime, await privateOffer.endTime.call(), "Wrong value of private offer endtime");
    });
});

contract("ICO Controller Airdrop", async function (accounts) {
    it('test sendAirdrop', async function () {
        let controller = await Controller.deployed();
        let token = await Token.at(await controller.token.call());
        let airdropAccounts = [accounts[6], accounts[7]];
        try {
            await controller.sendAirdrop(airdropAccounts, [100, 110], {from: airdropAccounts[0]});
            assert.ifError('Error, only owner should be able to use the function');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert',
                "Only owner should be able to use the function");
        }
        try {
            await controller.sendAirdrop(airdropAccounts, [web3.toWei(5000000, 'ether'), 1]);
            assert.ifError('Error, too big amount of tokens to send is allowed');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert',
                "It is shouldn't be able to transfer more tokens then airdrop supply");
        }
        let expectedTokenAmountAccount1 = web3.toWei(4999999, 'ether');
        let expectedTokenAmountAccount2 = 100;
        await controller.sendAirdrop(airdropAccounts, [expectedTokenAmountAccount1, expectedTokenAmountAccount2]);

        let actualTokenAmount1 = BigNumber(await token.balanceOf(airdropAccounts[0]));
        assert.isTrue(actualTokenAmount1.isEqualTo(expectedTokenAmountAccount1), "Wrong token balance account1");
        let actualTokenAmount2 = BigNumber(await token.balanceOf(airdropAccounts[1]));
        assert.isTrue(actualTokenAmount2.isEqualTo(expectedTokenAmountAccount2), "Wrong token balance account2");
    });

    it("test sender's whitelist", async function () {
        let controller = await Controller.deployed();
        let token = await Token.at(await controller.token.call());
        let airdropAccount = accounts[6];
        let receiverAccount = accounts[8];
        let tokenAmount = 100;

        await controller.sendAirdrop([airdropAccount], [tokenAmount]);
        try {
            await token.transfer(receiverAccount, tokenAmount, {from: airdropAccount});
            assert.ifError('Error, account is not whitelisted to send tokens, but it does');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert',
                "Error, account is not whitelisted to send tokens, but it does");
        }

        await controller.addToSendersWhitelist([airdropAccount]);
        await token.transfer(receiverAccount, tokenAmount, {from: airdropAccount});
        let receiverBalance = BigNumber(await token.balanceOf(receiverAccount));
        assert.isTrue(receiverBalance.isEqualTo(tokenAmount), "Wrong amount of tokens at receiver's account");

        await controller.sendAirdrop([receiverAccount], [tokenAmount]);
        await controller.removeFromSendersWhitelist([airdropAccount]);
        try {
            await token.transfer(receiverAccount, tokenAmount, {from: airdropAccount});
            assert.ifError('Error, account is not whitelisted to send tokens, but it does');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert',
                "Error, account is not whitelisted to send tokens, but it does");
        }
    });

});
