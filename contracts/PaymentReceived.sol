// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  Payment Recieved Contract
 * @notice Recieves RXG erc20 from a creator and authorizes that user on the contract specified.
 * @author BradMyrick @kodr_eth
 */

contract PaymentReceived is ReentrancyGuard {
    IERC20 public paymentToken;
    uint256 public assemblerPrice;
    address public multiSigWallet;
    address public owner;
    /// @dev mapping from Callers address to their nft contract address and a paid bool.
    mapping(address => mapping(address => bool)) public Authorized;

    event AuthorizedEvent(address indexed sender, address indexed nftContract);
    event Withdraw(uint256 indexed amount);


    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyNftCreator(address nftContract) {
        require(msg.sender == Ownable(nftContract).owner(), "Only the collection creator can perform this action");
        _;
    }

    constructor(address _rxg, uint256 _amount, address _multiSigWallet) {
        paymentToken = IERC20(_rxg);
        owner = payable(msg.sender);
        multiSigWallet = _multiSigWallet;
        assemblerPrice = _amount;
    }

    function changePrice(uint256 _price) external onlyOwner {
        assemblerPrice = _price;
    }

    // todo: add onlyNftCreator(_contract) to this function. removed for testing.
    function authorize(address _contract) external nonReentrant  returns(bool _success) {
        require(_contract != address(0), "PaymentReceived: INVALID_ADDRESS");
        require(paymentToken.allowance(msg.sender, address(this)) >= assemblerPrice, "PaymentReceived: INSUFFICIENT_TOKEN_ALLOWANCE");
        require(!Authorized[msg.sender][_contract], "Already authorized");
        emit AuthorizedEvent(msg.sender, _contract);
        Authorized[msg.sender][_contract] = true;
        return(paymentToken.transferFrom(msg.sender, multiSigWallet, assemblerPrice));
    }
}