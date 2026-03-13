const { expect } = require("chai");
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const ethers = hre.ethers;

describe("TransparentService", function () {
  let TransparentService;
  let service;
  let owner;
  let officer;
  let citizen1;
  let citizen2;

  beforeEach(async function () {
    [owner, officer, citizen1, citizen2] = await ethers.getSigners();
    TransparentService = await ethers.getContractFactory("TransparentService");
    service = await TransparentService.deploy(officer.address);
    await service.deployed();
  });

  it("should set the officer address on deployment", async function () {
    expect(await service.officer()).to.equal(officer.address);
  });

  it("allows a citizen to create a request and reads it back", async function () {
    await service.connect(citizen1).createRequest("Passport", "ipfs://userdoc1");

    const count = await service.requestCount();
    expect(count.toNumber()).to.equal(1);

    const r = await service.getRequest(0);
    expect(r.id.toString()).to.equal("0");
    expect(r.citizen).to.equal(citizen1.address);
    expect(r.serviceType).to.equal("Passport");
    expect(r.status.toString()).to.equal("0"); // Pending
    expect(r.userDoc).to.equal("ipfs://userdoc1");
  });

  it("prevents non-owners from uploading user documents", async function () {
    await service.connect(citizen1).createRequest("ID", "ipfs://u1");
    await expect(
      service.connect(citizen2).uploadUserDocument(0, "ipfs://malicious")
    ).to.be.revertedWith("Only citizen owner");
  });

  it("allows the citizen owner to upload/replace their document", async function () {
    await service.connect(citizen1).createRequest("ID", "ipfs://u1");
    await service.connect(citizen1).uploadUserDocument(0, "ipfs://u2");
    const r = await service.getRequest(0);
    expect(r.userDoc).to.equal("ipfs://u2");
  });

  it("allows the officer to verify a request and set adminDoc + verifiedTimestamp", async function () {
    await service.connect(citizen1).createRequest("License", "ipfs://u1");

    await expect(service.connect(officer).verifyRequest(0, "ipfs://admin1")).to.not.be.reverted;

    const r = await service.getRequest(0);
    expect(r.adminDoc).to.equal("ipfs://admin1");
    expect(r.status.toString()).to.equal("2"); // Verified
    expect(r.verifiedTimestamp.toString()).to.not.equal("0");
  });

  it("prevents non-officers from verifying or updating status", async function () {
    await service.connect(citizen1).createRequest("License", "ipfs://u1");
    await expect(
      service.connect(citizen1).verifyRequest(0, "ipfs://admin1")
    ).to.be.revertedWith("Only officer");

    await expect(service.connect(citizen1).updateStatus(0, 1)).to.be.revertedWith("Only officer");
  });

  it("allows the officer to update status", async function () {
    await service.connect(citizen1).createRequest("License", "ipfs://u1");
    await service.connect(officer).updateStatus(0, 1); // InProgress
    const r = await service.getRequest(0);
    expect(r.status.toString()).to.equal("1");
  });

  it("returns all requests via getAllRequests", async function () {
    await service.connect(citizen1).createRequest("A", "uA");
    await service.connect(citizen2).createRequest("B", "uB");
    const all = await service.getAllRequests();
    expect(all.length).to.equal(2);
    expect(all[0].citizen).to.equal(citizen1.address);
    expect(all[1].citizen).to.equal(citizen2.address);
  });
});
