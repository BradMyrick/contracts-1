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
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract RadRabbitz is ERC721A, ERC2981, Ownable, ReentrancyGuard {
// variables
    address public AllFockedV1 = 0x4C2128E2B501C6FFF9b275f10C6bb6Ab8bF14E4e;
    address public AllFockedV2 = 0x54e2cd79b91D4C95853135dF6e265589c9781Dfe;
    address private Vault = 0x7A94B5f4C419975CfDce03f0FDf4b4C85acfcAb5;
    uint256 public constant MAX_SUPPLY = 5111;
    struct V1Holder {
        address member;
        uint256 amount;
    }

    address[] public team =
    [   
        address(0xF964c6449AC4A2Fb571cE78F2229e6a936880686),
        address(0x193a976e5b3ff43f08ced28Bfe6A27DD09d019b5),
        address(0xa8F045c97BaB4AEF16B5e2d84DE16f581D1C7654),
        address(0x5d94A7740b4D76a488dC6AbE8839D033AD296f85),
        address(0xA37108eeAcf3f363A44B82024bb529459F0119E2),
        address(0xa8F045c97BaB4AEF16B5e2d84DE16f581D1C7654),
        address(0xa8F045c97BaB4AEF16B5e2d84DE16f581D1C7654)
    ];

// mappings
    mapping (uint => V1Holder) private _v1Holders;
    mapping (uint => uint) public V2TokenMap; // maps V1 token ID to V2 token ID
    // team



// events
    event Withdrawal(address indexed _addr, uint256 indexed _amount);
// constructor
    constructor(address[] memory _addresses, uint256[] memory _amounts) ERC721A("Rad Rabbitz", "RABBIT") {
        require(_addresses.length == _amounts.length, "RadRabbitz: addresses and amounts must be the same length");
        for (uint256 i = 0; i < _addresses.length; i++) {
            _v1Holders[i] = V1Holder(_addresses[i], _amounts[i]);
        }
        _setDefaultRoyalty(msg.sender, 750); // 7.5% royalty
        _mintout();
    }
// mint function
    // @dev mint function for the airdrop, sends the correct address the correct number of tokens
    function _mintout() internal {
        // look at the previous holders of All Focked V2 and map each new token to the old token 
        
        
            
    }

        /**
     * @dev Returns the starting token ID.
     * To change the starting token ID, please override this function.
     */
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
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
