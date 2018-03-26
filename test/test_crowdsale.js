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

    it('should add nothing to bonus amount for with 0 <= weiAmount < 10 ', async function () {
        weiAmount = ether_5;

        let basicAmount = weiAmount * rate;
        let bonusAmount = 0;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 10% to bonus amount for 10 <= weiAmount < 25', async function () {
        weiAmount = ether_10;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.1;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 15% to bonus amount for  25 <= weiAmount < 100', async function () {
        weiAmount = ether_25;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.15;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });

    it('should add 20% to bonus amount for weiAmount >= 100  ', async function () {
        weiAmount = ether_100;

        let basicAmount = weiAmount * rate;
        let bonusAmount = basicAmount * 0.2;
        let result = basicAmount + bonusAmount;

        let contract = await WhitelistedCrowdsale.deployed();

        let tokenAmount = await contract.getTokenAmount(weiAmount);

        let res1 = await web3.fromWei(result, 'ether');
        let res2 = await web3.fromWei(tokenAmount.toNumber(), 'ether');

        assert.equal(res1, res2);
    });
});