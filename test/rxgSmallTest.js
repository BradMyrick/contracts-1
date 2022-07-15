const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe ("RxgVending contract", function () {
    let RxgToken;
    let rxgToken;
    let rxgSupply = parseEther("10000000000");

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy(addr1.address, addr2.address, addr3.address);
        await rxgToken.deployed();
    }
    );

    describe("Deployment", function () {
        it("Should mint correct tokens to the creator", async function () {
            expect(await rxgToken.totalSupply()).to.equal(rxgSupply);
        }
        );
    }
    );

}
);