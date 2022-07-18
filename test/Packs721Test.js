const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("web3");
describe("Packs721 contract", function () {
    let Packs721;
    let packs721;
    let _name = "test"
    let _ticker = "tst"
    let _maxMints = 25
    let _mintPrice = ethers.utils.parseEther("1")
    let _wlPrice = ethers.utils.parseEther("0.5")
    let _baseURI = "https://baseurl.url/"
    let _packSize = 4
    let _numOfPacks = 100
    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        [owner, addr1, addr2, addr3, _feeCollector, ...addrs] = await ethers.getSigners();
        Packs721 = await ethers.getContractFactory("Packs721");
        packs721 = await Packs721.connect(owner).deploy(_name, _ticker, _maxMints, _mintPrice, _wlPrice, _baseURI, _feeCollector.address, _packSize, _numOfPacks);
        await packs721.deployed();
    } 
    ); // end of beforeEach
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await packs721.owner()).to.equal(owner.address);
        }
        ); 
    } 
    ); 
    describe("Mint", function () {
        it("Should mint a new token pack", async function () {
            await packs721.connect(owner).saleActiveSwitch();
            await packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("1") });
            expect(await packs721.balanceOf(addr1.address)).to.equal(4);
        }
        );
        it("Should revert if Avax is not sent", async function () {
            await expect(packs721.connect(addr1).mint({value: ethers.utils.parseEther("0")})).to.be.reverted;
        }
        );
        it("Should revert if the mint is not live", async function () {
            await expect(packs721.connect(addr1).mint()).to.be.reverted;
        } 
        ); 
        it("Should revert if the pack is already minted", async function () {
            await packs721.connect(owner).saleActiveSwitch();
            await packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("1") });
            await expect(packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("Pack already minted");
        }
        );
        it("Should revert if the minter is not WhiteListed and the WhiteList is active", async function () {
            await packs721.connect(owner).wlActiveSwitch();
            await expect(packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("Not whitelisted");
        }
        );
        it("Should mint if the minter is WhiteListed and the WhiteList is active", async function () {
            await packs721.connect(owner).wlActiveSwitch();
            await packs721.connect(owner).bulkWhitelistAdd([addr1.address, addr2.address]);
            await packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("1") });
            await packs721.connect(addr2).mint(6, { value: ethers.utils.parseEther("1") });
            expect(await packs721.balanceOf(addr1.address)).to.equal(4);
            expect(await packs721.balanceOf(addr2.address)).to.equal(4);
        }
        );
        it("Should revert if the minter is WhiteListed and the WhiteList is not active", async function () {
            await packs721.connect(owner).wlActiveSwitch();
            await packs721.connect(owner).bulkWhitelistAdd([addr2.address]);
            await expect(packs721.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.5") })).to.be.revertedWith("Not whitelisted");
            await expect(packs721.connect(addr2).mint(2, { value: ethers.utils.parseEther("0.5") })).to.not.be.reverted;
        }
        );
    }
    );
    describe("White Listing", function () {
        it("Should add a new WhiteListers", async function () {
            await packs721.connect(owner).bulkWhitelistAdd([addr1.address, addr2.address]);
            expect(await packs721.WhiteList(addr1.address)).to.equal(true);
            expect(await packs721.WhiteList(addr2.address)).to.equal(true);
            expect(await packs721.WhiteList(addr3.address)).to.equal(false);
        }
        );
        it("Should remove a WhiteLister", async function () {
            await packs721.connect(owner).bulkWhitelistAdd([addr1.address, addr2.address]);
            await packs721.connect(owner).removeFromWhiteList(addr1.address);
            expect(await packs721.WhiteList(addr1.address)).to.equal(false);
            expect(await packs721.WhiteList(addr2.address)).to.equal(true);
            expect(await packs721.WhiteList(addr3.address)).to.equal(false);
        }
        );
        it("Should revert if the address is not in the WhiteList", async function () {
            await expect(packs721.connect(owner).removeFromWhiteList(addr1.address)).to.be.reverted;
            }
        );
        it("Should leave the user whitelisted if the address is already in the WhiteList", async function () {
            await packs721.connect(owner).bulkWhitelistAdd([addr1.address]);
            await packs721.connect(owner).bulkWhitelistAdd([addr1.address]);
            expect(await packs721.WhiteList(addr1.address)).to.equal(true);
            }
        );
    }
    );
    describe("Withdraw", function () {
        it("Should withdraw the correct amount of tokens", async function () {
            await packs721.connect(owner).saleActiveSwitch();
            await packs721.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
            expect(await ethers.provider.getBalance(packs721.address)).to.equal(ethers.utils.parseEther("1"));
            const tx = await packs721.connect(owner).withdraw();
            const receipt = await tx.wait()
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
              }
        }
        );
        it("Should revert if the address is not owner", async function () {
            await packs721.connect(owner).saleActiveSwitch();
            await packs721.connect(addr1).mint(1, {value: ethers.utils.parseEther("1")});
            await expect(packs721.connect(addr1).withdraw()).to.be.reverted;
            }
        );
        it("Should revert if the address has no tokens", async function () {
            await expect(packs721.connect(owner).withdraw()).to.be.reverted;
            }
        );
    }
    );
}
);