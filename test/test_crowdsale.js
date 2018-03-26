"use strict";

const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");

contract('ICO_crowdsale test', async (accounts) => {
    /* Task 41 - Create test for ICO_crowdsale getTokenAmount() */

    const owner = accounts[0];
    const user = accounts[1];

    const ether_0 = web3.toWei(0, 'ether');
    const ether_5 = web3.toWei(5, 'ether');
    const ether_10 = web3.toWei(10, 'ether');
    const ether_25 = web3.toWei(25, 'ether');
    const ether_100 = web3.toWei(100, 'ether');

    const rate = 10;

    const testWeiAmount = ether_0;

    it('should add nothing to bonus amount for with 0 <= weiAmount < 10 ', async function () {
        let weiAmount = ether_5;

        let basicAmount = weiAmount * rate;
        let bonusAmount = 0;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let balance = await web3.eth.getBalance(owner);
        let balance_before = web3.fromWei(balance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: user, to: owner, value: weiAmount, gasLimit: 6721975, gasPrice: 20000000000});

        balance = await web3.eth.getBalance(owner);

        let balance_after = web3.fromWei(balance.toNumber(), 'ether');

        let amount = await web3.toWei((balance_after - balance_before), 'ether');

        let tokenAmount = await contract.getTokenAmount(amount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 10% to bonus amount for 10 <= weiAmount < 25', async function () {
        let weiAmount = ether_10;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.1;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let balance = await web3.eth.getBalance(owner);
        let balance_before = web3.fromWei(balance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: user, to: owner, value: weiAmount, gasLimit: 6721975, gasPrice: 20000000000});

        balance = await web3.eth.getBalance(owner);

        let balance_after = web3.fromWei(balance.toNumber(), 'ether');

        let amount = await web3.toWei((balance_after - balance_before), 'ether');

        let tokenAmount = await contract.getTokenAmount(amount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 15% to bonus amount for  25 <= weiAmount < 100', async function () {
        let weiAmount = ether_25;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.15;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let balance = await web3.eth.getBalance(owner);
        let balance_before = web3.fromWei(balance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: user, to: owner, value: weiAmount, gasLimit: 6721975, gasPrice: 20000000000});

        balance = await web3.eth.getBalance(owner);

        let balance_after = web3.fromWei(balance.toNumber(), 'ether');

        let amount = await web3.toWei((balance_after - balance_before), 'ether');

        let tokenAmount = await contract.getTokenAmount(amount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 20% to bonus amount for weiAmount >= 100  ', async function () {
        let weiAmount = ether_100;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.2;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let balance = await web3.eth.getBalance(owner);
        let balance_before = web3.fromWei(balance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: user, to: owner, value: weiAmount, gasLimit: 6721975, gasPrice: 20000000000});

        balance = await web3.eth.getBalance(owner);

        let balance_after = web3.fromWei(balance.toNumber(), 'ether');

        let amount = await web3.toWei((balance_after - balance_before), 'ether');

        let tokenAmount = await contract.getTokenAmount(amount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });
});