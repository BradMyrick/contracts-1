// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC1155/presets/ERC1155PresetMinterPauser.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev {ERC1155} token, including:
 *
 *  - ability for the owner to create new token campaigns
 *  - ability for holders to burn (destroy) their tokens
 *  - BaseURI/id is URI setup. each campaign has a unique URI bassed off the uri given at creation. ie. https://kodr.eth/2 (all of campaign 2 metadata)
 *
 * The account that deploys the contract will be granted the owner
 * role, which will allow the deployer to remove the funds of the contract.
 *
 * @author @kodr_eth kodr.eth
 */
contract ERC1155PresetMinterPauser is Context, Ownable, ERC1155Burnable, ReentrancyGuard {
    // variables
    enum State {
        NOT_ACTIVE,
        PUBLIC_ACTIVE
    }
    uint256 public TOTAL_CAMPAIGNS;
    // mappings
    mapping(uint256 => State) public STATE;
    mapping(uint256 => uint256) public MAX_MINTS; // max mints for campaign
    mapping(uint256 => uint256) public MAX_SUPPLY; // max supply of campaign
    mapping(uint256 => uint256) public PUBLIC_PRICE; // price of token in public sale
    mapping(uint256 => mapping(address => uint256)) public USER_MINTS; // number of times an address has minted
    mapping(uint256 => uint256) public TOTAL_SUPPLY; // price of token in whitelist

    constructor(
        string memory uri,
        uint256 _publicPrice
    ) ERC1155(uri) {
        MAX_MINTS[0] = 2;
        MAX_SUPPLY[0] = 100;
        PUBLIC_PRICE[0] = _publicPrice;
        TOTAL_SUPPLY[0] = 5;
        STATE[0] = State.NOT_ACTIVE;
        TOTAL_CAMPAIGNS = 1;
        _mint(msg.sender, 0, 5, "");
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external payable nonReentrant {
        require(msg.value >= PUBLIC_PRICE[id]);
        require(id < TOTAL_CAMPAIGNS, "Campaign does not exist");
        require(STATE[id] == State.PUBLIC_ACTIVE, "Campaign is not active");
        require(
            (USER_MINTS[id][msg.sender] + amount) <= MAX_MINTS[id],
            "You have reached the max mints"
        );
        require(
            TOTAL_SUPPLY[id] + amount <= MAX_SUPPLY[id],
            "You have reached the max supply"
        );
        _mint(to, id, amount, "");
    }

    function createCampaign(
        uint256 _maxMints,
        uint256 _maxSupply,
        uint256 _publicPrice
    ) external onlyOwner nonReentrant {
        MAX_MINTS[TOTAL_CAMPAIGNS] = _maxMints;
        MAX_SUPPLY[TOTAL_CAMPAIGNS] = _maxSupply;
        PUBLIC_PRICE[TOTAL_CAMPAIGNS] = _publicPrice;
        STATE[TOTAL_CAMPAIGNS] = State.NOT_ACTIVE;
        TOTAL_CAMPAIGNS++;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    // start the public sale
    function startPublicSale(uint256 campaign) external onlyOwner nonReentrant {
        require(
            STATE[campaign] != State.PUBLIC_ACTIVE,
            "Public already active"
        );
        STATE[campaign] = State.PUBLIC_ACTIVE;
    }

    // withdraw all tokens from the contract to the owner
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 0, "Not enough ETH to withdraw");
        emit Withdrawal(msg.sender, address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }

    // Disable minting
    function disableMinting(uint256 campaign) external onlyOwner nonReentrant {
        require(
            STATE[campaign] != State.NOT_ACTIVE,
            "Minting already disabled"
        );
        STATE[campaign] = State.NOT_ACTIVE;
    }

    // events
    event Withdrawal(address indexed _addr, uint256 indexed _amount);
}
