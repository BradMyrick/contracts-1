// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20Vending is ReentrancyGuard {
    // variables
    using SafeMath for uint256;
    address public immutable owner; // contract owner for access control
    IERC20 public immutable ERC20Token; // erc20 token contract address
    uint256 public tokenPerAvax; // amount of ERC20 to receive per avax sent
    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // constructor
    constructor(uint256 _price, address _ERC20) {
        owner = msg.sender;
        tokenPerAvax = _price;
        ERC20Token = IERC20(_ERC20);
    }

    // functions
    /// @notice sells ERC20 token for AVAX at the current pegged price
    function buyERC20() external payable nonReentrant {
        require(
            ERC20Token.balanceOf(address(this)) >= msg.value.mul(tokenPerAvax),
            "Not enough ERC20 in contract to sell"
        );
        require(msg.value >= tokenPerAvax, "Not enough Avax sent");
        uint256 ERC20Amount = msg.value.mul(tokenPerAvax);
        // transfer ERC20 token to the msg.sender
        require(
            ERC20Token.transfer(msg.sender, ERC20Amount),
            "Token transfer failed"
        );
    }

    /// @notice withdraws AVAX from the contract
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "No AVAX to withdraw");
        emit Withdrawn(amount, msg.sender);
        payable(owner).transfer(amount);
    }

    /// @notice change the pegged price of ERC20 token
    function changePrice(uint256 _tokenPerAvax) external onlyOwner nonReentrant {
        require(
            _tokenPerAvax >= 1,
            "If the exchange rate is less than 1 to 1, trade on the open market"
        );
        tokenPerAvax = _tokenPerAvax;
        emit PriceChanged(_tokenPerAvax);
    }

    /// @notice add to the total supply of ERC20 token
    function addERC20(uint256 _amount) external nonReentrant returns (bool) {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            ERC20Token.balanceOf(msg.sender) >= _amount,
            "Not enough ERC20 in wallet"
        );
        require(
            ERC20Token.allowance(msg.sender, address(this)) >= _amount,
            "Not enough allowance to add ERC20"
        );
        emit ERC20Added(_amount);
        // transfer ERC20 token to this contract
        bool success = ERC20Token.transferFrom(
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
    event ERC20Added(uint256 indexed amount);
}
