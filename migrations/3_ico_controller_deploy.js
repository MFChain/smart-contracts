var ICO_controller = artifacts.require("ICO_controller");
var Holder = artifacts.require("Holder");

const fs = require('fs');
var csvWriter = require('csv-write-stream');
var writer = csvWriter({ headers: ["Contract", "Address"]});
var Web3 = require("web3");
var web3 = new Web3();


module.exports = function(deployer, network, accounts) {
    deployer.deploy(Holder, [accounts[1],accounts[2],accounts[3]], 1, accounts[1]).then(
        function () {
            return deployer.deploy(ICO_controller, Holder.address, accounts[4]);
        }
    ).then(function () {
        ICO_controller.deployed().then(
            function (inst) {
                inst.token().then(
                    function (token_addr) {
                        // writer.pipe(fs.createWriteStream('simulation/deploy_info.csv'));
                        // writer.write(['Holder', web3.utils.toChecksumAddress(Holder.address)]);
                        // writer.write(['Controller', web3.utils.toChecksumAddress(ICO_controller.address)]);
                        // writer.write(['Token', web3.utils.toChecksumAddress(token_addr)]);
                        // writer.end();
                    }
                )

            }



        );



    });
};
