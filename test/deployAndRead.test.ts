const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-waffle");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

let NFPT;
let FTSOManager;
let Delegation;
let owner; //contract owner
let delegator1; //a delegator, giving votepower
let delegator2; //a delegator, giving votepower
let delegateTo; //address to delegateTo

before(async function () {
  //deploy the contracts and get the addresses before tests
  [owner, delegator1, delegator2, delegateTo] = await ethers.getSigners();

  const FTSOManagerFactory = await ethers.getContractFactory("FTSOManagerMock");
  FTSOManager = await FTSOManagerFactory.deploy();
  await FTSOManager.deployed();

  const DelegationFactory = await ethers.getContractFactory("DelegationMock");
  Delegation = await DelegationFactory.deploy();
  await Delegation.deployed();

  const NFPTFactory = await ethers.getContractFactory("NFPT");
  NFPT = await NFPTFactory.deploy(Delegation.address, delegateTo.address, FTSOManager.address);
  await NFPT.deployed();
});

describe("Add Reward Epochs", function () {
  it("Should add reward epochs to the mock FTSO Manager and have the correct index and power block read back", async function () {
    await FTSOManager.addRewardEpoch(8000, 8451, 110000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(0);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(0)).to.equal(8000);

    await FTSOManager.addRewardEpoch(9000, 9451, 120000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(1);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(1)).to.equal(9000);
  });
});

describe("Delegate To Address", function () {
  it("Should delegate voting power at voting block", async function () {
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");

    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 8000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 8000);

    const amountToDelegate3 = ethers.utils.parseEther("1700");
    const amountToDelegate4 = ethers.utils.parseEther("300");

    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate3, 9000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate4, 9000);

    expect(await Delegation.votePowerFromToAt(delegator1.address, delegateTo.address, 8000)).to.eq(amountToDelegate);
    expect(await Delegation.votePowerFromToAt(delegator2.address, delegateTo.address, 8000)).to.eq(amountToDelegate2);

    expect(await Delegation.votePowerFromToAt(delegator1.address, delegateTo.address, 9000)).to.eq(amountToDelegate3);
    expect(await Delegation.votePowerFromToAt(delegator2.address, delegateTo.address, 9000)).to.eq(amountToDelegate4);
  });
});

describe("Calculated Rewards", function () {
  it("Should calculate rewards accurately for the two different accounts", async function () {
    const expectedRewards1 = ethers.utils.parseEther("22.4");
    const expectedRewards2 = ethers.utils.parseEther("2.8");
    expect(await NFPT.calculateClaimableRewards(delegator1.address)).to.eq(expectedRewards1);
    expect(await NFPT.calculateClaimableRewards(delegator2.address)).to.eq(expectedRewards2);
  });
});

describe("Claim Rewards", function () {
  it("Should claim rewards and not be able to claim a second time. Claiming with a 0 rewards account should revert", async function () {
    const expectedBalance1 = ethers.utils.parseEther("22.4");
    const expectedBalance2 = ethers.utils.parseEther("2.8");
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
  });
});
