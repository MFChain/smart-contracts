var token = artifacts.require("MFC_Token");
var erc223receiver = artifacts.require("ERC223Receiver");
var StandardToken = artifacts.require("StandardToken");
var BigNumber = require('bignumber.js');
const web3Abi = require('web3-eth-abi');

const overloadedTransferFromAbi = {
    "constant": false,
    "inputs": [
    {
        "name": "_from",
        "type": "address"
    },
    {
        "name": "_to",
        "type": "address"
    },
    {
        "name": "_value",
        "type": "uint256"
    },
    {
        "name": "_data",
        "type": "bytes"
    }
    ],
    "name": "transferFrom",
    "outputs": [
    {
        "name": "success",
        "type": "bool"
    }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
};
const overloadedTransferAbi = {
    "constant": false,
    "inputs": [
    {
        "name": "_to",
        "type": "address"
    },
    {
        "name": "_value",
        "type": "uint256"
    },
    {
        "name": "_data",
        "type": "bytes"
    }
    ],
    "name": "transfer",
    "outputs": [
    {
        "name": "success",
        "type": "bool"
    }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
};

contract('MFC_Token tests constructor', async function(accounts) {
    /* Task 16 - Create test for MFC_coin constructor() with Truffle */

    /* Using Truffle, we check method for MFC_coin constructor and test
       if the totalSupply and owner balance equal to INITIAL_SUPPLY value. */
    it("should specify totalSupply as 507000000000000000000000000 MFC_Token and put all tokens in the first account", async function() {
        let owner = accounts[0];
        let expected_value = BigNumber(507000000000000000000000000);

        let contract = await token.deployed();

        let owner_balance = await contract.balanceOf.call(owner);
        let totalSupply = await contract.totalSupply.call();

        assert.isTrue(BigNumber(owner_balance).isEqualTo(expected_value), "507000000000000000000000000 wasn't in the first account");
        assert.isTrue(BigNumber(totalSupply).isEqualTo(expected_value), "totalSupply is not 507000000000000000000000000 MFC_Token");
    });
});

contract('MFC_Token tests burn()', async function(accounts) {

    /* Task 17 - Create test for MFC_coin burn() with Truffle */

    /* Using Truffle, we check method for MFC_coin burn() and test 4 variants:
        regular burning - when the sender have enough tokens */
    it("test burn method with enough balance", async function() {
        let owner = accounts[0];
        let user = accounts[1];

        let contract = await token.deployed();

        await contract.transfer(user, 10, {'from': owner});

        let balance = await contract.balanceOf.call(user);
        let user_balance_before = balance.toNumber();
        let totalSupply = await contract.totalSupply.call();
        let totalSupply_before = BigNumber(totalSupply);

        await contract.burn(10, {'from': user});

        balance = await contract.balanceOf.call(user);
        let user_balance_after = balance.toNumber();
        totalSupply = await contract.totalSupply.call();
        let totalSupply_after = BigNumber(totalSupply);

        let user_balance_change = user_balance_before - user_balance_after;
        let totalSupply_change = totalSupply_before.minus(totalSupply_after).toNumber();
        assert.equal(user_balance_change, 10, "user balance changed on wrong number" + user_balance_change);
        assert.equal(totalSupply_change, 10, "totalSupply changed on wrong number" + totalSupply_change);
    });

    /* burning without enough tokens */
    it("test burn method without enough balance", async function() {
        let owner = accounts[0];
        let user = accounts[2];

        let contract = await token.deployed();

        await contract.transfer(user, 1, {'from': owner});

        try {
            await contract.burn(10, {'from': user});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* burning without balance */
    it("test burn method without balance", async function() {
        let user = accounts[3];

        let contract = await token.deployed();

        try {
            await contract.burn(10, {'from': user});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* balance of burner = 0 */
    it("test burn method with zero balance", async function() {
        let owner = accounts[0];
        let user = accounts[4];

        let contract = await token.deployed();

        await contract.transfer(user, 1, {'from': owner});
        await contract.burn(1, {'from': user});

        try {
            await contract.burn(10, {'from': user});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });
});

contract('MFC_Token tests burnAll()', async function(accounts) {

    /* Task 18 - Create test for MFC_coin burnAll() with Truffle */

    /* Using Truffle, we check method for MFC_coin burnAll() and test 3 variants:
       - burner have balance */
    it("test burnAll method with nonzero balance", async function() {
        let owner = accounts[0];
        let user = accounts[5];

        let contract = await token.deployed();

        await contract.transfer(user, 10, {'from': owner});

        let totalSupply = await contract.totalSupply.call();
        let totalSupply_before = BigNumber(totalSupply);

        await contract.burnAll({'from': user});

        balance = await contract.balanceOf.call(user);
        let user_balance_after = balance.toNumber();
        totalSupply = await contract.totalSupply.call();
        let totalSupply_after = BigNumber(totalSupply);

        let totalSupply_change = totalSupply_before.minus(totalSupply_after).toNumber();

        assert.equal(user_balance_after, 0, "user must have zero balance after burning, but it have not");
        assert.equal(totalSupply_change, 10, "totalSupply changed on wrong number" + totalSupply_change);
    });

    /* burner not have balance */
    it("test burnAll method without balance", async function() {
        let user = accounts[6];

        let contract = await token.deployed();

        let totalSupply = await contract.totalSupply.call();
        let totalSupply_before = BigNumber(totalSupply);

        await contract.burnAll({'from': user});

        balance = await contract.balanceOf.call(user);
        let user_balance_after = balance.toNumber();
        totalSupply = await contract.totalSupply.call();
        let totalSupply_after = BigNumber(totalSupply);

        assert.equal(user_balance_after, 0, "user must have zero balance after burning, but it have not");
        assert.isTrue(totalSupply_before.isEqualTo(totalSupply_after), "the totalSupply has changed, although it should not");
    });

    /* balance of burner = 0 */
    it("test burnAll method with zero balance", async function() {
        let owner = accounts[0];
        let user = accounts[7];

        let contract = await token.deployed();

        await contract.transfer(user, 10, {'from': owner});
        await contract.burn(10, {'from': user})

        let totalSupply = await contract.totalSupply.call();
        let totalSupply_before = BigNumber(totalSupply);

        await contract.burnAll({'from': user});

        balance = await contract.balanceOf.call(user);
        let user_balance_after = balance.toNumber();
        totalSupply = await contract.totalSupply.call();
        let totalSupply_after = BigNumber(totalSupply);

        assert.equal(user_balance_after, 0, "user must have zero balance after burning, but it have not");
        assert.isTrue(totalSupply_before.isEqualTo(totalSupply_after), "the totalSupply has changed, although it should not");
    });
});

contract('MFC_Token tests transferFrom()', async function(accounts) {
    /* Task 21 - Create test for MFC_coin transferFrom() with Truffle */

    /* Using Truffle, we check method for MFC_coin transferFrom() and test 7 variants:
       - if the sender have enough allowed tokens and send to address */
    it("test transferFrom with enough approved amount", async function() {
        let owner = accounts[0];
        let spender = accounts[8];
        let receiver = accounts[9];
        let amount = 100;

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = BigNumber(balance);

        await contract.approve(spender, amount, {'from': owner});
        await contract.transferFrom(owner, receiver, amount, {'from': spender});

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = BigNumber(balance);

        assert.equal(owner_balance_before.minus(owner_balance_after), amount, "Amount wasn't correctly taken from the sender");
        assert.equal(receiver_balance_after, receiver_balance_before + amount, "Amount wasn't correctly sent to the receiver");
    });

    /* if the sender have enough allowed tokens and send to contract with tokenFallback() */
    it("test transferFrom to contract with ERC223Receiver interface", async function() {
        let owner = accounts[0];
        let spender = accounts[10];
        let amount = 100;

        let contract = await token.deployed();
        let receiver = await erc223receiver.deployed();

        let balance = await contract.balanceOf.call(receiver.contract.address);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = BigNumber(balance);

        await contract.approve(spender, amount, {'from': owner});
        const transferFromMethodTransactionData = web3Abi.encodeFunctionCall(
            overloadedTransferFromAbi,
            [
            owner,
            receiver.address,
            amount,
            '0x00'
            ]
        );
        await web3.eth.sendTransaction({from: spender, to: contract.address, data: transferFromMethodTransactionData, value: 0});

        balance = await contract.balanceOf.call(receiver.address);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = BigNumber(balance);

        assert.equal(owner_balance_before.minus(owner_balance_after), amount, "Amount wasn't correctly taken from the sender");
        assert.equal(receiver_balance_after, receiver_balance_before + amount, "Amount wasn't correctly sent to the receiver");
    });

    /* if the sender have enough allowed tokens and send to contract without tokenFallback() */
    it("test transferFrom to contract without ERC223Receiver interface", async function() {
        let owner = accounts[0];
        let spender = accounts[11];
        let amount = 100;

        let contract = await token.deployed();
        let receiver = await StandardToken.deployed();

        await contract.approve(spender, amount, {'from': owner});

        const transferFromMethodTransactionData = web3Abi.encodeFunctionCall(
            overloadedTransferFromAbi,
            [
            owner,
            receiver.address,
            amount,
            '0x00'
            ]
        );

        try {
            await web3.eth.sendTransaction({from: spender, to: contract.address, data: transferFromMethodTransactionData, value: 0});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the sender have not enough allowed tokens and send to address */
    it("test transferFrom with more amount than approved", async function() {
        let owner = accounts[0];
        let spender = accounts[12];
        let receiver = accounts[13];
        let amount = 100;
        let amount2 = 200;

        let contract = await token.deployed();

        await contract.approve(spender, amount, {'from': owner});

        try {
            await contract.transferFrom(owner, receiver, amount2, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the sender have not allowance and send to address */
    it("test transferFrom without allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[14];
        let receiver = accounts[15];
        let amount = 100;

        let contract = await token.deployed();

        try {
            await contract.transferFrom(owner, receiver, amount, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the from have not enough tokens and send to address */
    it("test transferFrom with not enough amount on from balance", async function() {
        let owner = accounts[0];
        let spender = accounts[16];
        let receiver = accounts[17];
        let user = accounts[18];
        let amount = 100;
        let amount2 = 50;

        let contract = await token.deployed();

        await contract.transfer(user, amount2, {'from': owner});
        await contract.approve(spender, amount, {'from': user});

        try {
            await contract.transferFrom(user, receiver, amount, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the from have not balance and send to address */
    it("test transferFrom with not balance of from", async function() {
        let spender = accounts[19];
        let receiver = accounts[20];
        let user = accounts[21];
        let amount = 100;

        let contract = await token.deployed();

        await contract.approve(spender, amount, {'from': user});

        try {
            await contract.transferFrom(user, receiver, amount, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });
});

contract('MFC_Token tests aprove', async function(accounts) {
    /* Task 22 - Create test for MFC_token aprove() with Truffle */

    /* Using Truffle, we check method for MFC_token aprove() and test 2 variants:
       - if the sender have enough tokens */
    it("test aprove with enough tokens in balance", async function() {
        let owner = accounts[0];
        let spender = accounts[22];
        let expected_allowance = 100;

        let contract = await token.deployed();

        await contract.approve(spender, expected_allowance, {'from': owner});

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance = allowance.toNumber();

        assert.equal(spender_allowance, expected_allowance, "Allowance wasn't correctly specified for the spender");
    });

    /* if the sender have not enough tokens */
    it("test aprove without enough tokens in balance", async function() {
        let owner = accounts[0];
        let user = accounts[23];
        let spender = accounts[24];
        let expected_allowance = 100;
        let user_balance = 50;

        let contract = await token.deployed();

        await contract.transfer(user, user_balance, {'from': owner});;
        await contract.approve(spender, expected_allowance, {'from': user});;

        let allowance = await contract.allowance.call(user, spender);
        let spender_allowance = allowance.toNumber();

        assert.equal(spender_allowance, expected_allowance, "Allowance wasn't correctly specified for the spender");
    });
});

contract('MFC_Token tests transfer()', async function(accounts) {
    /* Task 3 - Create test for MFC_token transfer() with Truffle */

    /* Using Truffle, we check method for MFC_token transfer() and test 6 variants:
       - if the sender have enough tokens and send to address */
    it("test transfer with enough balance", async function() {
        let owner = accounts[0];
        let receiver = accounts[25];
        let amount = 100;

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = BigNumber(balance);

        await contract.transfer(receiver, amount, {'from': owner});

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = BigNumber(balance);

        assert.equal(owner_balance_before.minus(owner_balance_after), amount, "Amount wasn't correctly taken from the sender");
        assert.equal(receiver_balance_after, receiver_balance_before + amount, "Amount wasn't correctly sent to the receiver");
    });

    /* if the sender have enough tokens and send to contract with tokenFallback() */
    it("test transfer to contract with ERC223Receiver interface", async function() {
        let owner = accounts[0];
        let amount = 100;

        let contract = await token.deployed();
        let receiver = await erc223receiver.deployed();

        let balance = await contract.balanceOf.call(receiver.contract.address);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = BigNumber(balance);

        const transferMethodTransactionData = web3Abi.encodeFunctionCall(
            overloadedTransferAbi,
            [
            receiver.address,
            amount,
            '0x00'
            ]
        );

        await web3.eth.sendTransaction({from: owner, to: contract.address, data: transferMethodTransactionData, value: 0});

        balance = await contract.balanceOf.call(receiver.address);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = BigNumber(balance);

        assert.equal(owner_balance_before.minus(owner_balance_after), amount, "Amount wasn't correctly taken from the sender");
        assert.equal(receiver_balance_after, receiver_balance_before + amount, "Amount wasn't correctly sent to the receiver");
    });

    /* if the sender have enough tokens and send to contract without tokenFallback() */
    it("test transfer to contract without ERC223Receiver interface", async function() {
        let owner = accounts[0];
        let amount = 100;

        let contract = await token.deployed();
        let receiver = await StandardToken.deployed();

        const transferMethodTransactionData = web3Abi.encodeFunctionCall(
            overloadedTransferAbi,
            [
            receiver.address,
            amount,
            '0x00'
            ]
        );

        try {
            await web3.eth.sendTransaction({from: owner, to: contract.address, data: transferMethodTransactionData, value: 0});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the sender have not enough tokens and send to address */
    it("test transfer with more amount than balance", async function() {
        let owner = accounts[0];
        let sender = accounts[26];
        let receiver = accounts[27];
        let amount = 100;
        let amount2 = 200;

        let contract = await token.deployed();

        await contract.transfer(sender, amount, {'from': owner});

        try {
            await contract.transfer(receiver, amount2, {'from': sender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the sender have zero balance and send to address */
    it("test transfer with zero balance", async function() {
        let owner = accounts[0];
        let sender = accounts[28];
        let receiver = accounts[29];
        let amount = 100;

        let contract = await token.deployed();

        await contract.transfer(sender, amount, {'from': owner});
        await contract.transfer(owner, amount, {'from': sender});

        try {
            await contract.transfer(receiver, amount, {'from': sender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });

    /* if the sender have not balabce and send to address */
    it("test transfer without balance", async function() {
        let sender = accounts[30];
        let receiver = accounts[31];
        let amount = 100;

        let contract = await token.deployed();

        try {
            await contract.transfer(receiver, amount, {'from': sender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };
    });
});

contract('MFC_Token test allowance()', async function(accounts) {
    /* Task 23 - Create tests for MFC_token fubction allowance() */

    /* Using Truffle, we check method for MFC_token allowance() and test if the function return the right answer. */
    it("test allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[32];
        let expected_allowance = 100;

        let contract = await token.deployed();

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_before = allowance.toNumber();

        await contract.approve(spender, expected_allowance, {'from': owner});

        allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_before, 0, "Allowance befor wasn't correct, it must be 0");
        assert.equal(spender_allowance_after, expected_allowance, "Allowance befor wasn't correct, it must be " + expected_allowance);
    });
});

contract('MFC_Token test increaseApproval()', async function(accounts) {
    /* Task 24 - Create test for MFC_token increaseApproval() */

    /* Using Truffle, we check method for _MFC_token increaseApproval()_ and test 2 variants:
       - if the spender have allowance from this owner */
    it("test increaseApproval with previous allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[33];
        let expected_additional_allowance = 100;

        let contract = await token.deployed();

        await contract.approve(spender, 1, {'from': owner});

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_before = allowance.toNumber();

        await contract.increaseApproval(spender, expected_additional_allowance, {'from': owner});

        allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_after - spender_allowance_before, expected_additional_allowance, "Allowance was changed on wrong value");
    });

    /* if the spender don't have allowance from this owner */
    it("test increaseApproval without previous allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[34];
        let expected_additional_allowance = 100;

        let contract = await token.deployed();

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_before = allowance.toNumber();

        await contract.increaseApproval(spender, expected_additional_allowance, {'from': owner});

        allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_after - spender_allowance_before, expected_additional_allowance, "Allowance was changed on wrong value");
    });
});

contract('MFC_Token test decreaseApproval()', async function(accounts) {
    /* Task 25 - Create test for MFC_token decreaseApproval() */

    /* Using Truffle, we check method for _MFC_token decreaseApproval()_ and test 3 variants:
       - if the allowance more then value */
    it("test decreaseApproval with previous allowance more then decrease value", async function() {
        let owner = accounts[0];
        let spender = accounts[35];
        let expected_reduction_of_allowance = 100;

        let contract = await token.deployed();

        await contract.approve(spender, expected_reduction_of_allowance + 1, {'from': owner});

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_before = allowance.toNumber();

        await contract.decreaseApproval(spender, expected_reduction_of_allowance, {'from': owner});

        allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_before - spender_allowance_after, expected_reduction_of_allowance, "Allowance was changed on wrong value");
    });

    /* if the allowance less then value */
    it("test decreaseApproval with previous allowance less then decrease value", async function() {
        let owner = accounts[0];
        let spender = accounts[36];
        let reduction_of_allowance = 100;

        let contract = await token.deployed();

        await contract.approve(spender, reduction_of_allowance - 1, {'from': owner});

        await contract.decreaseApproval(spender, reduction_of_allowance, {'from': owner});

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_after, 0, "Allowance should not be more than 0 after reduction");
    });

    /* if there is no allowance */
    it("test decreaseApproval without previous allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[36];
        let reduction_of_allowance = 100;

        let contract = await token.deployed();

        await contract.decreaseApproval(spender, reduction_of_allowance, {'from': owner});

        let allowance = await contract.allowance.call(owner, spender);
        let spender_allowance_after = allowance.toNumber();

        assert.equal(spender_allowance_after, 0, "Allowance should not be more than 0 after reduction");
    });
});
