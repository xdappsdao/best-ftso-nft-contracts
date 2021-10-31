import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const NFTPContractFactory: ContractFactory = await ethers.getContractFactory('NFTP');

  const deployedAddress = "0xD790F869b00a34c01649F9431A2bf6242F6364CE"
  const upgraded = await upgrades.upgradeProxy(deployedAddress, NFTPContractFactory);
  console.log('upgraded ', upgraded);


}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
