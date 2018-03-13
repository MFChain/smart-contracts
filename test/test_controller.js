var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var Web3 = require('web3');
var BigNumber = require('bignumber.js');


Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));



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
        };
    });
});