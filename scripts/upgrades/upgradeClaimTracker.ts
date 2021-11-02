import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const NFTClaimTrackerV5Factory: ContractFactory = await ethers.getContractFactory('NFTClaimTrackerV5');

  const deployedAddress = "0x3aDF60dE7c1c304Cf3AF5336525A8498BfB27198"
  const upgraded = await upgrades.upgradeProxy(deployedAddress, NFTClaimTrackerV5Factory);
  console.log('upgraded ', upgraded);


}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
