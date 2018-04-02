const ICO_controller = artifacts.require("ICO_controller");
const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
const wait = require('./utils').wait;

contract('ICO_crowdsale test getTokenAmount()', async (accounts) => {
    const ether_0 = web3.toWei(0, 'ether');
    const ether_5 = web3.toWei(5, 'ether');
    const ether_10 = web3.toWei(10, 'ether');
    const ether_25 = web3.toWei(25, 'ether');
    const ether_100 = web3.toWei(100, 'ether');

    const rate = 10;

    let weiAmount = ether_0;

    let contract = null;

    beforeEach("setup contract for each test", async () => {
      let owner = accounts[0];
      let user = accounts[1];
      let token = await MFC_Token.new({from: owner});

      let startTime = Date.now();
      let endTime = startTime + 1000;
      let rate = 10;
      let minPurchase = 1;
      let maxPurchase = 1000;
      let wallet = user;
      let countPurchaseAmount = false;

      contract = await WhitelistedCrowdsale.new(
        startTime,
        endTime,
        rate,
        minPurchase,
        maxPurchase,
        wallet,
        token.address,
        countPurchaseAmount,
        {from: owner}
      );
    });

    it('should add nothing to bonus amount for 0 <= weiAmount < 10 ', async function () {
        weiAmount = ether_5;

        let basicAmount = weiAmount * rate;
        let bonusAmount = 0;
        let expectedAmount = basicAmount + bonusAmount;

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let expectedAmountWei = await web3.fromWei(expectedAmount, 'ether');
        let actualAmountWei = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(expectedAmountWei, actualAmountWei);
    });

    it('should add 10% to bonus amount for 10 <= weiAmount < 25', async function () {
        weiAmount = ether_10;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.1;
        let expectedAmount = basicAmount + bonusAmount;

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let expectedAmountWei = await web3.fromWei(expectedAmount, 'ether');
        let actualAmountWei = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(expectedAmountWei, actualAmountWei);
    });

    it('should add 15% to bonus amount for 25 <= weiAmount < 100', async function () {
        weiAmount = ether_25;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.15;
        let expectedAmount = basicAmount + bonusAmount;

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let expectedAmountWei = await web3.fromWei(expectedAmount, 'ether');
        let actualAmountWei = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(expectedAmountWei, actualAmountWei);
    });

    it('should add 20% to bonus amount for weiAmount >= 100  ', async function () {
        weiAmount = ether_100;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.2;
        let expectedAmount = basicAmount + bonusAmount;

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let expectedAmountWei = await web3.fromWei(expectedAmount, 'ether');
        let actualAmountWei = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(expectedAmountWei, actualAmountWei);
    });
});

contract('ICO_crowdsale test validPurchase()', async (accounts) => {
    let owner = accounts[0];
    let holder = accounts[1];
    let escrowAccount = accounts[2];
    let beneficiary = accounts[3];
    let userNotFromWhitelist = accounts[4];

    let controller = null;
    let token = null;
    let instanceWhitelistedCrowdsale = null;

    before("setup contract for each test", async () => {
        controller = await ICO_controller.new(holder, escrowAccount, {from: owner});
        token = MFC_Token.at(await controller.token.call());
        let startTime = Math.ceil(Date.now() / 1000);
        let endTime = Math.ceil(Date.now() / 1000) + 100;
        await controller.startPrivateOffer(startTime, endTime, escrowAccount, {from: owner});
        instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
    });

    it("purchase not valid when the value = 0", async () => {
        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                beneficiary, {value: web3.toWei(0, "ether")}
            );
            assert.ifError('Error, value must be != 0');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "value = 0");
        }
    });

    it("purchase not valid when value > maxPurchase ", async () => {
        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                beneficiary, {value: web3.toWei(201, "ether")}
            );
            assert.ifError('Error, value must be <= maxPurchase ');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "value > maxPurchase");
        }
    });

    it("purchase not valid when value < minPurchase ", async () => {
        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                beneficiary, {value: web3.toWei(9.9, "ether")}
            );
            assert.ifError('Error, msg.value must be >= minPurchase ');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "msg.value < minPurchase");
        }
    });

    it("purchase not valid when the beneficiary not in whitelist", async () => {
        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                userNotFromWhitelist, {value: web3.toWei(10, "ether")}
            );
            assert.ifError('Error, the user that is not in whitelist should not be able to buy tokens');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary not in whitelist trying to buy tokens");
        }
    });
});

contract('ICO_crowdsale test validPurchase() time', async (accounts) => {
    let owner = accounts[0];
    let holder = accounts[1];
    let escrowAccount = accounts[2];
    let beneficiary = accounts[3];

    let controller = null;
    let token = null;
    let instanceWhitelistedCrowdsale = null;

    it("purchase not valid when now < startTime && now > endTime", async () => {
        controller = await ICO_controller.new(holder, escrowAccount, {from: owner});
        token = MFC_Token.at(await controller.token.call());
        let startTime = Math.ceil(Date.now() / 1000) + 1;
        let endTime = Math.ceil(Date.now() / 1000) + 3;
        await controller.startPrivateOffer(startTime, endTime, escrowAccount, {from: owner});
        instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
        await controller.addBuyers([beneficiary], {from: owner});

        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                beneficiary, {value: web3.toWei(12, "ether")}
            );
            assert.ifError('Error, now should be >= startTime');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "now < startTime");
        }

        wait(5); // waiting for current time to go beyond the endTime

        try {
            await instanceWhitelistedCrowdsale.buyTokens(
                beneficiary, {value: web3.toWei(12, "ether")}
            );
            assert.ifError('Error, now should be <= endTime');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "now > endTime");
        }
    });
});
