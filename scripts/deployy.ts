const hre = require("hardhat");

async function deploy() {
  const accounts = await hre.ethers.getSigners();

  const mockDelegationFactory = await hre.ethers.getContractFactory("DelegationMock");
  const mockDelegation = await mockDelegationFactory.deploy();

  await mockDelegation.deployed();
  console.log("Delegation Mock Deployed To: ", mockDelegation.address);
  const mockDelegationAddress = mockDelegation.address;

  const mockFTSOManagerFactory = await hre.ethers.getContractFactory("FTSOManagerMock");
  const mockFTSOManager = await mockFTSOManagerFactory.deploy();

  await mockFTSOManager.deployed();
  console.log("FTSOManager Mock Deployed To: ", mockFTSOManager.address);
  const mockFTSOManagerAddress = mockFTSOManager.address;

  //address we want to delegate to to earn rewards
  const delegatedTo = accounts[0].address;

  const NFPTFactory = await hre.ethers.getContractFactory("NFPT");
  const NFPT = await NFPTFactory.deploy(mockDelegationAddress, delegatedTo, mockFTSOManagerAddress);

  await NFPT.deployed();

  console.log("NFPT Test Deployed To: ", NFPT.address);

  return [mockDelegationAddress, mockFTSOManagerAddress, NFPT.address];
}

exports.deploy = deploy;
