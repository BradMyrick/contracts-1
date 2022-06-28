const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("PaymentRecieved contract", function () {
  let PaymentRecieved;
  let paymentRecieved;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    PaymentRecieved = await ethers.getContractFactory("PaymentRecieved");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    paymentRecieved = await PaymentRecieved.deploy();
    await paymentRecieved.initialize();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await paymentRecieved.owner()).to.equal(owner.address);
    });
  } 
  );

  describe("Authorized", function () {
    it("Should return false for 0 address", async function () {
      expect(await paymentRecieved.Authorized(ethers.constants.AddressZero, ethers.constants.AddressZero)).to.equal(false);    
    });
    it("Should return true if address is authorized", async function () {
      await paymentRecieved.authorize(2, addr2.address); // payment amount for 2 must be 0
      expect(await paymentRecieved.Authorized(owner.address, addr2.address)).to.equal(true);
    });
    it("Should return false if address is not authorized", async function () {
      expect(await paymentRecieved.Authorized(addr1.address, addr2.address)).to.equal(false);
    });
  });

  describe("Add Price", function () {
    it("Should add payment if owner", async function () {
      await paymentRecieved.addPrice(25, "test price");
      let index = await paymentRecieved.increment();
      index -= 1;
      expect(await paymentRecieved.Prices(index)).to.equal(25);
    }
    );
    it("Should revert if not owner", async function () {
      await expect(paymentRecieved.connect(addr1).addPrice(25, "test price")).to.be.reverted;
    }
    );
  });

  describe("Withdraw", function () {
    it("Balance should equal to the value sent", async function () {
      // send ether to contract
      await paymentRecieved.connect(owner).authorize(1, addr2.address, {value: ethers.utils.parseEther("1")});

      expect(await ethers.provider.getBalance(paymentRecieved.address)).to.equal(ethers.utils.parseEther("1"));
    }
    );
    it("Should withdraw if owner", async function () {
      const address = await paymentRecieved.address;
      await paymentRecieved.connect(owner).authorize(1, addr2.address, {value: ethers.utils.parseEther("1")});

      const oldAmount = await ethers.provider.getBalance(owner.address);
      await paymentRecieved.connect(owner).withdraw();
      const newAmount = await ethers.provider.getBalance(owner.address);
      expect(newAmount).to.above(oldAmount);
    }
    );
    it("Shouldn't withdraw if not owner", async function () {
      const address = await paymentRecieved.address;
      await paymentRecieved.connect(addr1).authorize(1, addr2.address, {value: ethers.utils.parseEther("1")});

      // should revert if not owner
      await expect(paymentRecieved.connect(addr1).withdraw()).to.be.revertedWith("Only the owner can perform this action");
    });
  });

  describe("UnLock", function () {
    it("Should unlock if owner", async function () {
      await paymentRecieved.connect(owner).unlock();
      expect(await paymentRecieved.lock()).to.equal(false);
    }
    );
    it("Shouldn't unlock if not owner", async function () {
      await expect(paymentRecieved.connect(addr1).unlock()).to.be.revertedWith("Only the owner can perform this action");
    });
  });

  describe("authorize", function () {
    it("Should authorize if owner", async function () {
      await paymentRecieved.connect(owner).addPrice(ethers.utils.parseEther("1"), "test price");
      await paymentRecieved.connect(addr1).authorize(1, addr2.address, {value: ethers.utils.parseEther("1")});
      expect(await paymentRecieved.Authorized(addr1.address, addr2.address)).to.equal(true);
    }
    );
    it("Shouldn't authorize if price not met", async function () {
      await paymentRecieved.connect(owner).addPrice(ethers.utils.parseEther("1"), "test price");
      await expect (paymentRecieved.connect(addr1).authorize(1, addr2.address)).to.be.revertedWith("Not enough Avax sent");
    }
    );
    it("Shouldn't authorize if the owner is already authorized", async function () {
      await paymentRecieved.connect(owner).addPrice(ethers.utils.parseEther("1"), "test price");
      await paymentRecieved.connect(owner).authorize(1, addr2.address, {value: ethers.utils.parseEther("1")});
      await expect (paymentRecieved.connect(owner).authorize(1, addr2.address)).to.be.revertedWith("Already authorized");
    }
    );
  }
  );
});
