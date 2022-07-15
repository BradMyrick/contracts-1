// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Recharge is ERC20Burnable {
// constructor 
    constructor(address _one, address _two, address _three) ERC20("Recharge", "RXG") {
        uint256 ammountOne = 1000000000 ether;
        uint256 ammountTwo = 1000000000 ether;
        uint256 ammountThree = 8000000000 ether;
        _mint(_one, ammountOne);
        _mint(_two, ammountTwo);
        _mint(_three, ammountThree);
    }
}