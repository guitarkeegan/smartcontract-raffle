const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper.hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    // describe the contract
    : describe("Raffle", function(){
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
        describe("constructor", function(){
            // try to use one assert per it
            it("initializes the raffle correctly", async function(){
                const raffleState = await raffle.getRaffleState();
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
            })
        });
        describe("enterRaffle", function(){

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

        });
        describe("checkUpkeep", function(){
            it("returns false if people haven't sent any eth", async function(){
                // make everyting true exept for the funding amount
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                // simulate the trasaction rather than calling the public method and starting a transaction.
                // callStatic just to see response
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
                assert(!upkeepNeeded);

            })
            it("returns false if raffle isn't open", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await raffle.performUpkeep("0x") // same as []
                const raffleState = await raffle.getRaffleState();
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
                assert.equal(raffleState.toString(), "1");
                assert.equal(upkeepNeeded, false);
            });
            it("returns false if enough time hasn't passed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })
            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded)
            })
        });
        describe("performUpkeep", function(){
            it("it can only run if checkUpkeep is true", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] });
                const tx = await raffle.performUpkeep([]);
                assert(tx);
            })
            it("reverts when checkUpkeep is false", async function(){
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded");
            });
            it("updates the raffle state, emits and event, calls the vrfCoordinator", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] });
                const txResponse = await raffle.performUpkeep([]);
                const txReceipt = await txResponse.wait(1);
                const requestId = txReceipt.event[1].args.requestId;
                const raffleState = await raffle.getRaffleState();
                assert(requestId.toNumber() > 0);
                assert(raffleState.toNumber() == 1);
            });
        });
        describe("fulfillRandomWords", function(){
            beforeEach(async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
            });
            it("can only be called after performUpkeep", async function(){
                await expect(vrfCoodinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request");
                await expect(vrfCoodinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request");
            })
        })
    })