// point to the mocks or actually chainlink contract
const networkConfig = {
    // goerli
    5: {
        name: "goerli",
        vrfCoodinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D"
    }
}

const developmentChains = ["hardhat", "localhost"];

module.exports = {networkConfig, developmentChains}