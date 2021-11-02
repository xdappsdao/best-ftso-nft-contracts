import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const BestFTSONFTsFactory: ContractFactory = await ethers.getContractFactory('BestFTSONFTs');
  const nftpAddress = '0xba0797b2BCea8de74eb9EC19F6F2bfC05325e77E';
  const me1 = '0xba0797b2BCea8de74eb9EC19F6F2bfC05325e77E';
  const me2 = '0xba0797b2BCea8de74eb9EC19F6F2bfC05325e77E';
  const riddler1 = '0x4375daBA68D97573efaf2822B98cfaF582C23bAA';
  const fc = '0xfc17314c081f859c5988aef0558f1aee757c27a3';
  
  const listOfMinters: string[] = [me1, me2, riddler1, fc];
  const mintAdmin = '';
  const deployedAddress = "0xC84490846AFEf9Ca5e70535cE993Fd8e4217F425";
  const deployedContract = await upgrades.deployProxy(BestFTSONFTsFactory, ["Best FTSO NFT Contract", "BNFT", listOfMinters, riddler1, nftpAddress], { initializer: 'initializeContract' });
  console.log('BestFTSONFTs deployed to: ', deployedContract.address);
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
