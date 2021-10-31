import { ethers, upgrades } from "hardhat";
import chai from "chai";

let NFPT;
let FTSOManager;
let Delegation;
let owner; //contract owner
let delegator1; //a delegator, giving votepower
let delegator2; //a delegator, giving votepower
let delegator3; //a delegator, giving votepower
let delegateTo; //address to delegateTo

describe("Simulating a 10 reward block sequence", function () {
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

  it("First Power Block -- should claim correct balances, revert on duplicates", async function () {
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
  });

  it("Second Power Block -- should add correct power blocks, NOT claiming balances this block", async function () {
    //Second Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(9000, 9451, 120000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(1);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(1)).to.equal(9000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 9000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 9000);
  });

  it("Third Power Block -- should add correct power blocks, claim correct balances, revert on duplicates", async function () {
    //Third Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(10000, 10451, 130000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(2);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(2)).to.equal(10000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 10000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 10000);

    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("31.5"); //21 from this + previous + 10.5 from first block still in balance
    const expectedBalance2 = ethers.utils.parseEther("2.1"); //1.4 from this block + preivous + 0.7 from first block still in balance
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
  });

  it("Fourth Through Seventh Power Blocks -- should add correct power blocks, NOT claiming balances this sequence", async function () {
    //Fourth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(11000, 11451, 140000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(3);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(3)).to.equal(11000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 11000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 11000);

    //Fifth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(12000, 12451, 150000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(4);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(4)).to.equal(12000);

    //Delegate Voting Power
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 12000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 12000);

    //Sixth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(13000, 13451, 160000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(5);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(5)).to.equal(13000);

    //Delegate Voting Power
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 13000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 13000);

    //Seventh Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(14000, 14451, 170000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(6);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(6)).to.equal(14000);

    //Delegate Voting Power
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 14000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 14000);
  });

  it("Claim after 7th Power Block -- claim correct balances, revert on duplicates", async function () {
    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("63"); //31.5 from the last 3 + 31.5 existing balance
    const expectedBalance2 = ethers.utils.parseEther("4.2"); //2.1 from the last 3 + 2.1 existing balance
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
  });

  it("Eigth Power Block -- should add correct power blocks, claim correct balances, revert on duplicates", async function () {
    //Eigth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(15000, 15451, 180000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(7);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(7)).to.equal(15000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 15000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 15000);

    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("73.5"); //10.5 from current block + 63 existing balance
    const expectedBalance2 = ethers.utils.parseEther("4.9"); //.7 from this block + 4.2 existing balance
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
  });

  it("Ninth Power Block -- should add correct power blocks, claim correct balances, revert on duplicates", async function () {
    //Ninth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(16000, 16451, 190000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(8);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(8)).to.equal(16000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 16000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 16000);

    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("84"); //10.5 from current block + 73.5 existing balance
    const expectedBalance2 = ethers.utils.parseEther("5.6"); //.7 from this block + 4.9 existing balance
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
  });

  it("Tenth Power Block -- should add correct power blocks, not claiming this block", async function () {
    //Tenth Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(17000, 17451, 200000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(9);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(9)).to.equal(17000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 17000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 17000);
  });

  it("Eleventh Power Block -- should add correct power blocks, claim correct balances, revert on duplicates", async function () {
    //Eleventh Voting Power Block
    //Add Voting Power Block
    await FTSOManager.addRewardEpoch(18000, 18451, 210000);
    expect(await FTSOManager.getCurrentRewardEpoch()).to.equal(10);
    expect(await FTSOManager.getRewardEpochVotePowerBlock(10)).to.equal(18000);

    //Delegate Voting Power
    const amountToDelegate = ethers.utils.parseEther("1500");
    const amountToDelegate2 = ethers.utils.parseEther("100");
    const amountToDelegate3 = ethers.utils.parseEther("2000");
    await Delegation.connect(delegator1).delegateMock(delegateTo.address, amountToDelegate, 18000);
    await Delegation.connect(delegator2).delegateMock(delegateTo.address, amountToDelegate2, 18000);
    await Delegation.connect(delegator3).delegateMock(delegateTo.address, amountToDelegate3, 18000);

    //Claim Rewards
    const expectedBalance1 = ethers.utils.parseEther("105"); //21 from current & last + 84 existing balance
    const expectedBalance2 = ethers.utils.parseEther("7"); //1.4 from this current & last + 5.6 existing balance
    const expectedBalance3 = ethers.utils.parseEther("14"); //14 from new user, nothing from previous
    await NFPT.connect(delegator1).claimRewards();
    await NFPT.connect(delegator2).claimRewards();
    await NFPT.connect(delegator3).claimRewards();
    expect(await NFPT.balanceOf(delegator1.address)).to.eq(expectedBalance1);
    expect(await NFPT.balanceOf(delegator2.address)).to.eq(expectedBalance2);
    expect(await NFPT.balanceOf(delegator3.address)).to.eq(expectedBalance3);
    expect(NFPT.connect(delegator1).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator2).claimRewards()).to.be.reverted;
    expect(NFPT.connect(delegator3).claimRewards()).to.be.reverted;
  });
});
