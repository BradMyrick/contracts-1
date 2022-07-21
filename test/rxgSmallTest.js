const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    parseEther
} = require("ethers/lib/utils");

describe("RxgVending contract", function () {
    let RxgToken;
    let rxgToken;
    let rxgSupply = parseEther("10000000000");
    let balance1 = parseEther("1000000000");
    let balance2 = parseEther("1000000000");
    let balance3 = parseEther("8000000000");

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy(addr1.address, addr2.address, addr3.address);
        await rxgToken.deployed();
    });

    describe("Deployment", function () {
        it("Should mint correct tokens to the creator", async function () {
            expect(await rxgToken.totalSupply()).to.equal(rxgSupply);
        });
        it("Should mint correct token amounts to the correct wallets", async function () {
            expect(await rxgToken.balanceOf(addr1.address)).to.equal(balance1);
            expect(await rxgToken.balanceOf(addr2.address)).to.equal(balance2);
            expect(await rxgToken.balanceOf(addr3.address)).to.equal(balance3);
        });
    });


});