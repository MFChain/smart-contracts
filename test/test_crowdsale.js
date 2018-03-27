const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");

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
