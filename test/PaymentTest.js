const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
describe("PaymentReceived contract", function () {
  let PaymentReceived;
  let paymentReceived;
  let StringLibrary;
  let stringLibrary;
  let Erc20;
  let erc20;
  let NftContract;
  let nftContract;


  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, addr3, multiSig, ...addrs] = await ethers.getSigners();
    StringLibrary = await ethers.getContractFactory("StringCheck");
    stringLibrary = await StringLibrary.deploy();
    NftContract = await ethers.getContractFactory("Entity721a", {
        libraries: {
            StringCheck: stringLibrary.address,
        },
    });
    nftContract = await NftContract.connect(addr1).deploy();
    Erc20 = await ethers.getContractFactory("Recharge");
    erc20 = await Erc20.connect(owner).deploy(addr1.address, addr2.address, addr3.address);

    PaymentReceived = await ethers.getContractFactory("PaymentReceived");
    paymentReceived = await PaymentReceived.deploy(erc20.address, parseEther("1"), multiSig.address);
    await paymentReceived.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await paymentReceived.owner()).to.equal(owner.address);
    });
  } 
  );

  describe("Is Authorized", function () {
    it("Should return false for 0 address", async function () {
      expect(await paymentReceived.Authorized(ethers.constants.AddressZero, ethers.constants.AddressZero)).to.equal(false);    
    });
    it("Should return true if address is authorized", async function () {
      await erc20.connect(addr1).approve(paymentReceived.address, parseEther("1"));
      await paymentReceived.connect(addr1).authorize(nftContract.address);
      expect(await paymentReceived.Authorized(addr1.address, nftContract.address)).to.equal(true);
    });
    it("Should return false if address is not authorized", async function () {
      expect(await paymentReceived.Authorized(addr1.address, addr2.address)).to.equal(false);
    });
  });

  describe("Change Price", function () {
    it("Should change payment if owner", async function () {
      await paymentReceived.changePrice(parseEther("2"));
      expect(await paymentReceived.assemblerPrice()).to.equal(parseEther("2"));
    }
    );
    it("Should revert if not owner", async function () {
      await expect(paymentReceived.connect(addr1).changePrice(25, "test price")).to.be.reverted;
    }
    );
  });

  describe("Authorize", function () {
    it("Should authorize if paid", async function () {
      await erc20.connect(addr1).approve(paymentReceived.address, parseEther("1"));
      await paymentReceived.connect(addr1).authorize(nftContract.address);
      expect(await paymentReceived.Authorized(addr1.address, nftContract.address)).to.equal(true);
    }
    );
    it("Shouldn't authorize if price not approved", async function () {
      await expect (paymentReceived.connect(addr2).authorize(nftContract.address)).to.be.reverted;
    }
    );
    it("Shouldn't authorize if the owner is already authorized", async function () {
      await erc20.connect(addr1).approve(paymentReceived.address, parseEther("10"));
      await nftContract.connect(addr1).mint();
      await paymentReceived.connect(addr1).authorize(nftContract.address);
      await expect (paymentReceived.connect(addr1).authorize(nftContract.address)).to.be.revertedWith("Already authorized");
    }
    );
    it("Should revert if sender is not the project owner", async function () {
      await erc20.connect(addr2).approve(paymentReceived.address, parseEther("1"));
      await expect (paymentReceived.connect(addr2).authorize(nftContract.address)).to.be.revertedWith("Only the collection creator can perform this action");
    }
    );
  }
  );

  describe("Change Payment Token", function () {
    it("Should change payment if owner", async function () {
      await paymentReceived.connect(owner).changePaymentToken(addr2.address);
      expect(await paymentReceived.paymentToken()).to.equal(addr2.address);
    }
    );
    it("Should revert if not owner", async function () {
      await expect(paymentReceived.connect(addr1).changePaymentToken(addr2.address)).to.be.reverted;
    }
    );
  }
  );
  describe("Payable function", function () {
    it("Should revert if base token is sent", async function () {
      await expect(owner.sendTransaction({ to: paymentReceived.address, value: parseEther("1") })).to.be.revertedWith("function selector was not recognized and there's no fallback nor receive function");
    }
    );
  }
  );
});