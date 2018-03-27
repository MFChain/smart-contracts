"use strict";

const ICO_controller = artifacts.require("ICO_controller");
const MFC_Token = artifacts.require("MFC_Token");
const WhitelistedCrowdsale = artifacts.require("WhitelistedCrowdsale");
const BigNumber = require('bignumber.js');
const wait = require('./utils').wait;

contract('WhitelistedCrowdsale', async (accounts) => {
  let owner = accounts[0];
  let holder = accounts[1];
  let escrowAccount = accounts[2];
  let userFromWhitelist = accounts[3];
  let userNotFromWhitelist = accounts[4];

  let defaultMinPurchaseForPrivateOffer = web3.toWei(10, 'ether');
  let defaultMaxPurchaseForPrivateOffer = web3.toWei(200, 'ether');
  let defaultIsPrivateOfferForPrivateOffer = true;
  let defaultRateForPrivateOffer = 12000;
  
  let startTime = null;
  let endTime = null;
  let controller = null;
  let token = null;
  let instanceWhitelistedCrowdsale = null;

  before("setup contract for each test", async () => {
    controller = await ICO_controller.new(holder, escrowAccount, {from: owner});
    startTime = Math.ceil(Date.now() / 1000);
    endTime = Math.ceil(Date.now() / 1000) + 100;
    token = MFC_Token.at(await controller.token.call());
    await controller.startPrivateOffer.sendTransaction(startTime, endTime, escrowAccount, {from: owner});
    instanceWhitelistedCrowdsale = WhitelistedCrowdsale.at(await controller.privateOffer.call());
    await controller.addBuyerToWhitelist.sendTransaction(userFromWhitelist, {from: owner});
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
      await instanceWhitelistedCrowdsale.isPrivateOffer.call(), defaultIsPrivateOfferForPrivateOffer
    );
  });
  
  it("should throw error when the beneficiary not in whitelist", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(
        userNotFromWhitelist, {value: web3.toWei(12, "ether")}
      );
      assert.ifError('Error, the user that is not in whitelist should not be able to buy tokens');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary not in whitelist trying to buy tokens");
    }
  });

  it("should throw an error when the beneficiary is the contract owner", async () => {
    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(
        0, {value: web3.toWei(12, "ether")}
      );
      assert.ifError('Error, the user that is not in whitelist should not be able to buy tokens');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Benefeciary has zero address");
    }
  });

  it("should throw error when tokens are not enough", async () => {
    let tokenBalance = await token.balanceOf(instanceWhitelistedCrowdsale.address);
    let weiAmount = tokenBalance.div(await instanceWhitelistedCrowdsale.rate.call()).add(BigNumber('10'));

    try {
      await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(userFromWhitelist, {value: weiAmount});
      assert.ifError('Error, tokens are not enough');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Tokens are not enough");
    }
  });

  it("should buy tokens", async () => {
    let weiAmount = web3.toWei(12, "ether");
    let weiAmountAsBigNumber = BigNumber(weiAmount);
    let walletAddress = await instanceWhitelistedCrowdsale.wallet.call();
    let walletBalance = web3.eth.getBalance(walletAddress);
    let currentUserTokens = await token.balanceOf(userFromWhitelist);
    
    await instanceWhitelistedCrowdsale.buyTokens.sendTransaction(userFromWhitelist, {value: weiAmount});
    
    assert.isOk(
      walletBalance.add(weiAmount)
        .eq(web3.eth.getBalance(walletAddress))
    );
    assert.isOk(
      weiAmountAsBigNumber.times(defaultRateForPrivateOffer)
        .plus(currentUserTokens)
        .eq(await token.balanceOf(userFromWhitelist))
    );
  });

});
