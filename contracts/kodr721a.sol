// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title KODR ERC721A
 * @notice Tacvue NFT Token Standard for ERC721A with post minting URI reveal and intigrated royalties
 * @dev Enter the placeholder URI for the placeholder image during contract deployment
 * @dev No decoded a Whitelist that can be exploited to mint tokens during a Whitelist phase, add WL participants by array of 100 addresses at a time.
 * @dev Easy DAPP design for adding Owner control panel to handle state and reveal URI.
 * @author @kodr_eth kodr.eth
 */

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract Kodr721a is ERC721A, ERC2981, Ownable, ReentrancyGuard {
    uint256 public MAX_MINTS;
    uint256 public MAX_SUPPLY;
    uint256 public mintPrice;
    uint256 public publicPrice;
    string public baseURI;

    enum State {
        NOT_ACTIVE,
        PUBLIC_ACTIVE,
        WL_ACTIVE
    }
    State public state;


    mapping(address => uint256) public walletMints; // number of times an address has minted
    mapping(address => bool) public WhiteList; // token id to token URI

    event WlAdded(address[] indexed _addr);
    event WlRemoved(address indexed _addr);
    event Withdrawal(
        address indexed _addr,
        uint256 indexed _amount
    );

    constructor(
        string memory _collectionName,
        string memory _ticker,
        uint96 _royaltyPoints,
        uint256 _maxMints,
        uint256 _maxSupply,
        uint256 _publicPrice,
        uint256 _wlPrice,
        string memory _placeholderURI
    )
        ERC721A(_collectionName, _ticker)
    {
        _setDefaultRoyalty(msg.sender, _royaltyPoints);

        MAX_MINTS = _maxMints;
        MAX_SUPPLY = _maxSupply;
        mintPrice = _publicPrice;
        publicPrice = _wlPrice;
        baseURI = _placeholderURI;
        state = State.NOT_ACTIVE;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(state != State.NOT_ACTIVE, "Sale is not active");
        require((totalSupply() + quantity) <= MAX_SUPPLY, "Max Supply Reached");
        walletMints[msg.sender] += quantity;
        require(
            (walletMints[msg.sender] + quantity) <= MAX_MINTS,
            "Max mints reached"
        );
        if (state == State.WL_ACTIVE) {
            require(WhiteList[msg.sender], "Not whitelisted");
            require(msg.value >= (publicPrice * quantity), "Not enough Avax sent");
            _safeMint(msg.sender, quantity);
        } else if(state == State.PUBLIC_ACTIVE) {
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
    function addToWhitelist(address[] calldata _addrs)
        external
        onlyOwner
        nonReentrant
        returns (bool success)
    {
        require(
            _addrs.length <= 100,
            "Looping sucks on chain, use 100 addresses or less at a time"
        );
        for (uint256 i = 0; i < _addrs.length; i++) {
                WhiteList[_addrs[i]] = true;
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
        require(address(this).balance > 0, "Not enough Avax to withdraw");
        emit Withdrawal(msg.sender, address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }

    // start the whitelist sale
    function startWlSale() external onlyOwner nonReentrant {
        require(state != State.WL_ACTIVE, "WL already active");
        state = State.WL_ACTIVE;
    }
    // start the public sale
    function startPublicSale() external onlyOwner nonReentrant {
        require(state != State.PUBLIC_ACTIVE, "Public already active");
        state = State.PUBLIC_ACTIVE;
    }
    // Disable minting 
    function disableMinting() external onlyOwner nonReentrant {
        require(state != State.NOT_ACTIVE, "Minting already disabled");
        state = State.NOT_ACTIVE;
    }

    // function to set the base URI for the token
    function setBaseURI(string memory _URI) external onlyOwner {
        baseURI = _URI;
    }

    // override the _baseURI function in ERC721A
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

}