// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Recharge is ERC20Burnable {
// variables
    uint256 public maxSupply = 10000000000 ether; // max supply of rxg
    uint256 public unmintedSupply; // total supply of rxg pegged token that can be sold
// constructor 
    constructor(
    ) ERC20("Recharge", "RXG") {
        uint256 initialSupply = 10000000000 ether;
        _mint(msg.sender, initialSupply);
    }
}