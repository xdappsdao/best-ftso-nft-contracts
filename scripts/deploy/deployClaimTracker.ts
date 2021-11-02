import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  const NFTClaimTrackerV5Factory: ContractFactory = await ethers.getContractFactory('NFTClaimTrackerV5');
  const tsoAddress = '0x939789ed3D07A80da886A3E3017d665cBb5591dC';
  const me1 = '0xba0797b2BCea8de74eb9EC19F6F2bfC05325e77E';
  const riddler1 = '0x4375daBA68D97573efaf2822B98cfaF582C23bAA';
  const votePowerAddress = '0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED';
  const deployedAddress = "";
  const deployedContract = await upgrades.deployProxy(NFTClaimTrackerV5Factory, [tsoAddress, votePowerAddress, riddler1], { initializer: 'initializeContract' });
  console.log('ClaimTrackerV5 deployed to: ', deployedContract.address);
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
