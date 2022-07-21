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
    let _endTime = 307;
    let _buyNow = true
    let _directBuyPrice = ethers.utils.parseEther("1")
    let _startPrice = ethers.utils.parseEther(".01");
    let _tokenId = 5

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, _nftAddress, ...addrs] = await ethers.getSigners();
        ManagerContract = await ethers.getContractFactory("AuctionManager");

        managerContract = await ManagerContract.connect(owner).deploy();
        await managerContract.deployed();

    });
    describe("Deployment", function () {
        it("Should show Owner as the Admin", async function () {
            role = await managerContract.DEFAULT_ADMIN_ROLE();
            expect(await managerContract.hasRole(role, owner.address)).to.equal(true);
        }
        );
    });
});