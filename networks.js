require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = process.env.MNEMONIC || ''
const projectId = process.env.INFURA_PROJECT_ID || ''

module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
    },
    rinkeby: {
      provider: () => new HDWalletProvider(
        mnemonic,
        `https://rinkeby.infura.io/v3/${ projectId }`
      ),
      networkId: 4,
      gasPrice: 10e9
    },
    mainnet: {
      provider: () => new HDWalletProvider(
        mnemonic,
        `https://mainnet.infura.io/v3/${ projectId }`
      ),
      networkId: 1,
      // gasPrice: 10e9
    }
  },
};
