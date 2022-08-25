// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title Kush ERC721A
 * @notice NFT Token Standard for ERC721A with post minting URI reveal and intigrated royalties 
 * and multilple campaings for the same token.
 * @dev Enter the URI for the campaigns image during create campaign.
 * @dev No decoded a Whitelist that can be exploited to mint tokens during a Whitelist phase, add WL participants by array of 100 addresses at a time.
 * @dev Easy DAPP design for adding Owner control panel to handle state and campaign deployments.
 * @author @kodr_eth kodr.eth
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Kush721 is ERC721, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using EnumerableSet for EnumerableSet.UintSet;
// variables
    enum State {
        NOT_ACTIVE,
        PUBLIC_ACTIVE,
        WL_ACTIVE
    }
    uint256 public TOTAL_CAMPAIGNS;
// mappings
    mapping(uint256 => State) public STATE;
    mapping(uint256 => EnumerableSet.UintSet) private CAMPAIGN_IDS;
    mapping(uint256 => uint256) public MAX_MINTS; // max mints for campaign
    mapping(uint256 => uint256) public MAX_SUPPLY; // max supply of campaign
    mapping(uint256 => uint256) public PUBLIC_PRICE; // price of token in public sale
    mapping(uint256 => uint256) public WL_PRICE; // price of token in whitelist
    mapping(uint256 => string) public CAMPAIN_URI; // base URI for campaign
    mapping(uint256 => mapping(address => uint256)) public USER_MINTS; // number of times an address has minted
    mapping(address => bool) public WHITELISTED; // token id to token
    mapping(uint256 => uint256) public TOTAL_SUPPLY; // price of token in whitelist
// events
    event WlAdded(address[] indexed _addr);
    event WlRemoved(address indexed _addr);
    event Withdrawal(address indexed _addr, uint256 indexed _amount);

// constructor
    constructor(
        uint256 _publicPrice,
        uint256 _wlPrice,
        string memory _campaignURI
    ) ERC721("KushLionMerch", "KLM") {
        _setDefaultRoyalty(msg.sender, 500);
        MAX_MINTS[0] = 1;
        MAX_SUPPLY[0] = 100;
        WL_PRICE[0] = _wlPrice;
        PUBLIC_PRICE[0] = _publicPrice;
        CAMPAIN_URI[0] = _campaignURI;
        TOTAL_SUPPLY[0] = 0;
        STATE[0] = State.NOT_ACTIVE;
        TOTAL_CAMPAIGNS = 1;
        for (uint256 i = 0; i < 100; i++) {
            CAMPAIGN_IDS[TOTAL_CAMPAIGNS].add(i + 1);
        }
    }
// mint function
    // @dev mint 1 token from the given campaign. If the campaign is not active, throw an error.
    function mint(uint256 campaign) external payable nonReentrant {
        require(
            campaign >= 0 && campaign <= TOTAL_CAMPAIGNS,
            "Campaign not found"
        );
        require(STATE[campaign] != State.NOT_ACTIVE, "Sale is not active");
        require(
            (USER_MINTS[campaign][msg.sender] + 1) <= MAX_MINTS[campaign],
            "Max Mints Reached"
        );
        uint256 _tokenId = _getNextTokenId(campaign);
        CAMPAIGN_IDS[campaign].add(_tokenId);
        TOTAL_SUPPLY[campaign]++;
        if (STATE[campaign] == State.WL_ACTIVE) {
            require(WHITELISTED[msg.sender], "Not whitelisted");
            require(msg.value >= (WL_PRICE[campaign]), "Not enough ETH sent");
            _safeMint(msg.sender, _tokenId);
        } else {
            require(
                STATE[campaign] == State.PUBLIC_ACTIVE,
                "Sale is not active"
            );
            require(
                msg.value >= (PUBLIC_PRICE[campaign]),
                "Not enough ETH sent"
            );
            _safeMint(msg.sender, _tokenId);
        }
    }
// external functions
    // @dev Add a campaign to the contract. to maintain a free gas call to get correct token id URI the owner pays to push the token id to the campaign id uint set.
    function createCampaign(
        uint256 _maxMints,
        uint256 _maxSupply,
        uint256 _wlPrice,
        uint256 _publicPrice,
        string memory _campaignURI
    ) public onlyOwner {
        uint256 lastID = CAMPAIGN_IDS[TOTAL_CAMPAIGNS - 1].at(
            MAX_SUPPLY[TOTAL_CAMPAIGNS - 1] - 1
        );

        MAX_MINTS[TOTAL_CAMPAIGNS] = _maxMints;
        MAX_SUPPLY[TOTAL_CAMPAIGNS] = _maxSupply;
        WL_PRICE[TOTAL_CAMPAIGNS] = _wlPrice;
        PUBLIC_PRICE[TOTAL_CAMPAIGNS] = _publicPrice;
        CAMPAIN_URI[TOTAL_CAMPAIGNS] = _campaignURI;
        STATE[TOTAL_CAMPAIGNS] = State.NOT_ACTIVE;
        for (uint256 i = 0; i < _maxSupply; i++) {
            lastID++;
            CAMPAIGN_IDS[TOTAL_CAMPAIGNS].add(lastID);
        }
        TOTAL_CAMPAIGNS++;
    }


    function burn(uint256 tokenId) external {
        require(
            msg.sender == ERC721.ownerOf(tokenId),
            "Only token owner can burn"
        );
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
            WHITELISTED[_addrs[i]] = true;
        }
        emit WlAdded(_addrs);
        return true;
    }

    function removeFromWhiteList(address _addr)
        external
        onlyOwner
        nonReentrant
    {
        require(WHITELISTED[_addr], "Not whitelisted");
        WHITELISTED[_addr] = false;
        emit WlRemoved(_addr);
    }

    // withdraw all tokens from the contract to the owner
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 0, "Not enough Avax to withdraw");
        emit Withdrawal(msg.sender, address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }

    // start the whitelist sale
    function startWlSale(uint256 campaign) external onlyOwner nonReentrant {
        require(STATE[campaign] != State.WL_ACTIVE, "WL already active");
        STATE[campaign] = State.WL_ACTIVE;
    }

    // start the public sale
    function startPublicSale(uint256 campaign) external onlyOwner nonReentrant {
        require(
            STATE[campaign] != State.PUBLIC_ACTIVE,
            "Public already active"
        );
        STATE[campaign] = State.PUBLIC_ACTIVE;
    }

    // Disable minting
    function disableMinting(uint256 campaign) external onlyOwner nonReentrant {
        require(
            STATE[campaign] != State.NOT_ACTIVE,
            "Minting already disabled"
        );
        STATE[campaign] = State.NOT_ACTIVE;
    }

    // function to set the base URI for the token
    function setCampaignBaseURI(uint256 campaign, string memory _URI)
        external
        onlyOwner
    {
        CAMPAIN_URI[campaign] = _URI;
    }

// public functions
    // @dev Supports Interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");
        uint256 _campaign = _getCampaign(tokenId);
        string memory baseURI = CAMPAIN_URI[_campaign];
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

// internal functions
    // @dev internal function to get the next token id to mint for a given campaign
    function _getNextTokenId(uint256 campaign) internal view returns (uint256) {
        // this is only called inside of the mint function and the mint function checks if the campain is valid
        return CAMPAIGN_IDS[campaign].at(TOTAL_SUPPLY[campaign]);
    }

    // @dev internal function to get campaign id from token id
    function _getCampaign(uint256 tokenId) internal view returns (uint256) {
        uint256 campaign;
        for (uint256 i = 0; i < TOTAL_CAMPAIGNS; i++) {
            if (CAMPAIGN_IDS[i].contains(tokenId)) {
                campaign = i;
            }
        }
        return campaign;
    }

    /**
     * @dev See {ERC721-_burn}. This override additionally clears the royalty information for the token.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
}
