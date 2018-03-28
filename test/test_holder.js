'use strict';

const holder = artifacts.require("Holder");
const BigNumber = require('bignumber.js');
const token = artifacts.require("MFC_Token");
const controller = artifacts.require("ICO_controller");
const expectThrow = require('./helpers/expectThrow');
const l = console.log;

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
    let owner2 = accounts[2];
    let owner3 = accounts[3];
    let escrowAddress = accounts[4];
    
    let holder_contract = null;

    before("before all", async function() {
        holder_contract = await holder.deployed();
    });
    
    
    it("test Holder escrowSecondStage()", async function() {
        await holder_contract.escrowFirstStage({'from': owner3});

        let holderBalance = 10;
        let escrowOnSecondStageExpected = 0;
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

        let holderContract_balance = await web3.eth.getBalance(holder_contract.address);
        let holderContract_balance_after = web3.fromWei(holderContract_balance.toNumber(), 'ether');

        assert.equal(escrowAddress_balance_intermediate - escrowAddress_balance_befor, 0, "the ether should not have been sent after the first transaction");
        assert.equal(escrowAddress_balance_after - escrowAddress_balance_befor, escrowOnSecondStageExpected, "wrong first stage escrow value");
        assert.equal(holderContract_balance_after, holderBalance, "There should be no ether left on the holder");
    });

    it("should throw an error when escrowFirstStage not done", async () => {
        try {
            await holder_contract.escrowSecondStage({'from': owner3});
            assert.ifError('Error, escrowFirstStage done');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "escrowFirstStage not done");
        }
    });
});

contract('Holder', function(accounts) {

    async function freshInstance(required=2) {
        return holder.new([accounts[0], accounts[1], accounts[2]], required, accounts[9], {from: accounts[0]});
    }

    function skipHexPrefix(str) {
        return str.match(/^0[xX]/) ? str.substring(2) : str;
    }
    function paddedArg(str) {
        // pad to bytes32
        return str.padStart(64, '0');
    }

    const changeOwnerSelector = skipHexPrefix(web3.sha3('changeOwner(address,address)')).substring(0, 8);
    // Make calldata for changeOwner function and get its hash, which is used as an operation key
    function makeChangeOwnerOpHash(_from, _to) {
        /* requires web3 1.0+
        web3.eth.abi.encodeFunctionCall({"constant":false,
            "inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"}],
            "name":"changeOwner",
            "outputs":[],
            "payable":false,"stateMutability":"nonpayable","type":"function"
        }, [accounts[1], accounts[3]]); */

        return web3.sha3(changeOwnerSelector + paddedArg(skipHexPrefix(_from)) + paddedArg(skipHexPrefix(_to)), {encoding: 'hex'});
    }

    async function getOwners(instance) {
        const totalOwners = (await instance.m_numOwners()).toNumber();
        const calls = [];
        for (let i = 0; i < totalOwners; i++)
            calls.push(instance.getOwner(i));
        return Promise.all(calls);
    }

    it("ctor check", async function() {
        await expectThrow(holder.new([accounts[0], accounts[1], accounts[2]], 20, accounts[9], {from: accounts[0]}));
        await expectThrow(holder.new([accounts[0], accounts[1], accounts[0]], 1, accounts[9], {from: accounts[0]}));
        await expectThrow(holder.new([accounts[0], accounts[1], 0], 1, accounts[9], {from: accounts[0]}));

        let instance = await holder.new([accounts[0]], 1, accounts[9], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0]]);

        instance = await holder.new([accounts[0], accounts[1]], 2, accounts[9], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1]]);

        instance = await freshInstance();
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]]);
        assert.deepEqual(await instance.getOwners(), [accounts[0], accounts[1], accounts[2]]);
    });

    it("changeOwner check", async function() {
        const instance = await freshInstance(1);

        await expectThrow(instance.changeOwner(accounts[1], accounts[3], {from: accounts[3]}));

        await expectThrow(instance.changeOwner('0x0000000000000000000000000000000000000012', accounts[3], {from: accounts[0]}));
        await expectThrow(instance.changeOwner(accounts[1], accounts[2], {from: accounts[0]}));

        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[3], accounts[2]]);
    });

    it("double-signed changeOwner check", async function() {
        const instance = await freshInstance();

        // first signature
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');

        // makes no sense to sign again, accounts[0]!
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');

        // second signature
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[2]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[3], accounts[2]],
            'owners has been changed');
    });

    it("addOwner check", async function() {
        const instance = await freshInstance(1);

        await expectThrow(instance.addOwner(accounts[3], {from: accounts[3]}));
        await expectThrow(instance.addOwner(accounts[1], {from: accounts[0]}));

        await instance.addOwner(accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2], accounts[3]]);
    });

    it("removeOwner check", async function() {
        const instance = await freshInstance(1);

        await expectThrow(instance.removeOwner(accounts[1], {from: accounts[3]}));
        await expectThrow(instance.removeOwner(accounts[3], {from: accounts[0]}));

        await instance.removeOwner(accounts[1], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[2]]);
    });


    it("isOwner check", async function() {
        const instance = await freshInstance();

        assert(await instance.isOwner(accounts[0]));
        assert(await instance.isOwner(accounts[1]));
        assert(await instance.isOwner(accounts[2]));

        assert(false === (await instance.isOwner(accounts[3])));
        assert(false === (await instance.isOwner('0x12')));
    });

    it("amIOwner check", async function() {
        const instance = await freshInstance();

        assert(await instance.amIOwner({from: accounts[0]}));
        assert(await instance.amIOwner({from: accounts[1]}));
        assert(await instance.amIOwner({from: accounts[2]}));

        await expectThrow(instance.amIOwner({from: accounts[3]}));
        await expectThrow(instance.amIOwner({from: '0x0000000000000000000000000000000000000012'}));
    });

    it("changeRequirement check", async function() {
        const instance = await freshInstance(1);

        await expectThrow(instance.changeRequirement(2, {from: accounts[3]}));

        await expectThrow(instance.changeRequirement(0, {from: accounts[0]}));
        await expectThrow(instance.changeRequirement(4, {from: accounts[0]}));

        await instance.changeRequirement(3, {from: accounts[0]});
        assert.equal(await instance.m_multiOwnedRequired(), 3);
    });

    it("revoke check", async function() {
        const instance = await freshInstance();

        // first signature
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');

        const opHash = makeChangeOwnerOpHash(accounts[1], accounts[3]);
        assert(await instance.hasConfirmed(opHash, accounts[0]));
        assert(! await instance.hasConfirmed(opHash, accounts[2]));

        // revoke-confirm
        await instance.revoke(opHash, {from: accounts[0]});
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');
        assert(await instance.hasConfirmed(opHash, accounts[0]));
        assert(! await instance.hasConfirmed(opHash, accounts[2]));

        await expectThrow(instance.revoke(opHash, {from: accounts[3]}));

        // revoke
        await instance.revoke(opHash, {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');
        assert(! await instance.hasConfirmed(opHash, accounts[0]));
        assert(! await instance.hasConfirmed(opHash, accounts[2]));

        // second signature (but first was revoked!)
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[2]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');
        assert(! await instance.hasConfirmed(opHash, accounts[0]));
        assert(await instance.hasConfirmed(opHash, accounts[2]));
    });

    it("complex (3 sigs required) check", async function() {
        const instance = await freshInstance(3);
        const opHash = makeChangeOwnerOpHash(accounts[1], accounts[3]);

        // first signature
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');

        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[1]});

        assert(await instance.hasConfirmed(opHash, accounts[0]));
        assert(await instance.hasConfirmed(opHash, accounts[1]));
        assert(! await instance.hasConfirmed(opHash, accounts[2]));

        await instance.revoke(opHash, {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');
        assert(! await instance.hasConfirmed(opHash, accounts[0]));
        assert(await instance.hasConfirmed(opHash, accounts[1]));
        assert(! await instance.hasConfirmed(opHash, accounts[2]));

        // second signature (but first was revoked!)
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[2]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[1], accounts[2]],
            'owners are the same');
        assert(! await instance.hasConfirmed(opHash, accounts[0]));
        assert(await instance.hasConfirmed(opHash, accounts[1]));
        assert(await instance.hasConfirmed(opHash, accounts[2]));

        // finally changing owner
        await instance.changeOwner(accounts[1], accounts[3], {from: accounts[0]});
        assert.deepEqual(await getOwners(instance), [accounts[0], accounts[3], accounts[2]]);
    });

    it("should change escrow address, when enough confirmed by owners", async function() {
        const instance = await freshInstance();
        assert.equal(await instance.escrowAddress.call(), accounts[9]);
        instance.changeEscrowAddress(accounts[8], {from: accounts[0]});
        instance.changeEscrowAddress(accounts[8], {from: accounts[1]});
        assert.equal(await instance.escrowAddress.call(), accounts[8]);
        assert.notEqual(await instance.escrowAddress.call(), accounts[9]);
    });

    it("should not change escrow address, when not enough confirmed by owners", async () => {
        const instance = await freshInstance();
        assert.equal(await instance.escrowAddress.call(), accounts[9]);
        instance.changeEscrowAddress(accounts[8], {from: accounts[0]});
        assert.equal(await instance.escrowAddress.call(), accounts[9]);
        assert.notEqual(await instance.escrowAddress.call(), accounts[8]);

    });

});
