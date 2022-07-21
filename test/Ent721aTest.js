const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
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
        Ent721a = await ethers.getContractFactory("Entity721a");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        ent721a = await Ent721a.deploy();
        await ent721a.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await ent721a.owner()).to.equal(owner.address);
        });
    });

    describe("Mint", function () {
        it("Should mint a new token", async function () {
            await ent721a.connect(addr1).mint()
            expect(await ent721a.balanceOf(addr1.address)).to.equal(1);
        });
        it("Should revert if Avax is sent", async function () {
            await expect(ent721a.connect(addr1).mint({
                value: ethers.utils.parseEther("1")
            })).to.be.reverted;
        });
        it("Should revert if the mint is not live", async function () {
            await ent721a.connect(owner).disableMint();
            await expect(ent721a.connect(addr1).mint()).to.be.reverted;
        });
    });
    describe("Token URI's", function () {
        it("Should return the placeholder if the token uri is not set", async function () {
            await ent721a.connect(addr1).mint()
            expect(await ent721a.tokenURI(0)).to.equal("https://tacvue.io/placeholder.png");
        });
        it("Should return the token uri if the token uri is set", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).setTokenURI("https://replaced.png", 0)
            expect(await ent721a.tokenURI(0)).to.equal("https://replaced.png");
        });
        it("Should revert if the token uri has already been set", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).setTokenURI("https://replaced.png", 0)
            await expect(ent721a.connect(addr1).setTokenURI("https://2ndreplacement.png", 0)).to.be.revertedWith("Token has already been revealed");
        });
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.tokenURI(1)).to.be.reverted;
        });
    });
    describe("Burn", function () {
        it("Should burn a token", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).burn(0)
            expect(await ent721a.balanceOf(addr1.address)).to.equal(0);
        });
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.connect(addr1).burn(1)).to.be.reverted;
        });
        it("Should revert if the token is not owned", async function () {
            await ent721a.mint()
            await expect(ent721a.connect(addr1).burn(0)).to.be.reverted;
        });
    });
    describe("Safe Transfer From", function () {
        it("Should transfer a token", async function () {
            await ent721a.connect(addr1).mint()
            await ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
            expect(await ent721a.balanceOf(addr1.address)).to.equal(0);
            expect(await ent721a.balanceOf(addr2.address)).to.equal(1);
        });
        it("Should revert if the token does not exist", async function () {
            await expect(ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 1)).to.be.reverted;
        });
        it("Should revert if the token is not owned", async function () {
            await ent721a.connect(owner).mint()
            await expect(ent721a.connect(addr1).transferFrom(addr1.address, addr2.address, 0)).to.be.reverted;
        });
    });
    describe("Disable Minting", function () {
        it("Should disable minting", async function () {
            await ent721a.connect(owner).disableMint()
            await expect(!ent721a.mintLive())
        });
        it("Should revert if the token is not owned", async function () {
            await expect(ent721a.connect(addr1).disableMint()).to.be.reverted;
        });
    });
});