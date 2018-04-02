var Token = artifacts.require("MFC_Token");
var IcoControllerMock = artifacts.require("IcoControllerMock");


contract('ICO_controller tests unlockMarketingTokens', async function(accounts) {
    let owner = accounts[0];
    let holder = accounts[1];

    let controllerInstance = null;
    let token = null;
    let ownerTokensBalance = null;

    it("should throw error when unlock marketing time < now", async function() {
        controllerInstance = await IcoControllerMock.new(
            holder, accounts[2],
            {from: owner}
        );
        token = Token.at(await controllerInstance.token.call());

        let now = Math.ceil(Date.now() / 1000);
        await controllerInstance.setUnlockMarketingTokensTime.sendTransaction(now + 100, now + 200);

        // The owner has no tokens initially.
        assert.equal(0, await token.balanceOf(owner));

        // It is not possible to release marketing tokens before unlockMarketingTokensTime.
        try {
            await controllerInstance.getLockedMarketingTokens();
            assert.ifError('Error, unlockMarketingTokensTime < now');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "unlockMarketingTokensTime >= now");
        }

        // Set back the marketing tokens release time.
        await controllerInstance.setUnlockMarketingTokensTime.sendTransaction(now - 100, now + 200);

        // Get the tokens.
        await controllerInstance.getLockedMarketingTokens();
        assert.equal(1, await controllerInstance.unlockIndex.call());

        let marketingSupportTokensAmount = await controllerInstance.releaseMarketingTokenAmount.call();
        let ownerBalance = await token.balanceOf(owner);

        // The owner now has marketingSupportTokensAmount tokens.
        assert.isOk(ownerBalance.eq(marketingSupportTokensAmount));

        // It is not possible to release marketing tokens before unlockMarketingTokensTime (second stage).
        try {
            await controllerInstance.getLockedMarketingTokens();
            assert.ifError('Error, unlockMarketingTokensTime < now');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "unlockMarketingTokensTime >= now");
        }

        // Set back the second stage release time.
        await controllerInstance.setUnlockMarketingTokensTime.sendTransaction(now - 100, now - 50);

        // Get the tokens.
        await controllerInstance.getLockedMarketingTokens();
        assert.equal(2, await controllerInstance.unlockIndex.call());

        ownerBalance = await token.balanceOf(owner);

        // The owner now has twice marketing support tokens amount.
        assert.isOk(ownerBalance.eq(
            marketingSupportTokensAmount.plus(marketingSupportTokensAmount)
        ));
    });
});
