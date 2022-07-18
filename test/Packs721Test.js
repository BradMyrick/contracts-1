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
        [owner, addr1, addr2, _feeCollector, ...addrs] = await ethers.getSigners();
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
            it("Should revert if Avax is sent", async function () {
                await expect(packs721.connect(addr1).mint({value: ethers.utils.parseEther("1")})).to.be.reverted;
                }
            );
            it("Should revert if the mint is not live", async function () {
                await expect(packs721.connect(addr1).mint()).to.be.reverted;
                } 
            ); 
        }
    );
}
);