const {
    expect,
    util
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    utils
} = require("web3");
describe("Marketplace contracts", function () {
    let startDBprice = ethers.utils.parseEther("2");
    let _directBuyPrice = ethers.utils.parseEther("1")
    let _startPrice = 10000000000000;
    let _tokenId = 0;
    let startTime = 1800000000
    let name = "Tacvue721a";
    let ticker = "TACV";
    let maxMints = 5;
    let royalty = 200; // should be 2% of sale price
    let maxSupply = 100;
    let mintPrice = ethers.utils.parseEther("1");
    let wlPrice = ethers.utils.parseEther("0.5");
    let placeholderUri = "https://tacvue.com";




    beforeEach(async function () {
        startTime = startTime + 10000;

        [owner, creator, feeCollector, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        await network.provider.send("evm_setNextBlockTimestamp", [startTime])
        ManagerContract = await ethers.getContractFactory("AuctionManager");
        managerContract = await ManagerContract.connect(owner).deploy();
        await managerContract.deployed();

    });
    describe("Deployment", function () {
        it("Should show Owner as the Admin", async function () {
            role = await managerContract.DEFAULT_ADMIN_ROLE();
            expect(await managerContract.hasRole(role, owner.address)).to.equal(true);
        });
    });

    describe("Auction", function () {
        it("create auction and buy nft", async function () {
            let _endTime = 800;
            // mint an nft
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, royalty, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            // create an auction
            tx = await managerContract.connect(creator).createAuction(_endTime, true, startDBprice, _startPrice, nftContract.address, _tokenId);
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(creator.address)).to.equal(0);
            // auctionAddress should own the nft now
            let auctionAddress = await managerContract.getOneNFT(nftContract.address, _tokenId);
            console.log(auctionAddress);
            expect(await nftContract.ownerOf(_tokenId)).to.equal(auctionAddress);
            AuctionContract = await ethers.getContractFactory("Auction");
            auctionContract = await AuctionContract.attach(auctionAddress);
            // lower reserve price
            await auctionContract.connect(creator).lowerReserve(1000000000000000);
            // get live auctions
            aucArray = await managerContract.getAuctions();
            expect(aucArray[0]).to.equal(auctionAddress);
            // get live auction for NFT address
            nftArray = await managerContract.collectionGetAllForSale(nftContract.address);
            expect(nftArray[0]).to.equal(auctionAddress);
            // get auction info
            info = await managerContract.getAuctionInfo(auctionContract.address);
            expect(info._nftAddress).to.equal(nftContract.address);
            // buy the nft
            tx2 = await auctionContract.connect(addr1).placeBid({
                value: 1000000000000000
            });
            const receipt2 = await tx2.wait();
            for (const event of receipt2.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(addr1.address)).to.equal(1);

        });
        it("create auction and bid on an nft then end the auction", async function () {
            let _endTime = 800;
            // mint an nft
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, royalty, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            // create an auction
            tx = await managerContract.connect(creator).createAuction(_endTime, false, startDBprice, _startPrice, nftContract.address, _tokenId);
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(creator.address)).to.equal(0);
            // auctionAddress should own the nft now
            let auctionAddress = await managerContract.getOneNFT(nftContract.address, _tokenId);
            console.log(auctionAddress);
            expect(await nftContract.ownerOf(_tokenId)).to.equal(auctionAddress);
            AuctionContract = await ethers.getContractFactory("Auction");
            auctionContract = await AuctionContract.attach(auctionAddress);
            // lower reserve price
            await auctionContract.connect(creator).lowerReserve(1000000000000000);
            // get live auctions
            aucArray = await managerContract.getAuctions();
            expect(aucArray[0]).to.equal(auctionAddress);
            // get live auction for NFT address
            nftArray = await managerContract.collectionGetAllForSale(nftContract.address);
            expect(nftArray[0]).to.equal(auctionAddress);
            // get auction info
            info = await managerContract.getAuctionInfo(auctionContract.address);
            expect(info._nftAddress).to.equal(nftContract.address);
            // buy the nft
            tx2 = await auctionContract.connect(addr1).placeBid({
                value: 1000000000000000
            });
            const receipt2 = await tx2.wait();
            for (const event of receipt2.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await auctionContract.maxBidder()).to.equal(addr1.address);
            await network.provider.send("evm_setNextBlockTimestamp", [startTime + 1000]);
            tx3 = await auctionContract.connect(addr1).endAuction();
            const receipt3 = await tx3.wait();
            for (const event of receipt3.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(addr1.address)).to.equal(1);


        });
        it("create auction and buy nft without a royalty", async function () {
            let _endTime = 800;
            // mint an nft
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, 0, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            // create an auction
            tx = await managerContract.connect(creator).createAuction(_endTime, true, startDBprice, _startPrice, nftContract.address, _tokenId);
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(creator.address)).to.equal(0);
            // auctionAddress should own the nft now
            let auctionAddress = await managerContract.getOneNFT(nftContract.address, _tokenId);
            console.log(auctionAddress);
            expect(await nftContract.ownerOf(_tokenId)).to.equal(auctionAddress);
            AuctionContract = await ethers.getContractFactory("Auction");
            auctionContract = await AuctionContract.attach(auctionAddress);
            // lower reserve price
            await auctionContract.connect(creator).lowerReserve(1000000000000000);
            // get live auctions
            aucArray = await managerContract.getAuctions();
            expect(aucArray[0]).to.equal(auctionAddress);
            // get live auction for NFT address
            nftArray = await managerContract.collectionGetAllForSale(nftContract.address);
            expect(nftArray[0]).to.equal(auctionAddress);
            // get auction info
            info = await managerContract.getAuctionInfo(auctionContract.address);
            expect(info._nftAddress).to.equal(nftContract.address);
            // buy the nft
            tx2 = await auctionContract.connect(addr1).placeBid({
                value: 1000000000000000
            });
            const receipt2 = await tx2.wait();
            for (const event of receipt2.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(addr1.address)).to.equal(1);
        });
        it("create auction and bid on an nft then end the auction without royalty", async function () {
            let _endTime = 800;
            // mint an nft
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, 0, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            // create an auction
            tx = await managerContract.connect(creator).createAuction(_endTime, false, startDBprice, _startPrice, nftContract.address, _tokenId);
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(creator.address)).to.equal(0);
            // auctionAddress should own the nft now
            let auctionAddress = await managerContract.getOneNFT(nftContract.address, _tokenId);
            console.log(auctionAddress);
            expect(await nftContract.ownerOf(_tokenId)).to.equal(auctionAddress);
            AuctionContract = await ethers.getContractFactory("Auction");
            auctionContract = await AuctionContract.attach(auctionAddress);
            // lower reserve price
            await auctionContract.connect(creator).lowerReserve(1000000000000000);
            // get live auctions
            aucArray = await managerContract.getAuctions();
            expect(aucArray[0]).to.equal(auctionAddress);
            // get live auction for NFT address
            nftArray = await managerContract.collectionGetAllForSale(nftContract.address);
            expect(nftArray[0]).to.equal(auctionAddress);
            // get auction info
            info = await managerContract.getAuctionInfo(auctionContract.address);
            expect(info._nftAddress).to.equal(nftContract.address);
            // buy the nft
            tx2 = await auctionContract.connect(addr1).placeBid({
                value: 1000000000000000
            });
            const receipt2 = await tx2.wait();
            for (const event of receipt2.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await auctionContract.maxBidder()).to.equal(addr1.address);
            await network.provider.send("evm_setNextBlockTimestamp", [startTime + 1000]);
            tx3 = await auctionContract.connect(addr1).endAuction();
            const receipt3 = await tx3.wait();
            for (const event of receipt3.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(addr1.address)).to.equal(1);
        }
        );
        it("create auction and bid on an nft then end without the reserve being met", async function () {
            let _endTime = 800;
            // mint an nft
            NftContract = await ethers.getContractFactory("Tacvue721a");
            nftContract = await NftContract.connect(owner).deploy(name, ticker, 0, maxMints, maxSupply, mintPrice, wlPrice, placeholderUri, feeCollector.address);
            await nftContract.deployed();
            await nftContract.connect(owner).saleActiveSwitch();
            await nftContract.connect(creator).mint(1, {
                value: ethers.utils.parseEther("1")
            });
            expect(await nftContract.balanceOf(creator.address)).to.equal(1);
            await nftContract.connect(creator).approve(managerContract.address, 0);
            // create an auction
            tx = await managerContract.connect(creator).createAuction(_endTime, false, startDBprice, _startPrice, nftContract.address, _tokenId);
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(creator.address)).to.equal(0);
            // auctionAddress should own the nft now
            let auctionAddress = await managerContract.getOneNFT(nftContract.address, _tokenId);
            console.log(auctionAddress);
            expect(await nftContract.ownerOf(_tokenId)).to.equal(auctionAddress);
            AuctionContract = await ethers.getContractFactory("Auction");
            auctionContract = await AuctionContract.attach(auctionAddress);
            // lower reserve price
            await auctionContract.connect(creator).lowerReserve(1000000000000000);
            // get live auctions
            aucArray = await managerContract.getAuctions();
            expect(aucArray[0]).to.equal(auctionAddress);
            // get live auction for NFT address
            nftArray = await managerContract.collectionGetAllForSale(nftContract.address);
            expect(nftArray[0]).to.equal(auctionAddress);
            // get auction info
            info = await managerContract.getAuctionInfo(auctionContract.address);
            expect(info._nftAddress).to.equal(nftContract.address);
            // buy the nft
            tx2 = await auctionContract.connect(addr1).placeBid({
                value: ethers.utils.parseEther("0.1")
            });
            const receipt2 = await tx2.wait();
            for (const event of receipt2.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await auctionContract.maxBidder()).to.equal(addr1.address);
            await network.provider.send("evm_setNextBlockTimestamp", [startTime + 1000]);
            tx3 = await auctionContract.connect(addr1).endAuction();
            const receipt3 = await tx3.wait();
            for (const event of receipt3.events) {
                console.log(`Event ${event.event} with args ${event.args}`);
            }
            expect(await nftContract.balanceOf(addr1.address)).to.equal(1);
        }
        );
    });
});