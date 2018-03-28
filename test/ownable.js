"use strict";

const Ownable = artifacts.require("Ownable");

contract('Ownable', async (accounts) => {
  let owner = accounts[0];
  let other = accounts[1]
  
  let ownable = null;

  beforeEach("create ownable before each", async () => {
    ownable = await Ownable.new({from: owner});
  })

  it("should create ownable", async () => {
    assert.isOk(ownable);
  });

  it("should saving the owner", async () => {
    assert.equal(await ownable.owner.call(), owner);
  });

  it("should transferOwnership when sendingd from the owner", async () => {
    await ownable.transferOwnership.sendTransaction(other, {from: owner});
    
    assert.equal(await ownable.owner.call(), other);
  });

  it("should transferOwnership when sending not from the owner", async () => {
    try {
      await ownable.transferOwnership.sendTransaction(0, {from: other});
      
      assert.ifError('Error, Can\'t transferOwnership from not the owner');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Trying transfer from not the owner");
    }
  });

  it("should not transferOwnership when the change to zero address", async () => {
    try {
      await ownable.transferOwnership.sendTransaction(0, {from: owner});
      
      assert.ifError('Error, Can\'t transferOwnership to zero address');
    } catch (err) {
      assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Trying transfer to zero address");
    }
  });

});
