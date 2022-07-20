// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// contract to map addresses to twitter links for promotion
contract Blotter {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private users;
    IERC20 public immutable token;
    address public owner;
    uint256 public immutable cost;
    struct Tweet {
        bool live;
        string link;
        uint256 timestamp;
    }

    mapping(address => Tweet) public tweets;
    event TweetPromoted(address indexed user, string indexed link);
    event TweetDemoted(address indexed user, string indexed link);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can do this");
        _;
    }

    // entity check removed until new entity contract launch
    constructor(uint256 _cost, address _token) {
        // in wei, cost to promote a users twitter link
        token = IERC20(_token);
        owner = msg.sender;
        cost = _cost;
        }

    function promoteTweet(string memory _link) external {
        // check if the user is already promoted if so replace the tweet.
        if (tweets[msg.sender].live) {
            _killPromotion(msg.sender);
        }
        // must be approved by owner to transfer RXG
        address _addr = msg.sender;
        tweets[_addr].link = _link;
        tweets[_addr].timestamp = block.timestamp;
        tweets[_addr].live = true;
        require(users.add(_addr), "Failed to add tweet to user");
        Tweet memory _tweet = tweets[_addr];
        emit TweetPromoted(_addr, _tweet.link);
        require(
            token.transferFrom(msg.sender, address(this), cost),
            "RXG failed to transfer"
        );
    }


    function getTwitterLinks(address _addr) external view returns (Tweet memory) {
        return tweets[_addr];
    }

    function getUsers() external view returns (address[] memory) {
        return users.values();
    }

    function getAllTweets() external view returns (Tweet[] memory) {
        Tweet[] memory _tweets = new Tweet[](users.length());
        for (uint256 i = 0; i < users.length(); i++) {
            if (tweets[users.at(i)].live){
                _tweets[i] = tweets[users.at(i)];
            }
        }
        return _tweets;
    }

    function getCost() external view returns (uint256) {
        return cost;
    }

    function killPromotion(address _addr) external onlyOwner {
        require(tweets[_addr].live, "Promotion is not live");
        emit TweetDemoted(_addr, tweets[_addr].link);
        tweets[_addr].live = false;
        // remove from users
        require(users.remove(_addr), "Failed to remove user from users");
    }

    function _killPromotion(address _addr) internal {
        emit TweetDemoted (_addr, tweets[_addr].link);
        tweets[_addr].live = false;
        // remove from users
        require(users.remove(_addr), "Failed to remove user from users");
    }

}