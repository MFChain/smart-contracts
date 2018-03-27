var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;


contract('Private Offer', async function (accounts) {


    it("test Private Offer", async function () {
        let controller_instance = await Controller.deployed();
        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000) + 100;
        let escrowAddress = accounts[5];
        let escrowAddressInitialBalance = BigNumber(await web3.eth.getBalance(escrowAddress));
        let buyerAddress = accounts[2];
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            escrowAddress);
        let privateOffer = await WhitelistedCrowdsale.at(await controller_instance.privateOffer.call());
        let token = await Token.at(await controller_instance.token.call());
        wait(2);
        try {
            await privateOffer.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(1, 'ether')
            });
            assert.ifError("Error, not whitlisted buyers shouldn't be able to buy tokens");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after buying tokens as not KYC");
        }
        await controller_instance.addBuyerToWhitelist(buyerAddress);

        try {
            await privateOffer.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(9.9, 'ether')
            });
            assert.ifError('Error, mininmum amount of ETH at private offer stage is 10 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too small amount of ether");
        }

        try {
            await privateOffer.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(201, 'ether')
            });
            assert.ifError('Error, maximum amount of ETH at private offer stage is 200 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too big amount of ether");
        }


        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(10, 'ether')});
        let expectedTokenBalance = BigNumber(await web3.toWei(120000, 'ether'));
        let actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase without bonus");

        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(25, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(await web3.toWei(345000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 15% bonus");

        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(100, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(await web3.toWei(1440000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 20% bonus");

        let expectedEthBalance = BigNumber(await web3.toWei(135, 'ether'));
        let actualEthBalance = BigNumber(await web3.eth.getBalance(escrowAddress)).minus(escrowAddressInitialBalance);
        assert.isTrue(expectedEthBalance.isEqualTo(actualEthBalance), "Wrong Ethereum balance of escrow address");

        let expectedBuyerSpent = BigNumber(0);
        let actualBuyerSpent = BigNumber(await controller_instance.buyerSpent(buyerAddress));
        assert.isTrue(expectedBuyerSpent.isEqualTo(actualBuyerSpent), "Wrong Buyer Spent amount for private offer");

    });
});