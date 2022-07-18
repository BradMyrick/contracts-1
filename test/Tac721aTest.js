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

    describe("Mint", function () {
        it("Should mint a new token if public sale IS active and Price is paid", async function () {
            await tacvue721a.connect(owner).saleActiveSwitch();
            expect(await tacvue721a.saleActive()).to.equal(true);
            await tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
                expect(await tacvue721a.balanceOf(addr1.address)).to.equal(1);
        } 
        );
        it("Should revert if sale is NOT active", async function () {
            expect(await tacvue721a.saleActive()).to.equal(false);
            await(expect(tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")}))).to.be.reverted;
            }
        );
        it("Should revert if the minter is NOT WhiteListed and WL is active", async function () {
            await tacvue721a.connect(owner).wlActiveSwitch();
            expect(await tacvue721a.wlActive()).to.equal(true);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(false);
            await expect(tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")})).to.be.reverted;
            }
        );
        it("Should mint if the minter IS WhiteListed and WL is active.", async function () {
            await tacvue721a.connect(owner).bulkWhitelistAdd([addr1.address]);
            await tacvue721a.connect(owner).wlActiveSwitch();
            expect(await tacvue721a.connect(addr1).wlActive()).to.equal(true);
            await tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
            expect(await tacvue721a.balanceOf(addr1.address)).to.equal(1);
            }        
        );
        it("Should revert if the minter is NOT WhiteListed and WL IS active", async function () {
            await tacvue721a.connect(owner).wlActiveSwitch();
            expect(await tacvue721a.wlActive()).to.equal(true);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(false);
            await expect(tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")})).to.be.reverted;
            }
        );
    }
    );
    describe("Whitelist", function () {
        it("Should add a new address to the WhiteList", async function () {
            await tacvue721a.connect(owner).bulkWhitelistAdd([addr1.address]);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(true);
            }
        );
        it("Should leave the user whitelisted if the address is already in the WhiteList", async function () {
            await tacvue721a.connect(owner).bulkWhitelistAdd([addr1.address]);
            await tacvue721a.connect(owner).bulkWhitelistAdd([addr1.address]);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(true);
            }
        );
        it("Should return false if the address is not in the WhiteList", async function () {
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(false);
            }
        );
        it("Should remove an address from the WhiteList", async function () {
            await tacvue721a.connect(owner).bulkWhitelistAdd([addr1.address]);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(true);
            await tacvue721a.connect(owner).removeFromWhiteList(addr1.address);
            expect(await tacvue721a.WhiteList(addr1.address)).to.equal(false);
            }
        );
        it("Should revert if the address is not in the WhiteList", async function () {
            await expect(tacvue721a.connect(owner).removeFromWhiteList(addr1.address)).to.be.reverted;
            }
        );
    }
    );

    describe("Withdraw", function () {
        it("Should withdraw the correct amount of tokens", async function () {
            await tacvue721a.connect(owner).saleActiveSwitch();
            await tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
            // balance correctly updates to 1 eth below
            expect(await ethers.provider.getBalance(tacvue721a.address)).to.equal(ethers.utils.parseEther("1"));
            await tacvue721a.connect(owner).withdraw();
            // balance incorrectly updates to 2 eth below
            expect(await ethers.provider.getBalance(tacvue721a.address)).to.equal(ethers.utils.parseEther("0"));
            }
        );
        it("Should revert if the address is not owner", async function () {
            await tacvue721a.connect(owner).saleActiveSwitch();
            await tacvue721a.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
            await expect(tacvue721a.connect(addr1).withdraw()).to.be.reverted;
            }
        );
        it("Should revert if the address has no tokens", async function () {
            await expect(tacvue721a.connect(owner).withdraw()).to.be.reverted;
            }
        );
    }
    );

}
);