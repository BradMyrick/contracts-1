const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe ("RxgVending contract", function () {
    let RxgVending;
    let rxgVending;
    let peggedPrice;
    let rxgSupply;
    let RxgToken;
    let rxgToken;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy();
        RxgVending = await ethers.getContractFactory("RxgVending");
        rxgSupply = await RxgVending.connect(owner).deploy( parseEther("0.000001"), rxgToken.address);
        await rxgSupply.deployed();
    }
    );
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await rxgSupply.owner()).to.equal(owner.address);
        });
    } 
    );
}
);
