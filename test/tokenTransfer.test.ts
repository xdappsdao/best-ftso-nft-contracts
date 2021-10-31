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
let delegator3; //a delegator, giving votepower
let delegateTo; //address to delegateTo

describe("Testing the transfer functionality -- should revert when isTransferable is false", function () {
  before(async function () {
    //deploy the contracts and get the addresses before tests
    [owner, delegator1, delegator2, delegateTo, delegator3] = await ethers.getSigners();

    const FTSOManagerFactory = await ethers.getContractFactory("FTSOManagerMock");
    FTSOManager = await FTSOManagerFactory.deploy();
    await FTSOManager.deployed();

    const DelegationFactory = await ethers.getContractFactory("DelegationMock");
    Delegation = await DelegationFactory.deploy();
    await Delegation.deployed();

    const NFPTFactory = await ethers.getContractFactory("NFPT");
    //const deploymentData = NFPTFactory.getDeployTransaction(Delegation.address, delegateTo.address, FTSOManager.address);
    //const gasCostEstimate = await owner.estimateGas(deploymentData);
    //console.log("Gas Estimate: ", ethers.utils.formatUnits(gasCostEstimate, "wei"));
    NFPT = await NFPTFactory.deploy(Delegation.address, delegateTo.address, FTSOManager.address);
    await NFPT.deployed();
  });

  it("Create Power Block -- should claim correct balances, try some transfers and revert", async function () {
    //First Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(8000, 8451, 110000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(0);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(0)).to.equal(8000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 8000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 8000);

    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("10.5");
    const expectedBalance2 = ethers.utils.parseEther("0.7");
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;

    //attempt transfer, should be reverted
    expect(NFPT.connect(delegator1).transfer(delegator2.address, ethers.utils.parseEther("1"))).to.be.reverted;
  });

  it("Sets transferable to true --- balances should transfer appropriately", async function () {
    await NFPT.setTransferable(true);
    await NFPT.connect(delegator1).transfer(delegator2.address, ethers.utils.parseEther("1"));
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(ethers.utils.parseEther("9.5"));
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(ethers.utils.parseEther("1.7"));
  });

  it("Sets transferable to false --- should revert", async function () {
    await NFPT.setTransferable(false);
    expect(NFPT.connect(delegator1).transfer(delegator2.address, ethers.utils.parseEther("1"))).to.be.reverted;
  });

  it("Sets allowance, but transferFrom should revert", async function () {
    await NFPT.connect(delegator1).approve(delegator3.address, ethers.utils.parseEther("7"));
    expect(await NFPT.connect(delegator1).allowance(delegator1.address, delegator3.address)).to.eq(ethers.utils.parseEther("7"));
    expect(NFPT.connect(delegator3).transferFrom(delegator1.address, delegator3.address, ethers.utils.parseEther("5"))).to.be.reverted;
  });

  it("Sets transferable to true, transferFrom should work as intended", async function () {
    await NFPT.setTransferable(true);
    await NFPT.connect(delegator3).transferFrom(delegator1.address, delegator3.address, ethers.utils.parseEther("5"));
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(ethers.utils.parseEther("4.5"));
    expect(await NFPT.balanceOf(delegator3.address)).to.eq(ethers.utils.parseEther("5"));
  });
});
