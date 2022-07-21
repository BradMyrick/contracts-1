const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    utils
} = require("web3");
describe("Marketplace contracts", function () {

    let _buyNow = true
    let _directBuyPrice = ethers.utils.parseEther("1")
    let _startPrice = ethers.utils.parseEther(".01");
    let _tokenId = 0;
    let startTime = 1800000000
    let name = "Tacvue721a";
    let ticker = "TACV";
    let maxMints = 5;
    let royalty = 200; // should be 2% of sale price
    let maxSupply = 100;
    let mintPrice = ethers.utils.parseEther("1");
    let wlPrice = ethers.utils.parseEther("0.5");
    let placeholderUri = "https://tacvue.com";
    let _endTime = 800;



    beforeEach(async function () {
        [owner, creator, feeCollector, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        await network.provider.send("evm_setNextBlockTimestamp", [startTime])
        ManagerContract = await ethers.getContractFactory("AuctionManager");
        managerContract = await ManagerContract.connect(owner).deploy();
        await managerContract.deployed();
        startTime = startTime + 10000;

    });
    describe("Deployment", function () {
        it("Should show Owner as the Admin", async function () {
            role = await managerContract.DEFAULT_ADMIN_ROLE();
            expect(await managerContract.hasRole(role, owner.address)).to.equal(true);
        });
    });

    describe("Auction", function () {
        it("Should buy the NFT", async function () {
            // mint an nft and sell it
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, royalty, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            
            AuctionContract = await managerContract.connect(creator).createAuction(_endTime, _buyNow, _directBuyPrice, _startPrice, nftContract.address, _tokenId);
            auctionAddress = ethers.utils.getContractAddress(AuctionContract);
            auctionContract = await ethers.getContractAt("Auction", auctionAddress);
            let bid = ethers.utils.parseEther("1");
            await auctionContract.placeBid({
                value: bid
            });
        });
    });
});