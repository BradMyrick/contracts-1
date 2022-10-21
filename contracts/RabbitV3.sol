// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './constants.sol';

/**
 * @title ERC721A
 * @notice NFT relaunch contract from All Focked V2 to remove problematic code
 * @notice This contract will automatically mint and assign ownership to the entire collection
 * @notice At contract construction, the token IDs will be assigned to the addresses in the mapping
 * @author @kodr_eth kodr.eth
 */

contract RadRabbitz is ERC721Enumerable, ERC721Burnable, Ownable {
// variables
using Counters for Counters.Counter;
Counters.Counter private _tokenIdCounter;
Constants constants;
address[] private V1Holders = constants.V1Holders();
address[] private V2Holders = constants.V2Holders();


// mappings
// events
// constructor
    constructor() ERC721("Rad Rabbitz", "RABZ") {
        if(_tokenIdCounter.current() == 0){
            _tokenIdCounter.increment();
        }
        uint V2Stop = V2Holders.length + 1;
        uint V1Stop = V1Holders.length + 1;
        for (_tokenIdCounter.current(); _tokenIdCounter.current() < V2Stop; _tokenIdCounter.increment()) {
            _safeMint(V2Holders[_tokenIdCounter.current()], _tokenIdCounter.current());
        }
        for (_tokenIdCounter.current(); _tokenIdCounter.current() < V1Stop; _tokenIdCounter.increment()) {
            _safeMint(V1Holders[_tokenIdCounter.current()], _tokenIdCounter.current());
        }

        
    }
    
}
