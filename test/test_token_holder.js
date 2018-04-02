const Token = artifacts.require("MFC_Token");
const tokenHolder = artifacts.require("TokenHolder");
const ICO_controller = artifacts.require("ICO_controller");

contract('Token_Holder tests escrowTokensTo()', async function(accounts) {
    /* Task 126 - Create test for Token_Holder escrowTokensTo() */

    it("Test Token_Holder escrowTokensTo()", async function() {
        let owner1 = accounts[1];
        let owner2 = accounts[2];
        let owner3 = accounts[3];
        let escrowAddress = accounts[4];

        let token = await Token.new();

        let tokenHolderContract = await tokenHolder.new(
            [owner1,owner2,owner3], 3, token.address
        );

        token.transfer(tokenHolderContract.address, 10);

        let tokenHolderContractBalance = await token.balanceOf(tokenHolderContract.address);
        assert.equal(10, tokenHolderContractBalance.toNumber());

        assert.equal(0, await token.balanceOf(escrowAddress));

        await tokenHolderContract.escrowTokensTo(escrowAddress, {'from': owner1});
        assert.equal(0, await token.balanceOf(escrowAddress));

        await tokenHolderContract.escrowTokensTo(escrowAddress, {'from': owner2});
        assert.equal(0, await token.balanceOf(escrowAddress));

        await tokenHolderContract.escrowTokensTo(escrowAddress, {'from': owner3});

        let escrowAddressBalance = await token.balanceOf(escrowAddress);

        assert.equal(0, await token.balanceOf(tokenHolderContract.address));
        assert.equal(10, escrowAddressBalance.toNumber());

    });
});