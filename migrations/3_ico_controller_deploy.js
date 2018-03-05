var ICO_controller = artifacts.require("ICO_controller");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(ICO_controller, accounts[4], accounts[4]);
};
