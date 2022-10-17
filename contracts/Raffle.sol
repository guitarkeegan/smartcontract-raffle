// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__NotEnoughEthEntered();

///@author Keegan Anglim
///@title Raffle
contract Raffle is VRFConsumerBaseV2{
    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2){
        i_entranceFee = entranceFee;
    }

    /* Events */
    event RaffleEntered(address indexed player);

    ///@dev Sign up for raffle by sending required funds
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee){revert Raffle__NotEnoughEthEntered();}
        s_players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    // external is cheaper, this contract can't call it
    function requestRandomWinner() external view {

    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override{}

    /* view/pure functions */
    function getEntranceFee() public view returns(uint256){
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns(address){
        return s_players[index];
    }
}