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
    let _tokenId = 5
    let _minIncrement = ethers.utils.parseEther(".01");


    beforeEach(async function () {
        [owner, creator, addr1, addr2, addr3, _nftAddress, ...addrs] = await ethers.getSigners();
        await network.provider.send("evm_setNextBlockTimestamp", [1700000000])
        let _endTime = 1700000500;
        ManagerContract = await ethers.getContractFactory("AuctionManager");
        managerContract = await ManagerContract.connect(owner).deploy();
        await managerContract.deployed();
        AuctionContract = await ethers.getContractFactory("Auction");
        auctionContract = await AuctionContract.connect(owner).deploy(creator.address, _endTime, _buyNow, _minIncrement, _directBuyPrice, _startPrice, _nftAddress.address, _tokenId);
        await auctionContract.deployed();

    });
    describe("Deployment", function () {
        it("Should show Owner as the Admin", async function () {
            role = await managerContract.DEFAULT_ADMIN_ROLE();
            expect(await managerContract.hasRole(role, owner.address)).to.equal(true);
        });
    });
});