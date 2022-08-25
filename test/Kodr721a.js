const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    parseEther
} = require("ethers/lib/utils");
const {
    BigNumber
} = require("ethers");

describe("Kodr721a contract", function () {
    let Kodr721a;
    let kodr721a;
    let feeCollector;

    let name = "KushLionMerch";
    let ticker = "KLM";
    let maxMints = 1;
    let royalty = 500; // 5% of sale price
    let maxSupply = 100;
    let mintPrice = parseEther("0.18");
    let wlPrice = parseEther("0.15");
    let placeholderUri = "https://tacvue.com";

    beforeEach(async function () {
        Kodr721a = await ethers.getContractFactory("Kodr721a");
        [owner, feeCollector, addr1, addr2, ...addrs] = await ethers.getSigners();
        kodr721a = await Kodr721a.connect(owner).deploy(name, ticker, royalty, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri);
        await kodr721a.deployed();
    });
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await kodr721a.owner()).to.equal(owner.address);
        });
    });

    describe("Mint", function () {
        it("Should mint a new token if public sale IS active and Price is paid", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await kodr721a.balanceOf(addr1.address)).to.equal(1);
        });
        it("Should revert if sale is NOT active", async function () {
            await (expect(kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            }))).to.be.reverted;
        });
        it("Should revert if the minter is NOT WhiteListed and WL is active", async function () {
            await kodr721a.connect(owner).startWlSale();
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(false);
            await expect(kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            })).to.be.reverted;
        });
        it("Should mint if the minter IS WhiteListed and WL is active.", async function () {
            await kodr721a.connect(owner).addToWhitelist([addr1.address]);
            await kodr721a.connect(owner).startWlSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await kodr721a.balanceOf(addr1.address)).to.equal(1);
            expect(await kodr721a.tokenURI(0)).to.equal(placeholderUri + "0");

        });
        it("Should revert if the minter is NOT WhiteListed and WL IS active", async function () {
            await kodr721a.connect(owner).startWlSale();
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(false);
            await expect(kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            })).to.be.reverted;
        });
    });
    describe("Whitelist", function () {
        it("Should add a new address to the WhiteList", async function () {
            await kodr721a.connect(owner).addToWhitelist([addr1.address]);
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(true);
        });
        it("Should leave the user whitelisted if the address is already in the WhiteList", async function () {
            await kodr721a.connect(owner).addToWhitelist([addr1.address]);
            await kodr721a.connect(owner).addToWhitelist([addr1.address]);
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(true);
        });
        it("Should return false if the address is not in the WhiteList", async function () {
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(false);
        });
        it("Should remove an address from the WhiteList", async function () {
            await kodr721a.connect(owner).addToWhitelist([addr1.address]);
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(true);
            await kodr721a.connect(owner).removeFromWhiteList(addr1.address);
            expect(await kodr721a.WhiteList(addr1.address)).to.equal(false);
        });
        it("Should revert if the address is not in the WhiteList", async function () {
            await expect(kodr721a.connect(owner).removeFromWhiteList(addr1.address)).to.be.reverted;
        });
    });

    describe("Withdraw", function () {
        it("Should withdraw the correct amount of tokens", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await ethers.provider.getBalance(kodr721a.address)).to.equal(ethers.utils.parseEther("1"));
            const tx = await kodr721a.connect(owner).withdraw();
            const receipt = await tx.wait()
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
        });
        it("Should revert if the address is not owner", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            await expect(kodr721a.connect(addr1).withdraw()).to.be.reverted;
        });
        it("Should revert if the address has no tokens", async function () {
            await expect(kodr721a.connect(owner).withdraw()).to.be.reverted;
        });
    });
    describe("Royalties", function () {
        it("Should return the correct royalties", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            let royalty = [
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                {
                    value: '20000000000000000'
                }
            ]
            let check = await kodr721a.royaltyInfo(1, ethers.utils.parseEther("1"))

            expect(check[0]).to.equal(royalty[0]);
            expect(check[1]).to.equal(royalty[1].value);
        });
        it("Should fail if the royalties are not correct", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            let royalty = [
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                {
                    value: '40000000000000000'
                }
            ]
            let check = await kodr721a.royaltyInfo(1, ethers.utils.parseEther("1"))
            expect(check[0]).to.equal(royalty[0]);
            expect(check[1]).to.not.equal(royalty[1].value);
        });

    });
    describe("Supports Interface", function () {
        it("Should return true if the interface is supported", async function () {
            expect(await kodr721a.supportsInterface("0x01ffc9a7")).to.equal(true);
        });
        it("Should return false if the interface is not supported", async function () {
            expect(await kodr721a.supportsInterface("0x80ac58cd")).to.equal(false);
        });
    });
    describe("Burn Tokens", function () {
        it("Should burn the correct amount of tokens", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await kodr721a.balanceOf(addr1.address)).to.equal(1);
            const tx = await kodr721a.connect(addr1).burn(0);
            const receipt = await tx.wait()
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await kodr721a.balanceOf(addr1.address)).to.equal(0);
        });
        it("Should revert if the address is not token owner", async function () {
            await kodr721a.connect(owner).startPublicSale();
            await kodr721a.connect(addr1).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            await expect(kodr721a.connect(addr1).burn(1)).to.be.reverted;
        });
        it("Should revert if the address has no tokens", async function () {
            await expect(kodr721a.connect(owner).burn(1)).to.be.reverted;
        });
    });
    describe("Change Base URI", function () {
        it("Should change the base URI", async function () {
            await kodr721a.connect(owner).setBaseURI("https://www.google.com");
            expect(await kodr721a.baseURI()).to.equal("https://www.google.com");
        });
        it("Should revert if the address is not owner", async function () {
            await expect(kodr721a.connect(addr1).setBaseURI("https://www.google.com")).to.be.reverted;
        });
    });

});