const { ethers } = require("hardhat");

// point to the mocks or actually chainlink contract
const networkConfig = {
    // goerli
    5: {
        name: "goerli",
        vrfCoodinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D", 
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30", // 30 seconds
    }, 
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"), 
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        // above could be anything for gas lane
        callbackGasLimit: "500000",
        interval: "30",
    }
}

const developmentChains = ["hardhat", "localhost"];

module.exports = {networkConfig, developmentChains}