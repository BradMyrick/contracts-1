const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentRecieved", function () {
  it("Should return false for 0 address", async function () {
    const PaymentRecieved = await ethers.getContractFactory("PaymentRecieved");
    const paymentRecieved = await PaymentRecieved.deploy();
    await paymentRecieved.deployed();

    expect(await paymentRecieved.Authorized(ethers.constants.AddressZero, ethers.constants.AddressZero)).to.equal(false);
    
  });
});
