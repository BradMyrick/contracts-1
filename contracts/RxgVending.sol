// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RxgVending is ReentrancyGuard {
    // variables
    using SafeMath for uint256;
    address public immutable owner; // contract owner for access control
    IERC20 public immutable rxgToken; // erc20 token contract address
    uint256 public rxgPerAvax; // amount of rxg to receive per avax sent
    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // constructor
    constructor(uint256 _price, address _rxg) {
        owner = msg.sender;
        rxgPerAvax = _price;
        rxgToken = IERC20(_rxg);
    }

    // functions
    /// @notice sells rxg token for AVAX at the current pegged price
    function buyRxg() external payable nonReentrant {
        require(
            rxgToken.balanceOf(address(this)) >= msg.value.mul(rxgPerAvax),
            "Not enough RXG in contract to sell"
        );
        require(msg.value >= rxgPerAvax, "Not enough Avax sent");
        uint256 rxgAmount = msg.value.mul(rxgPerAvax);
        // transfer rxg token to the msg.sender
        require(
            rxgToken.transfer(msg.sender, rxgAmount),
            "Token transfer failed"
        );
    }

    /// @notice withdraws AVAX from the contract
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        uint256 avaxSupply = address(this).balance;
        require(
            avaxSupply >= _amount,
            "Not enough Avax in contract to withdraw"
        );
        emit Withdrawn(_amount, msg.sender);
        payable(owner).transfer(_amount);
    }

    /// @notice change the pegged price of rxg token
    function changePrice(uint256 _rxgPerAvax) external onlyOwner nonReentrant {
        require(
            _rxgPerAvax >= 1,
            "If the exchange rate is less than 1 to 1, trade on the open market"
        );
        rxgPerAvax = _rxgPerAvax;
        emit PriceChanged(_rxgPerAvax);
    }

    /// @notice add to the total supply of rxg token
    function addRxg(uint256 _amount) external nonReentrant returns (bool) {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            rxgToken.balanceOf(msg.sender) >= _amount,
            "Not enough RXG in wallet"
        );
        require(
            rxgToken.allowance(msg.sender, address(this)) >= _amount,
            "Not enough allowance to add RXG"
        );
        emit RxgAdded(_amount);
        // transfer rxg token to this contract
        bool success = rxgToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        return success;
    }

    // events
    event Purchase(address indexed to, uint256 amount);
    event Withdrawn(uint256 indexed amount, address indexed from);
    event PriceChanged(uint256 indexed price);
    event RxgAdded(uint256 indexed amount);
}
