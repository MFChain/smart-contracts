var ICO_controller_mock = artifacts.require("ICO_controller_mock");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(ICO_controller_mock);
    let mock = await ICO_controller_mock.deployed();
    await mock.sendAllTokensTo(accounts[0]);
};
