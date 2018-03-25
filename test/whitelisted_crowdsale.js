"use strict";

const ICO_controller = artifacts.require("ICO_controller");
const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;

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
  let userBalance = web3.eth.getBalance(user);
  let defaultRateForPrivateOffer = 14000;

  let controller = null;
  let instanceWhitelistedCrowdsale = null;
  let token = null;

  beforeEach("setup contract for each test", async () => {
    let startTime = Math.ceil(Date.now() / 1000);
    let endTime = Math.ceil(Date.now() / 1000) + 100;
    
    controller = await ICO_controller.new(holder, escrow_account, {from: owner});
    token = MFC_Token.at(await controller.token.call());
    await controller.startPrivateOffer.sendTransaction(startTime, endTime, escrow_account, {from: owner});
    instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
    wait(5);
  });

  afterEach("clean contracts" , async () => {
    controller = null;
    instanceWhitelistedCrowdsale = null;
    token = null;
  });
  
  it("should be deployed", async () => {
    assert.isOk(instanceWhitelistedCrowdsale);
  });

  it("should throw error when beneficiary not in whitelist", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(2, "ether")});
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary not in whitelist trying to buy tokens");
    }
  });

  it("should throw error when beneficiary has a zero address", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(0, {from: owner, value: web3.toWei(2, "ether")});
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary has zero address");
    }
  });

  it("should forward funds when buy tokens", async () => {
    let weiAmount = web3.toWei(2, "ether");
    let walletAddress = await instanceWhitelistedCrowdsale.wallet.call();
    let walletBalance = web3.eth.getBalance(walletAddress);
    await controller.addBuyerToWhitelist.sendTransaction(user);
    await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: weiAmount});
    console.log(walletBalance.add(weiAmount), web3.eth.getBalance(walletAddress));
    assert.isOk(
      walletBalance.add(weiAmount).eq(web3.eth.getBalance(walletAddress))
    );
  });

  // it("should buy tokens 2", async () => {
  //   let walletBalance = web3.eth.getBalance(await instanceWhitelistedCrowdsale.wallet.call());
  //   await controller.addBuyerToWhitelist.sendTransaction(user);
  //   await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(2, "ether")});
  //   let expectedBalance = userBalance.mul(defaultRateForPrivateOffer);
  //   assert.equal(walletBalance)
  //   assert.equal(expectedBalance, await token.balanceOf.call(user));
  // });

  // it("should buy tokens 50", async () => {
  //   await controller.addBuyerToWhitelist.sendTransaction(user);
  //   await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(50, "ether")});
  //   assert.equal(userBalance, web3.eth.getBalance(user));
    
  // });

  // it("should buy tokens 100", async () => {
  //   await controller.addBuyerToWhitelist.sendTransaction(user);
  //   await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(user, {from: owner, value: web3.toWei(100, "ether")});
  //   assert.equal(userBalance, web3.eth.getBalance(user));
  // });

});
