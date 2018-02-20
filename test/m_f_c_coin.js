var token = artifacts.require("MFC_Token");

contract('MFC_Token', function(accounts) {
    it("should specify totalSupply as 500000000000000000000000000 MFC_Token and put all tokens in the first account", function() {
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
          assert.equal(balance_value, 500000000000000000000000000, "500000000000000000000000000 wasn't in the first account");
          assert.equal(totalSupply_value, 500000000000000000000000000, "totalSupply is not 500000000000000000000000000 MFC_Token");
      });
  });
});
