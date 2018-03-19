"use strict";

const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");

contract('WhitelistedCrowdsale', async (accounts) => {
  let owner = accounts[0];
  let user = accounts[1];

  let now = Date.now();
  let twoDays = 1000 * 60 * 60 * 24 * 2;

  let startTime = now - twoDays;
  let endTime = now + twoDays;
  let rate = 30;
  let minPurchase = 1;
  let maxPurchase = 1000;
  let wallet = user;
  let countPurchaseAmount = false;
  
  let token = null;
  let instanceWhitelistedCrowdsale = null;

  beforeEach("setup contract for each test", async () => {
    token = await MFC_Token.new({from: owner});
    instanceWhitelistedCrowdsale = await WhitelistedCrowdsale.new(
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

  afterEach("clean contracts" , async () => {
    instanceWhitelistedCrowdsale = null;
    token = null;
  });
  
  it("should be deployed", async () => {
    assert.isOk(instanceWhitelistedCrowdsale);
  });

  it("should be correctly initialized", async () => {
    assert.equal(
      await instanceWhitelistedCrowdsale.startTime.call(), startTime
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.endTime.call(), endTime
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.rate.call(), rate
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.minPurchase.call(), minPurchase
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.maxPurchase.call(), maxPurchase
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.wallet.call(), wallet
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.token.call(), token.address
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.countPurchaseAmount.call(), countPurchaseAmount
    );
  });

});
