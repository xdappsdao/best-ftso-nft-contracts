import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const BestFTSONFTsFactory: ContractFactory = await ethers.getContractFactory('BestFTSONFTs');
  const nftpAddress = '0x3B46090e608cBC963356f30857F4DAcC09f5DDC4';
  const me1 = '';
  const me2 = '';
  const riddler1 = '';
  const riddler2 = '';
  const listOfMinters: string[] = [me1, me2, riddler1, riddler2];
  const mintAdmin = '';
  const deployedAddress = "";
  const deployedContract = await upgrades.deployProxy(BestFTSONFTsFactory, ["Best FTSO NFT Contract", "BNFT", listOfMinters, mintAdmin, nftpAddress], { initializer: 'initializeContract' });
  console.log('BestFTSONFTs deployed to: ', deployedContract.address);
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
