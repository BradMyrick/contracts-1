// scripts/create-box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PaymentReceived = await ethers.getContractFactory("PaymentReceived");
  const paymentReceived = await upgrades.deployProxy(PaymentReceived);
  await paymentReceived.deployed();
  console.log("Payment Contract deployed to:", paymentReceived.address);
}

main();