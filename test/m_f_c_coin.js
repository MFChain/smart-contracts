var token = artifacts.require("MFC_Token");
var erc223receiver = artifacts.require("ERC223Receiver");
var StandardToken = artifacts.require("StandardToken");
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

contract('MFC_Token tests constructor', function(accounts) {
    /* Task 16 - Create test for MFC_coin constructor() with Truffle */

    /* Using Truffle, we check method for MFC_coin constructor and test
       if the totalSupply and owner balance equal to INITIAL_SUPPLY value. */
    it("should specify totalSupply as 507000000000000000000000000 MFC_Token and put all tokens in the first account", function() {
        var balance_value;
        var totalSupply_value;
        var owner = accounts[0];
        var token_contract;
        return token.deployed().then(function(instance) {
          token_contract = instance;
          return token_contract.balanceOf.call(owner);
      }).then(function(balance){
          balance_value = balance.valueOf();
          return token_contract.totalSupply.call();
      }).then(function(totalSupply) {
          totalSupply_value = totalSupply.valueOf();
      }).then(function() {
          assert.equal(balance_value, 507000000000000000000000000, "500000000000000000000000000 wasn't in the first account");
          assert.equal(totalSupply_value, 507000000000000000000000000, "totalSupply is not 500000000000000000000000000 MFC_Token");
      });
    });
});

contract('MFC_Token tests burn', async function(accounts) {

    /* Task 17 - Create test for MFC_coin burn() with Truffle */

    /* Using Truffle, we check method for MFC_coin burn() and test 4 variants:
        regular burning - when the sender have enough tokens */
    it("test burn method with enough balance", function() {
        var user_balance_before;
        var owner = accounts[0];
        var user = accounts[1];
        var token_contract;
        var oldTotalSupply;
        var newTotalSupply;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.transfer(user, 10, {'from': owner});
        }).then(function(){
            return token_contract.totalSupply.call();
        }).then(function(totalSupply) {
            return totalSupply.toNumber();
        }).then(function(totalSupply){
            oldTotalSupply = totalSupply;
            return token_contract.balanceOf.call(user);
        }).then(function(balance) {
            user_balance_before = balance.toNumber();
            return token_contract.burn(10, {'from': user});
        }).then(function(){
            return token_contract.totalSupply.call();
        }).then(function(totalSupply) {
            return totalSupply.toNumber();
        }).then(function(totalSupply){
            newTotalSupply = totalSupply;
            return token_contract.balanceOf.call(user);
        }).then(function(balance) {
            return balance.toNumber();
        }).then(function(user_balance_after) {
            console.log("user balance changed on wrong number" + (user_balance_before - user_balance_after));
            assert.equal(user_balance_before - 10, user_balance_after, "user balance changed on wrong number" + user_balance_before - user_balance_after);
            assert.equal(oldTotalSupply - 10, newTotalSupply, "totalSupply changed on wrong number");
        });
    });

    /* burning without enough tokens */
    it("test burn method without enough balance", function() {
        var owner = accounts[0];
        var user = accounts[2];
        var token_contract;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.transfer(user, 1, {'from': owner});
        }).then(function() {
            return token_contract.burn(10, {'from': user});
        }).then(function() {
            assert.isFalse(true, 'Expect exception. User does not have enough tokens');
        }).catch(function(e){
            assert.equal(e, 'Error: VM Exception while processing transaction: revert', "wrong error thrown");
        });
    });

    /* burning without balance */
    it("test burn method without balance", function() {
        var user = accounts[3];
        var token_contract;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.burn(10, {'from': user});
        }).then(function() {
            assert.isFalse(true, 'Expect exception. User does not have balance');
        }).catch(function(e){
            assert.equal(e, 'Error: VM Exception while processing transaction: revert', "wrong error thrown");
        });
    });

    /* balance of burner = 0 */
    it("test burn method with zero balance", function() {
        var owner = accounts[0];
        var user = accounts[4];
        var token_contract;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.transfer(user, 1, {'from': owner});
        }).then(function() {
            return token_contract.burn(1, {'from': user});
        }).then(function() {
            return token_contract.burn(10, {'from': user});
        }).then(function() {
            assert.isFalse(true, 'Expect exception. The user has a zero balance');
        }).catch(function(e){
            assert.equal(e, 'Error: VM Exception while processing transaction: revert', "wrong error thrown");
        });
    });
});

contract('MFC_Token tests burnAll', async function(accounts) {

    /* Task 18 - Create test for MFC_coin burnAll() with Truffle */

    /* Using Truffle, we check method for MFC_coin burnAll() and test 3 variants:
       - burner have balance */
    it("test burnAll method with nonzero balance", function() {
        var user_balance_before;
        var owner = accounts[0];
        var user = accounts[5];
        var token_contract;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.transfer(user, 10, {'from': owner});
        }).then(function() {
            return token_contract.balanceOf.call(user);
        }).then(function(balance) {
            user_balance_before = balance.valueOf();
            return token_contract.burnAll({'from': user});
        }).then(function() {
            return token_contract.balanceOf.call(user);
        }).then(function(balance) {
            return balance.valueOf();
        }).then(function(user_balance_after){
            assert.equal(user_balance_before, 10, "User have wrong balance befor burning");
            assert.equal(user_balance_after, 0, "User have wrong balance after burning");
        });
    });

    /* burner not have balance */
    it("test burnAll method without balance", function() {
        var user = accounts[6];
        var token_contract;
        var oldTotalSupply;
        var newTotalSupply;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.totalSupply();
        }).then(function(totalSupply){
            oldTotalSupply = totalSupply.toNumber();
            return token_contract.burnAll({'from': user});
        }).then(function() {
            return token_contract.totalSupply();
        }).then(function(totalSupply) {
            newTotalSupply = totalSupply.toNumber();
            return token_contract.balanceOf(user);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), 0, "User must have zero balance after burning, but it have not");
            assert.equal(oldTotalSupply, newTotalSupply, "the totalSupply has changed, although it should not");
        });
    });

    /* balance of burner = 0 */
    it("test burnAll method with zero balance", function() {
        var owner = accounts[0];
        var user = accounts[7];
        var token_contract;
        return token.deployed().then(function(instance) {
            token_contract = instance;
            return token_contract.transfer(user, 10, {'from': owner});
        }).then(function() {
            return token_contract.burn(10, {'from': user});
        }).then(function() {
            return token_contract.burnAll({'from': user});
        }).then(function() {
            return token_contract.balanceOf.call(user);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), 0, "User must have zero balance after burning, but it have not");
        });
    });
});

contract('MFC_Token tests transferFrom', async function(accounts) {
    /* Task 21 - Create test for MFC_coin transferFrom() with Truffle */

    /* Using Truffle, we check method for MFC_coin transferFrom() and test 7 variants:
       - if the sender have enough allowed tokens and send to address */
    it("test transferFrom with enough approved amount", async function() {
        let owner = accounts[0];
        let spender = accounts[8];
        let receiver = accounts[9];
        let amount = 100

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = balance.toNumber();

        await contract.approve(spender, amount, {'from': owner})
        await contract.transferFrom(owner, receiver, amount, {'from': spender})

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = balance.toNumber();

        assert.equal(owner_balance_after, owner_balance_before - amount, "Amount wasn't correctly taken from the sender");
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
        let owner_balance_before = balance.toNumber();

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
        let owner_balance_after = balance.toNumber();

        assert.equal(owner_balance_after, owner_balance_before - amount, "Amount wasn't correctly taken from the sender");
        assert.equal(receiver_balance_after, receiver_balance_before + amount, "Amount wasn't correctly sent to the receiver");
    });

    /* if the sender have enough allowed tokens and send to contract without tokenFallback() */
    it("test transferFrom to contract without ERC223Receiver interface", async function() {
        let owner = accounts[0];
        let spender = accounts[11];
        let amount = 100;

        let contract = await token.deployed();
        let receiver = await StandardToken.deployed();

        let balance = await contract.balanceOf.call(receiver.contract.address);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = balance.toNumber();

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

        balance = await contract.balanceOf.call(receiver.address);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = balance.toNumber();

        assert.equal(owner_balance_after, owner_balance_before, "Balance changed, it isn't correct");
        assert.equal(receiver_balance_after, receiver_balance_before, "Balance changed, it isn't correct");
    });

    /* if the sender have not enough allowed tokens and send to address */
    it("test transferFrom with more amount than approved", async function() {
        let owner = accounts[0];
        let spender = accounts[12];
        let receiver = accounts[13];
        let amount = 100
        let amount2 = 200

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = balance.toNumber();

        await contract.approve(spender, amount, {'from': owner});
        try {
            await contract.transferFrom(owner, receiver, amount2, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = balance.toNumber();

        assert.equal(owner_balance_after, owner_balance_before, "Balance changed, it isn't correct");
        assert.equal(receiver_balance_after, receiver_balance_before, "Balance changed, it isn't correct");
    });

    /* if the sender have not allowance and send to address */
    it("test transferFrom without allowance", async function() {
        let owner = accounts[0];
        let spender = accounts[14];
        let receiver = accounts[15];
        let amount = 100

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_before = balance.toNumber();

        try {
            await contract.transferFrom(owner, receiver, amount, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(owner);
        let owner_balance_after = balance.toNumber();

        assert.equal(owner_balance_after, owner_balance_before, "Balance changed, it isn't correct");
        assert.equal(receiver_balance_after, receiver_balance_before, "Balance changed, it isn't correct");
    });

    /* if the from have not enough tokens and send to address */
    it("test transferFrom with not enough amount on from balance", async function() {
        let owner = accounts[0];
        let spender = accounts[16];
        let receiver = accounts[17];
        let user = accounts[18];
        let amount = 100
        let amount2 = 50

        let contract = await token.deployed();

        let balance = await contract.balanceOf.call(receiver);
        let receiver_balance_before = balance.toNumber();

        await contract.transfer(user, amount, {'from': owner});
        await contract.approve(spender, amount, {'from': user});
        await contract.transfer(owner, amount2, {'from': user});

        balance = await contract.balanceOf.call(user);
        let user_balance_before = balance.toNumber();

        try {
            await contract.transferFrom(user, receiver, amount, {'from': spender});
            assert.ifError('Error, previous code must throw exception');
        } catch (err){
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error");
        };

        balance = await contract.balanceOf.call(receiver);
        let receiver_balance_after = balance.toNumber();
        balance = await contract.balanceOf.call(user);
        let user_balance_after = balance.toNumber();

        assert.equal(user_balance_before, user_balance_after, "Balance changed, it isn't correct");
        assert.equal(receiver_balance_after, receiver_balance_before, "Balance changed, it isn't correct");
    });
});
