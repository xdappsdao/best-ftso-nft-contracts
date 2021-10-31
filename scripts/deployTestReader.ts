import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  // const SGBMarketplaceFactory: ContractFactory = await ethers.getContractFactory('SGBMarketplace');
  const TestReaderContractFactory: ContractFactory = await ethers.getContractFactory('TestReader');
  const votePowerAddress = '0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED';
  const tsoAddress = '0x939789ed3D07A80da886A3E3017d665cBb5591dC';
  const ftsoManagerAddress = '0xbfA12e4E1411B62EdA8B035d71735667422A6A9e';

  const deployedAddress = "0x14059b085a8085A9E054B13A2017960aF4506841"

  //Deploy Token & Marketplace Contract
  const nftpContract = await upgrades.deployProxy(TestReaderContractFactory, ["Best FTSO NFT Points", "NFTP"], { initializer: 'initializeContract' });
  console.log('NFTP deployed to: ', nftpContract.address);

  // const tokenContract = await upgrades.deployProxy(NFTpContractFactory, ['SGB NFTs1155', 'SBNFT', marketplaceAddress], { initializer: 'initializeContract' });
  // console.log('nftContract deployed to: ', tokenContract.address);

}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
