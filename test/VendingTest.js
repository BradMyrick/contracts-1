const {
    expect
} = require("chai");
const {
    ethers,
    network
} = require("hardhat");
const {
    parseEther
} = require("ethers/lib/utils");

describe("ERC20Vending contract", function () {
    let ERC20Vending;
    let erc20Vending;
    let peggedPrice = 1000;
    let RxgToken;
    let rxgToken;


    beforeEach(async function () {
        [owner, addr1, addr2, addr3, buyer, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy(addr1.address, addr2.address, addr3.address);
        ERC20Vending = await ethers.getContractFactory("ERC20Vending");
        erc20Vending = await ERC20Vending.connect(owner).deploy(peggedPrice, rxgToken.address);
        await erc20Vending.deployed();
    });
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await erc20Vending.owner()).to.equal(owner.address);
        });
    });
    describe("Change Price", function () {
        it("Should change the price if owner", async function () {
            await erc20Vending.connect(owner).changePrice(parseEther("1"));
            expect(await erc20Vending.tokenPerAvax()).to.equal(parseEther("1"));
        });
        it("Should not change the price if not owner", async function () {
            await (expect(erc20Vending.connect(addr1).changePrice(parseEther("1"))).to.be.reverted);
        });
    });
    describe("Add Supply", function () {
        it("Should add supply if approved", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1"));
            await erc20Vending.connect(addr1).addERC20(parseEther("1"));
            expect(await rxgToken.balanceOf(erc20Vending.address)).to.equal(parseEther("1"));
        });
        it("Should not add supply if not approved", async function () {
            await (expect(erc20Vending.connect(addr1).addERC20(parseEther("1"))).to.be.reverted);
        });
        it("Should revert if you don't have enough approval", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1"));
            await (expect(erc20Vending.connect(addr1).addERC20(parseEther("2"))).to.be.reverted);
        });
        it("Should add the erc20 to the supply no matter what account you use", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1"));
            await erc20Vending.connect(addr1).addERC20(parseEther("1"));
            await rxgToken.connect(addr2).approve(erc20Vending.address, parseEther("2"));
            await erc20Vending.connect(addr2).addERC20(parseEther("2"));
            expect(await rxgToken.balanceOf(erc20Vending.address)).to.equal(parseEther("3"));
        });
    });
    describe("Buy Erc20", function () {
        it("Should buy erc20 if you have enough Base Token", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1000"));
            await erc20Vending.connect(addr1).addERC20(parseEther("1000"));
            expect(await rxgToken.balanceOf(erc20Vending.address)).to.equal(parseEther("1000"));
            await erc20Vending.connect(buyer).buyERC20({
                value: parseEther("1")
            });
            expect(await rxgToken.balanceOf(erc20Vending.address)).to.equal(0);
        });
        it("Should not buy erc20 if you don't have enough Avax", async function () {

            await (expect(erc20Vending.connect(addr1).buyERC20({
                value: 0
            })).to.be.reverted);
        });
        it("Should not buy erc20 if the Vending contract doesn't have enough erc20", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1"));
            await (expect(erc20Vending.connect(addr1).buyERC20({
                value: parseEther("1")
            })).to.be.reverted);
        });
    });
    describe("Withdraw", function () {
        it("Should withdraw if owner", async function () {
            await rxgToken.connect(addr1).approve(erc20Vending.address, parseEther("1000"));
            await erc20Vending.connect(addr1).addERC20(parseEther("1000"));
            expect(await rxgToken.balanceOf(erc20Vending.address)).to.equal(parseEther("1000"));
            await erc20Vending.connect(buyer).buyERC20({
                value: parseEther("1")
            });
            // get ether balance of erc20Vending contract
            tx = await erc20Vending.connect(owner).withdraw();
            results = await tx.wait();
            for (const event of results.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
        });
        it("Should not withdraw if not owner", async function () {
            await (expect(erc20Vending.connect(addr1).withdraw()).to.be.reverted);
        });
    });

});