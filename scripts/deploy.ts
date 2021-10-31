import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  // const SGBMarketplaceFactory: ContractFactory = await ethers.getContractFactory('SGBMarketplace');
  const NFPTContractFactory: ContractFactory = await ethers.getContractFactory('NFTP');
  const votePowerAddress = '0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED';
  const tsoAddress = '0x939789ed3D07A80da886A3E3017d665cBb5591dC';
  const ftsoManagerAddress = '0xbfA12e4E1411B62EdA8B035d71735667422A6A9e';

  const deployedAddress = ""

  //Deploy Token & Marketplace Contract
  const nftpContract = await upgrades.deployProxy(NFPTContractFactory, ["Best FTSO NFT Points", "NFTP"], { initializer: 'initializeContract' });
  console.log('NFTP deployed to: ', nftpContract.address);
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
