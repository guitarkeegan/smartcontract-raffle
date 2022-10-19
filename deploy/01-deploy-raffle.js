const { network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper.hardhat-config");
const {verify} = require("../utils/verify");

module.exports = async function ({getNamedAccounts, deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther("2");
    let vrfCoordinatorV2Address, subscriptionId;

    if (developmentChains.includes(network.name)){
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const trasactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await trasactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;
        //fund the subscription, you would need LINK to fund on a real network
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUBSCRIPTION_FUND_AMOUNT);
        
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoodinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const interval = networkConfig[chainId]["interval"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];

    const args = [vrfCoordinatorV2Address, entranceFee, gasLane, subscriptionId, callbackGasLimit, interval];
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId.toNumber(), raffle.address);
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying... ");
        await verify(raffle.address, args);
    }
    log("------------------------------------------------");
}

module.exports.tags = ["all", "raffle"]