// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @title ERC721A
 * @notice NFT relaunch contract from All Focked V2 to remove problematic code
 * @notice This contract is a fork of the ERC721A from Chiru-Labs
 * @author @kodr_eth kodr.eth
 */

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
\import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract RadRabbitz is ERC721A, ERC2981, Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
// variables
    address public AllFockedV1 = 0x4C2128E2B501C6FFF9b275f10C6bb6Ab8bF14E4e;
    address public AllFockedV2 = 0x54e2cd79b91D4C95853135dF6e265589c9781Dfe;
    address private Vault = 0x7A94B5f4C419975CfDce03f0FDf4b4C85acfcAb5;
    uint256 public constant MAX_SUPPLY = 5111;
    EnumerableSet.UintSet private reserved = EnumerableSet.UintSet({
        _values: [5092, 5071, 5102, 5111, 5000, 5001, 5002]
    });
    struct V1Holder {
        address holder;
        uint256 amount;
    }
    V1Holder[] public v1Holders; 
    struct TeamMember {
        address member;
        uint256 pfpID;
    }
    TeamMember[] private teamMembers = [
        TeamMember(0xF964c6449AC4A2Fb571cE78F2229e6a936880686, 5092),
        TeamMember(0x193a976e5b3ff43f08ced28Bfe6A27DD09d019b5, 5071),
        TeamMember(0xa8F045c97BaB4AEF16B5e2d84DE16f581D1C7654, 5101),
        TeamMember(0xf3ec3b5aa7fa0b8cc09d48ff7e7f1e102696a6e6, 5111), // need Salty addy
        TeamMember(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, 5100),
        TeamMember(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, 5102),
        TeamMember(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF, 5103),
    ];
// mappings
// events
    event Withdrawal(address indexed _addr, uint256 indexed _amount);
// constructor
    constructor(address[] memory _addresses, uint256[] memory _amounts) ERC721A("Rad Rabbitz", "RABBIT") {
        require(_addresses.length == _amounts.length, "RadRabbitz: addresses and amounts must be the same length");
        for (uint256 i = 0; i < _addresses.length; i++) {
            v1Holders.push(V1Holder(_addresses[i], _amounts[i]));
        }
        if (_tokenIdCounter.current() == 0) {
            _tokenIdCounter.increment();
        }
        _setDefaultRoyalty(msg.sender, 750); // 7.5% royalty
        _mintout();
    }
// mint function
    // @dev mint function for the airdrop, sends the correct address the correct number of tokens
    function _mintout() internal {
        // look at the previous holders of All Focked V2 mint each new token to the owner of the V2 token
        // if the owner is the vault address, send the token to an owner of the V1 token    
        for (uint256 i = _tokenId.current(); i < MAX_SUPPLY + 1; i++) {
            address owner = ERC721(AllFockedV2).ownerOf(i);
            if (owner == Vault) {
                // if the token id is reserved, send it to the team member
                if (EnumerableSet.contains(reserved, i)) {
                    for (uint256 j = 0; j < teamMembers.length; j++) {
                        if (teamMembers[j].pfpID == i) {
                            _safeMint(teamMembers[j].member, tokenID);
                            tokenID++;
                        }
                    }
                } else {
                    // if the token id is not reserved, send it to the V1 holder
                    for (uint256 j = 0; j < v1Holders.length; j++) {
                        if (v1Holders[j].amount > 0) {
                            _safeMint(v1Holders[j].holder, tokenID);
                            tokenID++;
                            v1Holders[j].amount--;
                        }
                    }
                }
                for (uint256 j = 0; j < v1Holders.length; j++) {
                    if (ERC721(AllFockedV1).ownerOf(v1Holders[j].amount) == v1Holders[j].holder) {
                        owner = v1Holders[j].holder;
                        break;
                    }
                }
            }
            _mint(owner, i);
        }
    }


// functions

    // @dev burn function for owner to destroy token
    function burn(uint256 tokenId) external {
        require(
            msg.sender == ERC721A.ownerOf(tokenId),
            "Only token owner can burn"
        );
        _burn(tokenId);
    }

    // @dev Supports Interface
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A, ERC2981) returns (bool) {
        // Supports the following `interfaceId`s:
        // - IERC165: 0x01ffc9a7
        // - IERC721: 0x80ac58cd
        // - IERC721Metadata: 0x5b5e139f
        // - IERC2981: 0x2a55205a
        return 
            ERC721A.supportsInterface(interfaceId) || 
            ERC2981.supportsInterface(interfaceId);
    }

    /**
     * @dev See {ERC721-_burn}. This override additionally clears the royalty information for the token.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
}
