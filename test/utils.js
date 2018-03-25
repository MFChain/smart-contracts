var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


function wait(delay) {
    var stop = new Date().getTime() / 1000 + delay;
    while (new Date().getTime() / 1000 < stop) {
        ;
    }
}

//for future proposes
const increaseTime = function (duration) {
    return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: 0,
    });
};

module.exports.wait = wait;
module.exports.increaseTime = increaseTime