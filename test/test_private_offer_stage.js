var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('Private Offer', async function (accounts) {


    it("test Private Offer", async function () {

        let controller_instance = await Controller.deployed();
        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000) + 100;
        let initialBalance = web3.eth.getBalance(accounts[5]);
        let escrowAddress = accounts[5];
        let buyerAddress = accounts[2];
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            escrowAddress);
        let privateOffer = new WhitelistedCrowdsale(await controller_instance.privateOffer.call());
        let token = new Token(await controller_instance.token.call());
        wait(5);
        try {
            await web3.eth.sendTransaction(
                {
                    from: buyerAddress,
                    to: privateOffer.address,
                    value: web3.toWei(1, 'ether')
                });

            assert.ifError('Error, not whitlisted buyers should be able to buy tokens');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after buying tokens as not KYC");
        }
        await controller_instance.addBuyerToWhitelist(buyerAddress);

        try {
            await web3.eth.sendTransaction(
                {
                    from: buyerAddress,
                    to: privateOffer.address,
                    value: web3.toWei(0.5, 'ether')
                });

            assert.ifError('Error, mininmum amount of ETH at private offer stage is 1 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too small amount of ether");
        }
        try {
            await web3.eth.sendTransaction(
                {
                    from: buyerAddress,
                    to: privateOffer.address,
                    value: web3.toWei(201, 'ether')
                });

            assert.ifError('Error, maximum amount of ETH at private offer stage is 200 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too big amount of ether");
        }

        await web3.eth.sendTransaction(
            {
                from: buyerAddress,
                to: privateOffer.address,
                value: web3.toWei(5, 'ether'),

            });


    });
});