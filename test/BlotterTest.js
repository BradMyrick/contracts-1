const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe ("Blotter contract", function () {
    let Blotter;
    let blotter;
    let Erc20;
    let erc20;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, multiSig, ...addrs] = await ethers.getSigners();

        Erc20 = await ethers.getContractFactory("Recharge");
        erc20 = await Erc20.connect(owner).deploy(addr1.address, addr2.address, addr3.address);

        Blotter = await ethers.getContractFactory("Blotter");
        blotter = await Blotter.deploy(parseEther("1"), erc20.address);
        await blotter.deployed();
    }
    );

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await blotter.owner()).to.equal(owner.address);
        }
        );
    } 
    );

}
);