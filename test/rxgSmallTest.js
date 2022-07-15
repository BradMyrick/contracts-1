const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe ("RxgVending contract", function () {
    let RxgToken;
    let rxgToken;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        RxgToken = await ethers.getContractFactory("Recharge");
        rxgToken = await RxgToken.connect(owner).deploy();
        await rxgToken.deployed();
    }
    );

    describe("Deployment", function () {
        it("Should mint correct tokens to the creator", async function () {
            expect(await rxgToken.balanceOf(owner.address)).to.equal(parseEther("10000000000"));
        }
        );
    }
    );

}
);