// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title Packs ERC721A
 * @notice Tacvue NFT Token Standard for ERC721A with instant reveal and mints in pack sizes decided by the owner at deployment
 * @dev No decoded a Whitelist that can be exploited to mint tokens during a Whitelist phase, add WL participants with addToWhiteList(address _addr).
 *      Once the Whitelist sale has been started, toggling on the saleIsActive bool will disable the whitelist and allow the sale to start. 
 * @dev Assumptions (not checked, assumed to be always true):
 *        1) When assigning URI's to token IDs, the caller verified the URI is valid and matched to the token ID list provided.
 *        2) ERC721A Security meets the requirements of the ERC721 NFT standard,
 *        3) Number of tokens does not exceed `(2**256-1)/(2**96-1)`. Tested: 10,000
 * @author BradMyrick @kodr_eth 
 */


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Packs721a is ERC721, Ownable, ReentrancyGuard {
    uint256 public immutable MAX_MINTS; 
    uint256 public immutable MAX_SUPPLY; 
    uint256 public TOTAL_SUPPLY;
    uint256 public immutable packSize;
    uint256 public immutable mintPrice;   
    uint256 public immutable wlPrice;     
    string public baseURI;
    bool public wlActive = false;
    bool public saleActive = false;
    address public immutable feeCollector;

    mapping(uint256 => uint256[]) public Packs; // pack id to pack token id's
    mapping(address => uint256) public walletMints; // number of times an address has minted
    mapping(address => bool) public WhiteList; // token id to token URI




    constructor(string memory _name, string memory _ticker, uint256 _maxMints, uint256 _mintPrice, uint256 _wlPrice, string memory _baseURI, address _feeCollector, uint256 _packSize, uint256 _numOfPacks) ERC721(_name, _ticker){
        MAX_MINTS = _maxMints;
        mintPrice = _mintPrice;
        wlPrice = _wlPrice;
        TOTAL_SUPPLY = 0;
        baseURI = _baseURI;
        feeCollector = _feeCollector;
        packSize = _packSize;
        uint256 nextTokenId = 1;
        for (uint256 i = 1; i <= _numOfPacks; i++) {
            for (uint256 j = 1; j <= _packSize; j++) {
                Packs[i].push(nextTokenId);
                nextTokenId++;
            }
        }
        MAX_SUPPLY = nextTokenId - 1;
    }

    function mint(uint256 _selection) external payable nonReentrant {
        require(saleActive != wlActive, "Minting Has Been Disabled");
        require(TOTAL_SUPPLY + packSize <= MAX_SUPPLY, "Max Supply Reached");
        walletMints[msg.sender] += packSize;
        require(walletMints[msg.sender] <= MAX_MINTS, "Max mints reached, lower amount to mint");
        emit Minted(msg.sender, _selection, packSize);
        if (wlActive) {
            require(WhiteList[msg.sender], "Not whitelisted");
            require(msg.value >= (wlPrice), "Not enough Avax sent");
            for (uint256 i = 1; i <= packSize; i++) {
                _safeMint(msg.sender, Packs[_selection][i]);
                TOTAL_SUPPLY += 1;
            }
        } else {
            require(saleActive, "Sale not active");
            require(msg.value >= (mintPrice), "Not enough Avax sent");
            for (uint256 i = 1; i <= packSize; i++) {
                _safeMint(msg.sender, Packs[_selection][i]);
                TOTAL_SUPPLY += 1;
            }
        }
    }


    // Bulk WhiteListing add up to 50 addresses at a time to the whitelist
    function bulkWhitelistAdd(address[] calldata _addrs) external onlyOwner nonReentrant returns(bool success) {
        require(_addrs.length <= 50, "Looping sucks on chain, use less than 50 addresses");
        for (uint i = 0; i < _addrs.length; i++) {
            if (!WhiteList[_addrs[i]]) {
                WhiteList[_addrs[i]] = true;
            }
        }
        emit WlAdded(_addrs);
        return true;
    }

    function removeFromWhiteList(address _addr) external onlyOwner nonReentrant {
        require(WhiteList[_addr], "Not whitelisted");
        WhiteList[_addr] = false;
        emit WlRemoved(_addr);
    }
    // withdraw all tokens from the contract to the owner
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 100 wei, "Not enough Avax to withdraw");
        uint256 fee = address(this).balance * 2 / 100;
        payable(feeCollector).transfer(fee);
        emit FeeCollected(feeCollector, fee);
        payable(msg.sender).transfer(address(this).balance - fee);
        emit Withdrawal(msg.sender, address(this).balance - fee);
    }
    // toggle the sale status
    function saleActiveSwitch() external onlyOwner {
        if (wlActive){ wlActive = false;}
        saleActive = !saleActive;
    }
    // function to toggle the whitelist on and off
    function wlActiveSwitch() external onlyOwner {
        if (saleActive){ saleActive = false;}
        wlActive = !wlActive;
    }

    // override the _baseURI function in ERC721A
    function _baseURI() override internal view virtual returns (string memory) {
        return baseURI;
    }

// events
    event Minted(address indexed sender, uint256 indexed selection, uint256 amount);
    event WlAdded(address[] indexed _addr);
    event WlRemoved(address indexed _addr);
    event Withdrawal(address indexed _addr, uint256 indexed _amount);
    event FeeCollected(address indexed _addr, uint256 indexed _amount);

}