"use strict";

const ICO_controller = artifacts.require("ICO_controller");
const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
var BigNumber = require('bignumber.js');
var wait = require('./utils').wait;

contract('WhitelistedCrowdsale', async (accounts) => {
  let owner = accounts[0];
  let holder = accounts[1];
  let escrowAccount = accounts[2];
  let userFromWhitelist = accounts[3];
  let userNotFromWhitelist = accounts[4];
  
  let startTime = Math.ceil(Date.now() / 1000);
  let endTime = Math.ceil(Date.now() / 1000) + 100;

  let defaultMinPurchaseForPrivateOffer = web3.toWei(1, 'ether');
  let defaultMaxPurchaseForPrivateOffer = web3.toWei(200, 'ether');
  let defaultCountPurchaseAmountForPrivateOffer = false;
  let defaultRateForPrivateOffer = 14000;

  let controller = null;
  let token = null;
  let instanceWhitelistedCrowdsale = null;

  before("setup contract for each test", async () => {
    controller = await ICO_controller.new(holder, escrowAccount, {from: owner});
    token = MFC_Token.at(await controller.token.call());
    await controller.startPrivateOffer.sendTransaction(startTime, endTime, escrowAccount, {from: owner});
    instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
    await controller.addBuyerToWhitelist.sendTransaction(userFromWhitelist);
    wait(5);
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
      await instanceWhitelistedCrowdsale.rate.call(), defaultRateForPrivateOffer
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.minPurchase.call(), defaultMinPurchaseForPrivateOffer
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.maxPurchase.call(), defaultMaxPurchaseForPrivateOffer
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.wallet.call(), escrowAccount
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.token.call(), token.address
    );
    assert.equal(
      await instanceWhitelistedCrowdsale.countPurchaseAmount.call(), defaultCountPurchaseAmountForPrivateOffer
    );
  });

  it("should throw error when the beneficiary not in whitelist", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(userNotFromWhitelist, {from: owner, value: web3.toWei(2, "ether")});
      assert.ifError('Error, the owner should not be able to call this method');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary not in whitelist trying to buy tokens");
    }
  });

  it("should throw error when the beneficiary has a zero address", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(0, {from: owner, value: web3.toWei(2, "ether")});
      assert.ifError('Error, the owner should not be able to call this method');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary has zero address");
    }
  });

  it("should throw error when tokens not enough", async () => {
    let tokenBalance = await token.balanceOf(instanceWhitelistedCrowdsale.address);
    let weiAmount = tokenBalance.div(await instanceWhitelistedCrowdsale.rate.call()).add(BigNumber('10'));

    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(userFromWhitelist, {from: owner, value: weiAmount});
      assert.ifError('Error, the owner should not be able to call this method');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Tokens not enough");
    }
  });

  it("should forward funds when tokens were bought", async () => {
    let weiAmount = web3.toWei(2, "ether");
    let walletAddress = await instanceWhitelistedCrowdsale.wallet.call();
    let walletBalance = web3.eth.getBalance(walletAddress);
    await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(userFromWhitelist, {from: owner, value: weiAmount});
    assert.isOk(
      walletBalance.add(weiAmount).eq(web3.eth.getBalance(walletAddress))
    );
  });

});
