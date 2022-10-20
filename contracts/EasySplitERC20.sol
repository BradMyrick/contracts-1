// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Recharge is ERC20Burnable {
    // constructor
    uint256 constant ammountOne = 1000000000;
    uint256 constant ammountTwo = 1000000000;
    uint256 constant ammountThree = 8000000000;

    constructor(
        address _one,
        address _two,
        address _three
    ) ERC20("Recharge", "RXG") {
        _mint(_one, (ammountOne * 1 ether));
        _mint(_two, (ammountTwo * 1 ether));
        _mint(_three, (ammountThree * 1 ether));
    }
}
