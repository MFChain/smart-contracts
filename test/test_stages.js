var Token = artifacts.require("MFC_Token");
var Controller = artifacts.require("ICO_controller");
var Holder = artifacts.require("Holder");
var TokenHolder = artifacts.require("TokenHolder");
var WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;


contract('ICO Private Offer', async function (accounts) {
    it("test Private Offer stage", async function () {
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
        wait(1);
        try {
            await privateOffer.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(10, 'ether')
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
        let expectedTokenBalance = BigNumber(web3.toWei(120000, 'ether'));
        let actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase without bonus");

        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(25, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(345000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 15% bonus");

        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(100, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(1440000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 20% bonus");

        let expectedEthBalance = BigNumber(web3.toWei(135, 'ether'));
        let actualEthBalance = BigNumber(await web3.eth.getBalance(escrowAddress)).minus(escrowAddressInitialBalance);
        assert.isTrue(expectedEthBalance.isEqualTo(actualEthBalance), "Wrong Ethereum balance of escrow address");

        let expectedBuyerSpent = BigNumber(0);
        let actualBuyerSpent = BigNumber(await controller_instance.buyerSpent(buyerAddress));
        assert.isTrue(expectedBuyerSpent.isEqualTo(actualBuyerSpent), "Wrong Buyer Spent amount for private offer");
    });
});

contract('ICO Presale', async function (accounts) {
    it("test Presale stage", async function () {
        let controller_instance = await Controller.deployed();
        let token = await Token.at(await controller_instance.token.call());
        let escrowAddress = controller_instance.address;
        let escrowAddressInitialBalance = BigNumber(await web3.eth.getBalance(escrowAddress));
        let buyerAddress = accounts[2];

        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000);
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            escrowAddress);
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000) + 100;
        await controller_instance.startPreSaleIco(
            startTime,
            endTime);
        wait(1);

        let preSale = await WhitelistedCrowdsale.at(await controller_instance.preSale.call());
        try {
            await preSale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(5, 'ether')
            });
            assert.ifError("Error, not whitlisted buyers shouldn't be able to buy tokens");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after buying tokens as not KYC");
        }
        await controller_instance.addBuyerToWhitelist(buyerAddress);

        try {
            await preSale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(4.9, 'ether')
            });
            assert.ifError('Error, mininmum amount of ETH at presale stage is 5 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too small amount of ether");
        }

        try {
            await preSale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(201, 'ether')
            });
            assert.ifError('Error, maximum amount of ETH at presale stage is 200 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected rever error after sending too big amount of ether");
        }


        await preSale.sendTransaction({from: buyerAddress, value: web3.toWei(5, 'ether')});
        let expectedTokenBalance = BigNumber(web3.toWei(50750, 'ether'));
        let actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase without bonus");

        await preSale.sendTransaction({from: buyerAddress, value: web3.toWei(10, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(111650, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 10% bonus");

        await preSale.sendTransaction({from: buyerAddress, value: web3.toWei(25, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(291812.5, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 15% bonus");

        await preSale.sendTransaction({from: buyerAddress, value: web3.toWei(100, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(1218000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 20% bonus");

        let expectedEthBalance = BigNumber(web3.toWei(140, 'ether'));
        let actualEthBalance = BigNumber(await web3.eth.getBalance(escrowAddress)).minus(escrowAddressInitialBalance);
        assert.isTrue(expectedEthBalance.isEqualTo(actualEthBalance), "Wrong Ethereum balance of escrow address");

        let expectedBuyerSpent = BigNumber(web3.toWei(140, 'ether'));
        let actualBuyerSpent = BigNumber(await controller_instance.buyerSpent(buyerAddress));
        assert.isTrue(expectedBuyerSpent.isEqualTo(actualBuyerSpent), "Wrong Buyer Spent amount for presale");
    });
});

contract('ICO Crowdsale', async function (accounts) {
    it("test Crowdsale stage", async function () {
        let controller_instance = await Controller.deployed();
        let token = await Token.at(await controller_instance.token.call());
        let escrowAddress = controller_instance.address;
        let escrowAddressInitialBalance = BigNumber(await web3.eth.getBalance(escrowAddress));
        let buyerAddress = accounts[2];

        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000);
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            escrowAddress);
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000);
        await controller_instance.startPreSaleIco(
            startTime,
            endTime);
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000) + 100;
        await controller_instance.startCrowdsale(
            startTime,
            endTime);
        wait(1);

        let crowdsale = await WhitelistedCrowdsale.at(await controller_instance.crowdsale.call());
        try {
            await crowdsale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(0.1, 'ether')
            });
            assert.ifError("Error, not whitlisted buyers shouldn't be able to buy tokens");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after buying tokens as not KYC");
        }
        await controller_instance.addBuyerToWhitelist(buyerAddress);

        try {
            await crowdsale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(0.09, 'ether')
            });
            assert.ifError('Error, mininmum amount of ETH at crowdsale stage is 0.1 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after sending too small amount of ether");
        }

        try {
            await crowdsale.sendTransaction({
                from: buyerAddress,
                value: web3.toWei(201, 'ether')
            });
            assert.ifError('Error, maximum amount of ETH at crowdsale stage is 200 ETH');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after sending too big amount of ether");
        }


        await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(0.1, 'ether')});
        let expectedTokenBalance = BigNumber(web3.toWei(850, 'ether'));
        let actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase without bonus");

        await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(10, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(93500, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 10% bonus");

        await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(25, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(244375, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 15% bonus");

        await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(100, 'ether')});
        expectedTokenBalance = expectedTokenBalance.plus(BigNumber(web3.toWei(1020000, 'ether')));
        actualTokenBalance = await token.balanceOf(buyerAddress);
        assert.isTrue(expectedTokenBalance.isEqualTo(actualTokenBalance), "Wrong balance for purchase with 20% bonus");

        let expectedEthBalance = BigNumber(web3.toWei(135.1, 'ether'));
        let actualEthBalance = BigNumber(await web3.eth.getBalance(escrowAddress)).minus(escrowAddressInitialBalance);
        assert.isTrue(expectedEthBalance.isEqualTo(actualEthBalance), "Wrong Ethereum balance of escrow address");

        let expectedBuyerSpent = BigNumber(web3.toWei(135.1, 'ether'));
        let actualBuyerSpent = BigNumber(await controller_instance.buyerSpent(buyerAddress));
        assert.isTrue(expectedBuyerSpent.isEqualTo(actualBuyerSpent), "Wrong Buyer Spent amount for presale");
    });
});


contract('ICO didn\'t reach Softcup', async function (accounts) {
    it("test refund function", async function () {
        let controller_instance = await Controller.deployed();
        let buyerAddress = accounts[2];
        let buyerAddress2 = accounts[3];
        let holder =
        await controller_instance.addBuyerToWhitelist(buyerAddress);
        await controller_instance.addBuyerToWhitelist(buyerAddress2);

        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000);
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            controller_instance.address);
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000);
        await controller_instance.startPreSaleIco(
            startTime,
            endTime);
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000) + 1;
        await controller_instance.startCrowdsale(
            startTime,
            endTime);
        wait(1);
        let crowdsale = await WhitelistedCrowdsale.at(await controller_instance.crowdsale.call());
        await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(0.1, 'ether')});
        await crowdsale.sendTransaction({from: buyerAddress2, value: web3.toWei(0.1, 'ether')});
        wait(2);

        try{
            await controller_instance.refund();
            assert.ifError('Error, only investor can refund');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after wrong refund");
        }

        let beforeRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress));
        await controller_instance.refund({from:buyerAddress});
        let afterRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress));
        let balanceDiff = afterRefundBalance.minus(beforeRefundBalance);
        assert.isTrue(balanceDiff.gt(BigNumber(web3.toWei(0.09, 'ether')))
            && balanceDiff.lt(BigNumber(web3.toWei(0.1, 'ether'))),
            "Wrong refund balance");
        try{
            await controller_instance.refund({from:buyerAddress});
            assert.ifError('Error, it is possible to refund only one time');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after second refund");
        }

        beforeRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress2));
        await controller_instance.refund({from:buyerAddress2});
        afterRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress2));
        balanceDiff = afterRefundBalance.minus(beforeRefundBalance);
        assert.isTrue(balanceDiff.gt(BigNumber(web3.toWei(0.09, 'ether')))
            && balanceDiff.lt(BigNumber(web3.toWei(0.1, 'ether'))),
            "Wrong second's user refund balance");

    });
});

contract('ICO success', async function (accounts) {

    it("test refund function", async function () {
        let controller_instance = await Controller.deployed();
        let holder = await Holder.deployed();
        let tokenHolder = await TokenHolder.deployed();
        let buyerAddress = accounts[2];
        let escrowAddress = accounts[4];
        let escrowAddressInitialBalance = BigNumber(await web3.eth.getBalance(escrowAddress));
        await controller_instance.addBuyerToWhitelist(buyerAddress);
        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000) + 1;
        await controller_instance.startPrivateOffer(
            startTime,
            endTime,
            controller_instance.address);
        wait(1);
        let privateOffer = await WhitelistedCrowdsale.at(await controller_instance.privateOffer.call());
        await privateOffer.sendTransaction({from: buyerAddress, value: web3.toWei(120, 'ether')});
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000) + 1;
        await controller_instance.startPreSaleIco(
            startTime,
            endTime);
        wait(1);
        let preSale = await WhitelistedCrowdsale.at(await controller_instance.preSale.call());
        await preSale.sendTransaction({from: buyerAddress, value: web3.toWei(200, 'ether')});
        wait(2);
        startTime = Math.ceil(Date.now() / 1000);
        endTime = Math.ceil(Date.now() / 1000) + 2;
        await controller_instance.startCrowdsale(
            startTime,
            endTime);
        wait(1);
        let crowdsale = await WhitelistedCrowdsale.at(await controller_instance.crowdsale.call());

        for (let i = 0; i<22; i++){
            await crowdsale.sendTransaction({from: buyerAddress, value: web3.toWei(200, 'ether')});
        }
        wait(2);
        try{
            await controller_instance.refund({from:buyerAddress});
            assert.ifError('Error, it is possible to refund if Softcup reached');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Expected revert error after refund");
        }


        let expectedHalfEscrowAmount = BigNumber(web3.toWei(2360, 'ether'));
        await controller_instance.finishCrowdsale();
        let actualEscrowBalance = BigNumber(await web3.eth.getBalance(escrowAddress))
            .minus(escrowAddressInitialBalance);
        assert.isTrue(actualEscrowBalance.isEqualTo(expectedHalfEscrowAmount), "Wrong amount of ether at escrow balance");



        // let beforeRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress));
        // wait(2);
        // await controller_instance.refund({from:buyerAddress});
        // let afterRefundBalance = BigNumber(await web3.eth.getBalance(buyerAddress));
        // let balanceDiff = afterRefundBalance.minus(beforeRefundBalance);
        // assert.isTrue(balanceDiff.gt(BigNumber(web3.toWei(0.09, 'ether')))
        //     && balanceDiff.lt(BigNumber(web3.toWei(0.1, 'ether'))),
        //     "Wrong refund balance");
    });
});