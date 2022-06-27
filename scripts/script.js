// scripts/create-box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PaymentRecieved = await ethers.getContractFactory("PaymentRecieved");
  const paymentRecieved = await upgrades.deployProxy(PaymentRecieved);
  await paymentRecieved.deployed();
  console.log("Payment Contract deployed to:", paymentRecieved.address);
}

main();