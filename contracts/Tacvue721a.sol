// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title Terran ERC721A
 * @notice Tacvue NFT Token Standard for ERC721A with post minting URI reveal
 * @dev Enter the placeholder URI for the placeholder image during contract deployment
 * @dev No decoded a Whitelist that can be exploited to mint tokens during a Whitelist phase, add WL participants with addToWhiteList(address _addr).
 *      Once the Whitelist sale has been started, toggling on the saleIsActive bool will disable the whitelist and allow the sale to start.
 * @dev Assumptions (not checked, assumed to be always true):
 *        1) When assigning URI's to token IDs, the caller verified the URI is valid and matched to the token ID list provided.
 *        2) ERC721A Security meets the requirements of the ERC721 NFT standard,
 *        3) Number of tokens does not exceed `(2**256-1)/(2**96-1)`. Tested: 10,000
 * @author BradMyrick @kodr_eth
 */

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract Tacvue721a is ERC721A, ERC2981, Ownable, ReentrancyGuard {
    uint256 public MAX_MINTS;
    uint256 public MAX_SUPPLY;
    uint256 public mintPrice;
    uint256 public wlPrice;
    string public baseURI;
    bool public wlActive = false;
    bool public saleActive = false;
    address public feeCollector;

    mapping(address => uint256) public walletMints; // number of times an address has minted
    mapping(address => bool) public WhiteList; // token id to token URI

    event WlAdded(address[] indexed _addr);
    event WlRemoved(address indexed _addr);
    event Withdrawal(
        address indexed _feeCollector,
        uint256 _fee,
        address indexed _addr,
        uint256 indexed _amount
    );

    constructor(
        string memory _collectionName,
        string memory _ticker,
        uint96 _royaltyPoints,
        uint256 _maxMints,
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _wlPrice,
        string memory _placeholderURI,
        address _feeCollector
    ) ERC721A(_collectionName, _ticker) {
        require(_feeCollector != address(0), "Cannot be 0 address");
        _setDefaultRoyalty(msg.sender, _royaltyPoints);
        MAX_MINTS = _maxMints;
        MAX_SUPPLY = _maxSupply;
        mintPrice = _mintPrice;
        wlPrice = _wlPrice;
        baseURI = _placeholderURI;
        feeCollector = _feeCollector;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(saleActive != wlActive, "Minting Has Been Disabled");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max Supply Reached");
        walletMints[msg.sender] += quantity;
        require(
            walletMints[msg.sender] <= MAX_MINTS,
            "Max mints reached, lower amount to mint"
        );
        if (wlActive) {
            require(WhiteList[msg.sender], "Not whitelisted");
            require(msg.value >= (wlPrice * quantity), "Not enough Avax sent");
            _safeMint(msg.sender, quantity);
        } else {
            require(saleActive, "Sale not active");
            require(
                msg.value >= (mintPrice * quantity),
                "Not enough Avax sent"
            );
            _safeMint(msg.sender, quantity);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721A, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {ERC721-_burn}. This override additionally clears the royalty information for the token.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }

    function burn(uint256 tokenId) external {
        require(msg.sender == ERC721A.ownerOf(tokenId), "Only token owner can burn");
        _burn(tokenId);
    }

    // Bulk WhiteListing add up to 100 addresses at a time to the whitelist
    function bulkWhitelistAdd(address[] calldata _addrs)
        external
        onlyOwner
        nonReentrant
        returns (bool success)
    {
        require(
            _addrs.length <= 50,
            "Looping sucks on chain, use less than 50 addresses"
        );
        for (uint256 i = 0; i < _addrs.length; i++) {
            if (!WhiteList[_addrs[i]]) {
                WhiteList[_addrs[i]] = true;
            }
        }
        emit WlAdded(_addrs);
        return true;
    }

    function removeFromWhiteList(address _addr)
        external
        onlyOwner
        nonReentrant
    {
        require(WhiteList[_addr], "Not whitelisted");
        WhiteList[_addr] = false;
        emit WlRemoved(_addr);
    }

    // withdraw all tokens from the contract to the owner
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 100 wei, "Not enough Avax to withdraw");
        uint256 fee = (address(this).balance * 200) / 10000; // 2% fee
        uint256 profit = address(this).balance - fee;
        emit Withdrawal(feeCollector, fee, msg.sender, profit);
        payable(feeCollector).transfer(fee);
        payable(msg.sender).transfer(profit);
    }

    // toggle the sale status
    function saleActiveSwitch() external onlyOwner {
        if (wlActive) {
            wlActive = false;
        }
        saleActive = !saleActive;
    }

    // function to toggle the whitelist on and off
    function wlActiveSwitch() external onlyOwner {
        if (saleActive) {
            saleActive = false;
        }
        wlActive = !wlActive;
    }

    // function to set the base URI for the token
    function setBaseURI(string memory _URI) external onlyOwner {
        baseURI = _URI;
    }

    // override the _baseURI function in ERC721A
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // events
    event CollectionMinted(address indexed sender, uint256 indexed quantity);
}
