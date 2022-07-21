// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Entity ERC721A
 * @notice Tacvue Genesis Entity NFT Token Standard for ERC721A with post minting URI reveal
 * @dev Enter the placeholder URI for the placeholder image during contract deployment
 * @author BradMyrick @kodr_eth
 */

contract Entity721a is ERC721A, Ownable, ReentrancyGuard {
    bool public mintLive;
    string public placeHolderURI = "https://tacvue.io/placeholder.png"; // todo: replace placeholder fake link

    /// @dev token uri mapping
    mapping(uint256 => string) public tokenURIs;
    mapping(uint256 => bool) public tokenRevealed;
    modifier onlyTokenOwner(uint256 _tokenId) {
        require(
            ownerOf(_tokenId) == msg.sender,
            "Only the token owner can call this function"
        );
        _;
    }

    constructor() ERC721A("Genesis Entity", "TVGE") {
        mintLive = true;
    }

    function mint() external nonReentrant {
        require(mintLive, "Minting is nolonger live");
        // only one entity can be held by a wallet
        require(balanceOf(msg.sender) == 0, "You already have a genesis");
        // set token uri to placeholder
        tokenURIs[_nextTokenId()] = placeHolderURI;
        _safeMint(msg.sender, 1, "Genesis Entity");
    }

    /// @dev function to set the token URI for a minted token
    function setTokenURI(string memory _URI, uint256 _tokenId)
        external
        onlyTokenOwner(_tokenId)
        nonReentrant
    {
        require(!tokenRevealed[_tokenId], "Token has already been revealed");
        tokenURIs[_tokenId] = _URI;
        tokenRevealed[_tokenId] = true;
    }

    /// @dev override the tokenURI function in ERC721A
    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        // require the token to exist
        require(_exists(_tokenId), "Token does not exist");
        return tokenURIs[_tokenId];
    }

    /// @dev disable mint permanently
    // todo: switch to deadman switch, not permanently disabled this way for testing purposes
    function disableMint() external onlyOwner {
        mintLive = false;
    }

    /// @dev burn a token
    function burn(uint256 _tokenId)
        external
        onlyTokenOwner(_tokenId)
        nonReentrant
    {
        require(_exists(_tokenId), "Token does not exist");
        _burn(_tokenId);
    }
}
