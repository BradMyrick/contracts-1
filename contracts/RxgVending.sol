// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";



contract RxgVending is  ReentrancyGuard {
// variables
    using SafeMath for uint256;
    address public immutable owner; // contract owner for access control
    IERC20 public immutable rxgToken; // erc20 token contract address
    uint256 public peggedPrice; // purchase price of rxg with pegged token. ex: for 1 rxg = 100 wei in AVAX,  peggedPrice would be equal to 100
    uint256 public rxgSupply; // total supply of rxg pegged token that can be sold
// modifiers
    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }
// constructor 
    constructor(uint256 _price, address _rxg) {
        owner = msg.sender;
        peggedPrice = _price; 
        rxgToken = IERC20(_rxg);
    }
// functions
    /// @notice sells rxg token for AVAX at the current pegged price
    function buy() external payable nonReentrant { 
        require(rxgSupply >= msg.value.div(peggedPrice), "Not enough RXG in contract to sell");
        require(msg.value >= peggedPrice, "Not enough Avax sent");
        uint256 rxgAmount = msg.value.div(peggedPrice);
        rxgSupply = rxgSupply.sub(rxgAmount);
        // transfer rxg token to the msg.sender
        rxgToken.transfer(msg.sender, rxgAmount);
    }
    /// @notice withdraws AVAX from the contract
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        uint256 avaxSupply = address(this).balance;
        require(avaxSupply >= _amount, "Not enough Avax in contract to withdraw");
        payable(owner).transfer(_amount);
        emit Withdrawn(_amount, msg.sender);
    }
    /// @notice change the pegged price of rxg token
    function changePrice(uint256 _price) external onlyOwner nonReentrant {
        require(_price > 0, "Price must be greater than 0");
        peggedPrice = _price;
        emit PriceChanged(_price);
    }
    /// @notice add to the total supply of rxg token
    function addRxg(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(rxgToken.balanceOf(msg.sender) >= _amount, "Not enough RXG in wallet");
        require(rxgToken.allowance(msg.sender, address(this)) >= _amount, "Not enough allowance to add RXG");
        rxgSupply = rxgSupply.add(_amount);
        emit RxgAdded(_amount);
        // transfer rxg token to this contract
        rxgToken.transferFrom(msg.sender, address(this), _amount);
    }
// events
    event Purchase(address indexed to, uint256 amount);
    event Withdrawn(uint256 indexed amount, address indexed from);
    event PriceChanged(uint256 indexed price);
    event RxgAdded(uint256 indexed amount);
}