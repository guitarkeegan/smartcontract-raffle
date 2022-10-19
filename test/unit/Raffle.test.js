const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper.hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    // describe the contract
    : describe("Raffle", async function(){
        let raffle, vrfCoodinatorV2Mock, raffleEntranceFee, deployer, interval;
        const chainId = network.config.chainId;

        beforeEach(async function(){
            // deployer is the address?
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoodinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });
        // the method
        describe("constructor", async function(){
            // try to use one assert per it
            it("initializes the raffle correctly", async function(){
                const raffleState = await raffle.getRaffleState();
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
            })
        });
        describe("enterRaffle", async function(){

            it("should revert if entrance fee is not enough", async function(){
                await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughEthEntered");
            });
            
            it("records players when they enter", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                const playerFromContract = await raffle.getPlayer(0);
                assert.equal(playerFromContract, deployer);
            });

            it("emits event on enter", async function(){
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(raffle, "RaffleEntered");
            });

            it("doesn't allow entrance when raffle is calculating", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []) // one extra block
                // pretend to be a chainlink keeper. pass empty calldata
                await raffle.performUpkeep([]);
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith("Raffle__NotOpen");
            });

        })
    })