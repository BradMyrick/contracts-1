// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title Assembler Payment Contract
 * @notice Recieves AVAX from a creator and authorizes the NFT reveal to that user.
 */


contract PaymentRecieved {
    bool public lock;

    address payable public owner;

    mapping(address => mapping(address => bool)) public Authorized;
    
    mapping(uint256 => uint256) public Prices;

    uint256 public increment;

    event AuthorizedEvent(address indexed sender, address indexed nftContract);    

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function initialize() public {
        increment = 1;
        lock = false;
    }
    function addPrice(uint256 _price) external onlyOwner {
        Prices[increment] = _price;
        increment++;
    }
    function changePrice(uint256 _index, uint256 _price) external onlyOwner {
        Prices[_index] = _price;
    }

    function authorize(uint256 _service, address _contract) external payable {
        require(!lock);
        lock = true;
        require(msg.value >= Prices[_service], "Not enough Avax sent");
        Authorized[msg.sender][_contract] = true;
        emit AuthorizedEvent(msg.sender, _contract);
        lock = false;
    }

    function isAuthorized(address _contract) public view returns (bool) {
        return Authorized[msg.sender][_contract];
    }

    function unlock() external onlyOwner {
        lock = false;
    }

    function withdraw() external onlyOwner {
        require(!lock);
        lock = true;
        owner.transfer(address(this).balance);
        lock = false;
    }
}