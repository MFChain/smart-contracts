const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(MFC_Token);

    let owner = accounts[0];
    let user = accounts[1];

    let startTime = Date.now();
    let endTime = startTime + 1000;
    let rate = 10;
    let minPurchase = 1;
    let maxPurchase = 1000;
    let wallet = user;
    let countPurchaseAmount = false;
    let token =  MFC_Token.new({from: owner});

    deployer.deploy(WhitelistedCrowdsale,
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
};