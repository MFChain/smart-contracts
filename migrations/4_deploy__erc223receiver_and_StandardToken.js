var erc223receiver = artifacts.require("ERC223Receiver");
var StandardToken = artifacts.require("StandardToken");

module.exports = function(deployer) {
    deployer.deploy(erc223receiver);
    deployer.deploy(StandardToken);
};