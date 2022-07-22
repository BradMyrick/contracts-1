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

describe("RxgVending contract", function () {
    let RxgVending;
    let rxgVending;
    let peggedPrice = 1000;
    let RxgToken;
    let rxgToken;


    beforeEach(async function () {
        [owner, addr1, addr2, addr3, buyer, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy(addr1.address, addr2.address, addr3.address);
        RxgVending = await ethers.getContractFactory("RxgVending");
        rxgVending = await RxgVending.connect(owner).deploy(peggedPrice, rxgToken.address);
        await rxgVending.deployed();
    });
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await rxgVending.owner()).to.equal(owner.address);
        });
    });
    describe("Change Price", function () {
        it("Should change the price if owner", async function () {
            await rxgVending.connect(owner).changePrice(parseEther("1"));
            expect(await rxgVending.rxgPerAvax()).to.equal(parseEther("1"));
        });
        it("Should not change the price if not owner", async function () {
            await (expect(rxgVending.connect(addr1).changePrice(parseEther("1"))).to.be.reverted);
        });
    });
    describe("Add Supply", function () {
        it("Should add supply if approved", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1"));
            await rxgVending.connect(addr1).addRxg(parseEther("1"));
            expect(await rxgToken.balanceOf(rxgVending.address)).to.equal(parseEther("1"));
        });
        it("Should not add supply if not approved", async function () {
            await (expect(rxgVending.connect(addr1).addRxg(parseEther("1"))).to.be.reverted);
        });
        it("Should revert if you don't have enough approval", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1"));
            await (expect(rxgVending.connect(addr1).addRxg(parseEther("2"))).to.be.reverted);
        });
        it("Should add the rxg to the supply no matter what account you use", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1"));
            await rxgVending.connect(addr1).addRxg(parseEther("1"));
            await rxgToken.connect(addr2).approve(rxgVending.address, parseEther("2"));
            await rxgVending.connect(addr2).addRxg(parseEther("2"));
            expect(await rxgToken.balanceOf(rxgVending.address)).to.equal(parseEther("3"));
        });
    });
    describe("Buy Rxg", function () {
        it("Should buy rxg if you have enough rxg", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1000"));
            await rxgVending.connect(addr1).addRxg(parseEther("1000"));
            expect(await rxgToken.balanceOf(rxgVending.address)).to.equal(parseEther("1000"));
            await rxgVending.connect(buyer).buyRxg({
                value: parseEther("1")
            });
            expect(await rxgToken.balanceOf(rxgVending.address)).to.equal(0);
        });
        it("Should not buy rxg if you don't have enough Avax", async function () {

            await (expect(rxgVending.connect(addr1).buyRxg({
                value: 0
            })).to.be.reverted);
        });
        it("Should not buy rxg if the Vending contract doesn't have enough rxg", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1"));
            await (expect(rxgVending.connect(addr1).buyRxg({
                value: parseEther("1")
            })).to.be.reverted);
        });
    });
    describe("Withdraw", function () {
        it("Should withdraw if owner", async function () {
            await rxgToken.connect(addr1).approve(rxgVending.address, parseEther("1000"));
            await rxgVending.connect(addr1).addRxg(parseEther("1000"));
            expect(await rxgToken.balanceOf(rxgVending.address)).to.equal(parseEther("1000"));
            await rxgVending.connect(buyer).buyRxg({
                value: parseEther("1")
            });
            // get ether balance of rxgVending contract
            tx = await rxgVending.connect(owner).withdraw();
            results = await tx.wait();
            for (const event of results.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
        });
        it("Should not withdraw if not owner", async function () {
            await (expect(rxgVending.connect(addr1).withdraw()).to.be.reverted);
        });
    });

});