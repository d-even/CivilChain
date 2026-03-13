const { networks } = require("./hardhat/hardhat.config");

require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
// Read sensitive values from environment variables to avoid committing secrets.
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.28",

  networks: {
    sepolia: {
      url: ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : "",
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY.startsWith("0x") ? SEPOLIA_PRIVATE_KEY : `0x${SEPOLIA_PRIVATE_KEY}`] : [],
    },
  },
};
