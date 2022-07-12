const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Entity721a contract", function () {
    let Ent721a;
    let ent721a;
    let StringLibrary;
    let stringLibrary;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        StringLibrary = await ethers.getContractFactory("StringCheck");
        stringLibrary = await StringLibrary.deploy();
        Ent721a = await ethers.getContractFactory("Entity721a", {
            libraries: {
                StringCheck: stringLibrary.address,
            },
        });
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        ent721a = await Ent721a.deploy();
        await ent721a.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
        expect(await ent721a.owner()).to.equal(owner.address);
        });
    } 
    );

    describe("Mint", function () {
        it("Should mint a new token", async function () {
        await ent721a.connect(addr1).mint()
            expect(await ent721a.balanceOf(addr1.address)).to.equal(1);
        } 
        );
        it("Should if Avax is sent", async function () {
            await expect(ent721a.connect(addr1).mint({value: ethers.utils.parseEther("1")})).to.be.reverted;
            }
        );
        it("Should return the placeholder if the token uri is not set", async function () {
            await ent721a.connect(addr1).mint()
                expect(await ent721a.tokenURI(0)).to.equal("https://tacvue.io/placeholder.png");
            }
        );
        it("Should return the token uri if the token uri is set", async function () {
            await ent721a.connect(addr1).mint()
                await ent721a.connect(addr1).setTokenURI("https://replaced.png", 0)
                expect(await ent721a.tokenURI(0)).to.equal("https://replaced.png");
            }
        );
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.tokenURI(1)).to.be.reverted;
            }
        );
    }
        );
    describe("Burn", function () {
        it("Should burn a token", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).burn(0)
            expect(await ent721a.balanceOf(addr1.address)).to.equal(0);
        } 
        );
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.connect(addr1).burn(1)).to.be.reverted;
        }
        );
        it("Should revert if the token is not owned", async function () {
            await ent721a.mint()
            await expect(ent721a.connect(addr1).burn(0)).to.be.reverted;
        }
        );
    }
    );
    describe("safeTransferFrom", function () {
        it("Should transfer a token", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
            expect(await ent721a.balanceOf(addr1.address)).to.equal(0);
            expect(await ent721a.balanceOf(addr2.address)).to.equal(1);
        } 
        );
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 1)).to.be.reverted;
        }
        );
        it("Should revert if the token is not owned", async function () {
            await ent721a.connect(owner).mint()
            await expect(ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 0)).to.be.reverted;
        }
        );
    }
    );
});
