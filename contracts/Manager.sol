// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Auction.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AuctionManager is AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    EnumerableSet.AddressSet private auctions;
    address public caller;
    struct NFTcollection {
        EnumerableSet.AddressSet collection;
        EnumerableSet.UintSet tokenIDs;
        mapping(uint256 => address) auctionIndex;
    }

    mapping(address => bool) public collectionPresent; // I'm using an API to fetch nft collection information so I just need a trigger if added.
    mapping(address => NFTcollection) private NFTcollections; // auction info

    bytes32 public constant AUCTION_ADDRESS = keccak256("AUCTION_ADDRESS");

    // constructor
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createAuction(
        uint256 _endTime,
        bool _buyNow,
        uint256 _directBuyPrice,
        uint256 _startPrice,
        address _nftAddress,
        uint256 _tokenId
    ) external nonReentrant returns (address _auctionAddress) {
        require(
            _directBuyPrice >= 1000000000000000 wei,
            "Direct buy price must be greater than 1000000000000000 wei"
        ); //
        require(_startPrice <= _directBuyPrice); // start price is smaller than direct buy price
        require(_endTime > 5 minutes); // end time must be greater than 5 minutes (setting it to 5 minutes for testing you can set it to 1 days or anything you would like)
        Auction auction = new Auction(
            msg.sender,
            _endTime,
            _buyNow,
            1000000000000000 wei,
            _directBuyPrice,
            _startPrice,
            _nftAddress,
            _tokenId
        ); // create the auction
        auctions.add(address(auction)); // add the auction to the list of auctions
        _grantRole(AUCTION_ADDRESS, address(auction)); // grant the auction role to the auction
        if (!collectionPresent[_nftAddress]) {
            // if the collection is not present
            emit collectionAdded(_nftAddress);
            collectionPresent[_nftAddress] = true;
        }
        NFTcollections[_nftAddress].collection.add(address(auction));
        bool _added = NFTcollections[_nftAddress].tokenIDs.add(_tokenId);
        if (_added) {
            emit tokenAdded(_nftAddress, _tokenId);
        }
        NFTcollections[_nftAddress].auctionIndex[_tokenId] = address(auction);

        emit auctionCreated(address(auction));
        // token transfer to the auction
        IERC721 _nftToken = IERC721(_nftAddress); // get the nft token
        _nftToken.transferFrom(msg.sender, address(auction), _tokenId); // transfer the token to the auction
        return address(auction); // return the address of the auction
    }

    // Return a list of all auctions
    function getAuctions() external view returns (address[] memory _auctions) {
        _auctions = auctions.values();
        return _auctions;
    }

    // get collection info for token id
    function getOneNFT(address _NFT, uint256 _tokenId)
        external
        view
        returns (address _info)
    {
        // get auctions for token id
        require(NFTcollections[_NFT].tokenIDs.contains(_tokenId));
        require(
            NFTcollections[_NFT].auctionIndex[_tokenId] != address(0),
            "Token is not for sale"
        );
        return NFTcollections[_NFT].auctionIndex[_tokenId];
    }

    // get all for sale for collection
    function collectionGetAllForSale(address _NFT)
        external
        view
        returns (address[] memory _info)
    {
        // get auctions for all token ids
        return NFTcollections[_NFT].collection.values();
    }

    // Return the information of each auction address
    function getAuctionInfo(address _addy)
        external
        view
        returns (Auction.Info memory)
    {
        return Auction(_addy).getInfo();
    }

    // withdraw funds by admin
    function withdrawFunds()
        external
        nonReentrant
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender)); // require that the sender has the admin role
        uint256 _amount = address(this).balance;
        emit managerFundsWithdrawn(_amount); // emit the event
        payable(msg.sender).transfer(_amount); // transfer the funds to the given address
    }

    // auction state change
    function auctionStateChanged(uint256 _state) external {
        require(hasRole(AUCTION_ADDRESS, msg.sender), "You are not an auction"); // only the auction can change the state
        if (_state == 1 || _state == 3 || _state == 4) {
            // if the state is 1, 3 or 4 (auction is canceled, auction is direct buy or auction is auction buy)
            _removeAuction(msg.sender); // remove the auction
        }
        emit AuctionState(msg.sender, _state);
    }

    // remove finished auctions from the mapping
    function _removeAuction(address _auction) internal {
        auctions.remove(_auction); // remove the auction from the list
        NFTcollections[Auction(_auction).nftAddress()].collection.remove(
            _auction
        ); // remove the auction from the collection
        NFTcollections[Auction(_auction).nftAddress()].auctionIndex[
            Auction(_auction).tokenId()
        ] = address(0); // remove the auction from the auction index
        _revokeRole(AUCTION_ADDRESS, _auction); // revoke the auction role
    }



    // events
    event AuctionState(address indexed auction, uint256 indexed state);
    event collectionAdded(address indexed collection); // Event for when a collection is added
    event tokenAdded(address indexed collection, uint256 indexed tokenId); // Event for when a token is added
    event auctionCreated(address indexed auction); // Event for when an auction is created
    event managerFundsWithdrawn(uint256 indexed amount); // Event for when funds are withdrawn
}
