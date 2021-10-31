import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const NFTPContractFactory: ContractFactory = await ethers.getContractFactory('NFTP');

  const deployedAddress = "0x67d3d94EA47a0e619FfA3933EfC465aaBa90D0ae"
  const upgraded = await upgrades.upgradeProxy(deployedAddress, NFTPContractFactory);
  console.log('upgraded ', upgraded);

 
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
