var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var Web3 = require('web3');


Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));



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
    it("Check initialization: Token creation", function () {
        var owner = accounts[0];
        var controller_instance;
        var token_instance;
        var controller_balance;
        return Controller.deployed().then(
            function (instance) {
                controller_instance = instance;
                return instance.token();
            }
        ).then(
            function (token_addr) {
                token_instance = Token.at(token_addr);
                return token_instance.balanceOf(controller_instance.address);
            }).then(
            function (balance) {
                controller_balance = balance.valueOf();
                return token_instance.INITIAL_SUPPLY();
            }).then(
            function (initial_balance) {
                assert.equal(initial_balance.valueOf(), controller_balance, "Controller do not contain all initial balance.")
            });
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
                return controller_instance.addBuyers(addAccounts, {from: addAccount});
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
        var devRewardSupply;
        var expectedDevSupply = 40000000000000000000000000;
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
                devRewardSupply = supply.valueOf();
                assert.equal(devRewardSupply, expectedDevSupply, "Unexpected devreward supply");
                return controller_instance.addDevReward(addAccount, devRewardSupply + 1);
            }).then(
            function () {
                assert.isFalse(true, "Expect exception. Too many dev tokens required")
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception while attempt to add to many tokens");
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
                return controller_instance.addDevReward(addAccount, devRewardSupply - 9);
            }).then(
            function () {
                assert.isFalse(true, "Expect exception. Too many dev tokens required");
            }).catch(
            function (error) {
                assert.equal(error, 'Error: VM Exception while processing transaction: revert', "Excpected revert exception too");
            });
    });

    it("test addRewards", function () {
        var addAccounts = [accounts[3], accounts[4]];
        var amounts = [11, 12];
        var controller_instance;

        return Controller.deployed().then(
            function (inst) {
                controller_instance = inst;
                return controller_instance.addRewards(addAccounts, amounts, {from: addAccount});
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
                assert.equal(amount.valueOf(), amounts[1], "Wrong amount for 0 index account");
                return controller_instance.totalDevReward.call();
            }).then(
            function (amount) {
                assert.equal(amount.valueOf(), 10 + amounts[0] + amounts[1], "Wrong totalDevReward value");
            })
    });

});