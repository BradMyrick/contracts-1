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
  }
);

  
});
