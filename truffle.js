module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        gan:{
            host: "localhost",
            port: 7545,
            network_id: "*" // use id - 5777
        }
    },
    mocha: {
        useColors: true
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 100
        }
    }
};
