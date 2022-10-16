// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

Raffle__NotEnoughEthEntered();

///@author Keegan Anglim
///@title Raffle
contract Raffle{
    // entrance fee is set in constructor
    uint256 private immutable i_entranceFee;

    constructor(uint256 entranceFee){
        i_entranceFee = entranceFee;
    }

    ///@dev Sign up for raffle by sending required funds
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee){revert Raffle__NotEnoughEthEntered();}
    }

    // function pickRandomWinner() public view {}

    // get the entrance fee
    function getEntranceFee() public view returns(uint256){
        return i_entranceFee;
    }
}