var ICO_controller = artifacts.require("ICO_controller");
var Holder = artifacts.require("Holder");
var TokenHolder = artifacts.require("TokenHolder");

module.exports = function (deployer, network, accounts) {
    var controller;
    deployer.deploy(Holder, [accounts[1], accounts[2], accounts[3]], 2, accounts[4]).then(
        function () {
            return Holder.deployed();
        }).then(
        function (holderInstance) {
            return deployer.deploy(ICO_controller, holderInstance.address, accounts[4]);
        }).then(
        function () {
            return ICO_controller.deployed();
        }).then(
        function (inst) {
            controller = inst;
            return controller.token();
        }).then(
        function (tokenAddr) {
            return deployer.deploy(TokenHolder, [accounts[1], accounts[2], accounts[3]], 3, tokenAddr);
        }).then(
        function () {
            return TokenHolder.deployed();
        }).then(
        function (tokenHolder) {
            return controller.setIncentiveProgram(tokenHolder.address);
        })
}
