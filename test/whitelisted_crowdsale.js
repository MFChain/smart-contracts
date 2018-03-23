"use strict";

const ICO_controller = artifacts.require("ICO_controller");
const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');

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

contract('WhitelistedCrowdsale', async (accounts) => {
  let owner = accounts[0];
  let holder = accounts[1];
  let escrow_account = accounts[2];
  let user = accounts[3];

  let now = Date.now();
  let twoDays = 1000 * 60 * 60 * 24 * 2;

  let startTime = now - twoDays;
  let endTime = now + twoDays;
  
  let controller = null;
  let instanceWhitelistedCrowdsale = null;

  beforeEach("setup contract for each test", async () => {
    controller = await ICO_controller.new(holder, escrow_account, {from: owner});
    await controller.startPrivateOffer.sendTransaction(startTime, endTime, escrow_account, {from: owner});
    instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
  });

  afterEach("clean contracts" , async () => {
    controller = null;
    instanceWhitelistedCrowdsale = null;
  });
  
  it("should be deployed", async () => {
    assert.isOk(instanceWhitelistedCrowdsale);
  });

  it("should throw error when someone who is not in whitelist trying to buy tokens", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(2, "ether")});
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Someone who is not in whitelist trying to buy tokens");
    }
  });

  it("should buy tokens", async () => {
    console.log(1, await controller.isAddressWhitelisted.call(owner));
    await controller.addBuyerToWhitelist.sendTransaction(owner);
    await controller.addBuyerToWhitelist(user);
    await controller.addBuyerToWhitelist(instanceWhitelistedCrowdsale.address);
    console.log(2, await controller.isAddressWhitelisted.call(owner));
    console.log(3, );
    await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(2, "ether")});
  });

});
