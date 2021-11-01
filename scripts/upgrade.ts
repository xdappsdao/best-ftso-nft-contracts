import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const BestFTSONFTsFactory: ContractFactory = await ethers.getContractFactory('BestFTSONFTs');

  const deployedAddress = ""
  const upgraded = await upgrades.upgradeProxy(deployedAddress, BestFTSONFTsFactory);
  console.log('upgraded ', upgraded);


}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
