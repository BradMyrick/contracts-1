const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe("Tacvue721a contract", function () {
    let Tacvue721a;
    let tacvue721a;
    let feeCollector;

    let name = "Tacvue721a";
    let ticker = "TACV";
    let maxMints = 5;
    let maxSupply = 100;
    let mintPrice = parseEther("1");
    let wlPrice = parseEther("0.5");
    let placeholderUri = "https://tacvue.com";

    beforeEach(async function () {
        Tacvue721a = await ethers.getContractFactory("Tacvue721a");
        [owner, feeCollector, addr1, addr2, ...addrs] = await ethers.getSigners();
        tacvue721a = await Tacvue721a.connect(owner).deploy( name, ticker, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
        await tacvue721a.deployed();
    }
    );
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await tacvue721a.owner()).to.equal(owner.address);
        });
    } 
    );
});