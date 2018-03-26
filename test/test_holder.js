var holder = artifacts.require("Holder");
var BigNumber = require('bignumber.js');
var token = artifacts.require("MFC_Token");
var controller = artifacts.require("ICO_controller");

contract('Holder tests constructor', async function(accounts) {
    /* Task 26 - Create test for Holder constructor() */

    /* Using Truffle, we check Holder constructor method and test if the all initial data are specified rightly. */
    it("test Holder constructor()", async function() {
        let owner1 = accounts[1];
        let owner2 = accounts[2];
        let owner3 = accounts[3];
        let expected_requiered = 2;
        let expected_numOwners = 3;

        let holder_contract = await holder.deployed();

        let owner1_isOwner = await holder_contract.isOwner.call(owner1);
        let owner2_isOwner = await holder_contract.isOwner.call(owner2);
        let owner3_isOwner = await holder_contract.isOwner.call(owner3);

        let numOwners = await holder_contract.m_numOwners.call();

        let required = await holder_contract.m_multiOwnedRequired.call();

        assert.isTrue(owner1_isOwner, "accounts[1] is not owner");
        assert.isTrue(owner2_isOwner, "accounts[2] is not owner");
        assert.isTrue(owner3_isOwner, "accounts[3] is not owner");
        assert.equal(required, expected_requiered, "required has an unexpected value");
        assert.equal(numOwners.toNumber(), expected_numOwners, "numOwners has an unexpected value");
    });
});

contract('Holder tests escrowFirstStage()', async function(accounts) {
    /* Task 27 - Create test for Holder escrowFirstStage() */

    /* Using Truffle, we check method for Holder -  escrowFirstStage()
    and test the functionality of this method. If the Ether will come
    to escrow address, if the amount of ether is 60% of full amount
    holded in this contract in the moment of execution and if this
    method executed only when the required number of owners are call it. */
    it("test Holder escrowFirstStage()", async function() {
        let owner1 = accounts[1];
        let owner2 = accounts[2];
        let escrowAddress = accounts[4];
        let holderBalance = 10;
        let escrowOnFirstStageExpected = holderBalance * 6 / 10;

        let holder_contract = await holder.deployed();

        let escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_befor = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: accounts[10], to: holder_contract.address, value: web3.toWei(holderBalance, 'ether'), gasLimit: 21000, gasPrice: 2000000000});

        try {
        result = await holder_contract.escrowFirstStage({'from': owner1});
        } catch(err){
        };
        escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_intermediate = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');
        try {
        result = await holder_contract.escrowFirstStage({'from': owner2});
        } catch(err){
        };

        escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_after = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');

        assert.equal(escrowAddress_balance_intermediate - escrowAddress_balance_befor, 0, "the ether should not have been sent after the first transaction");
        assert.equal(escrowAddress_balance_after - escrowAddress_balance_befor, escrowOnFirstStageExpected, "wrong first stage escrow value");
    });
});

contract('Holder tests escrowSecondStage()', async function(accounts) {
    /* Task 28 - Create test for Holder escrowSecondStage() */

    /* Using Truffle, we check method for Holder - escrowSecondStage()
    and test the functionality of this method, if the Ether will come
    to escrow address, if the amount of ether is 100% of full amount
    holded in this contract on the moment of executing this method and
    if this method executed only when the required number of owners are
    call it. */
    it("test Holder escrowSecondStage()", async function() {
        let owner2 = accounts[2];
        let owner3 = accounts[3];
        let escrowAddress = accounts[4];
        let holderBalance = 10;
        let escrowOnSecondStageExpected = holderBalance;

        let holder_contract = await holder.deployed();

        let escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_befor = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');

        await web3.eth.sendTransaction({from: accounts[10], to: holder_contract.address, value: web3.toWei(holderBalance, 'ether'), gasLimit: 21000, gasPrice: 2000000000});

        try {
        result = await holder_contract.escrowSecondStage({'from': owner2});
        } catch(err){
        };
        escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_intermediate = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');
        try {
        result = await holder_contract.escrowSecondStage({'from': owner3});
        } catch(err){
        };

        escrowAddressBalance = await web3.eth.getBalance(escrowAddress);
        let escrowAddress_balance_after = web3.fromWei(escrowAddressBalance.toNumber(), 'ether');

        holderContract_balance = await web3.eth.getBalance(holder_contract.address);
        let holderContract_balance_after = web3.fromWei(holderContract_balance.toNumber(), 'ether');

        assert.equal(escrowAddress_balance_intermediate - escrowAddress_balance_befor, 0, "the ether should not have been sent after the first transaction");
        assert.equal(escrowAddress_balance_after - escrowAddress_balance_befor, escrowOnSecondStageExpected, "wrong first stage escrow value");
        assert.equal(holderContract_balance_after, 0, "There should be no ether left on the holder");
    });
});
