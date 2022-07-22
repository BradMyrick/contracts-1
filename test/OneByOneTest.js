const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    utils
} = require("web3");
describe("OneByOne contract", function () {
    let ObO721;
    let obO721;
    let _name = "test"
    let _ticker = "tst"
    let _baseURI = "https://baseurl.url/"

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        [owner, addr1, addr2, addr3, _feeCollector, ...addrs] = await ethers.getSigners();
        ObO721 = await ethers.getContractFactory("OneByOne721");
        obO721 = await ObO721.connect(owner).deploy(_name, _ticker);
        await obO721.deployed();
    }
    );
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await obO721.owner()).to.equal(owner.address);
        }
        );
    }
    );
}
);
