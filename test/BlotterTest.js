const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    parseEther
} = require("ethers/lib/utils");

describe("Blotter contract", function () {
    let Blotter;
    let blotter;
    let Erc20;
    let erc20;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, multiSig, ...addrs] = await ethers.getSigners();

        Erc20 = await ethers.getContractFactory("Recharge");
        erc20 = await Erc20.connect(owner).deploy(addr1.address, addr2.address, addr3.address);

        Blotter = await ethers.getContractFactory("Blotter");
        blotter = await Blotter.deploy(parseEther("1"), erc20.address);
        await blotter.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await blotter.owner()).to.equal(owner.address);
        });
    });

    describe("Promote Tweet", function () {
        it("Should promote a tweet", async function () {
            // authorize blotter to spend the tokens
            await erc20.connect(addr1).approve(blotter.address, parseEther("2"));
            await blotter.connect(addr1).promoteTweet("https://twitter.com/faketweet");
            await blotter.connect(addr1).promoteTweet("https://twitter.com/realtweet");
            links = await blotter.getTwitterLinks(addr1.address);
            expect(links[1]).to.equal("https://twitter.com/realtweet");
            allLinks = await blotter.getAllTweets();
            allUsers = await blotter.getUsers();
            tweet= allLinks[0][1];
            user = allUsers[0];
            expect(tweet).to.equal("https://twitter.com/realtweet");
            expect(user).to.equal(addr1.address);
        });
        it("Should return the correct cost", async function () {
            expect(await blotter.getCost()).to.equal(parseEther("1"));
        });
        it("Should kill the promotion if owner", async function () {
            await erc20.connect(addr1).approve(blotter.address, parseEther("2"));
            await blotter.connect(addr1).promoteTweet("https://twitter.com/deleteme");
            await blotter.connect(owner).killPromotion(addr1.address);
            links = await blotter.getTwitterLinks(addr1.address)
            expect(links[0]).to.equal(false);
        });
        it("Should NOT kill the promotion if not owner", async function () {
            await erc20.connect(addr1).approve(blotter.address, parseEther("2"));
            await blotter.connect(addr1).promoteTweet("https://twitter.com/deleteme");
            tx = blotter.connect(addr2).killPromotion(addr1.address);
            links = await blotter.getTwitterLinks(addr1.address)
            expect(links[0]).to.equal(true);
        }
        );
    });

});