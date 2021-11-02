import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { NFTClaimTrackerV5__factory } from "../typechain";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const NFTClaimTrackerV5Factory: ContractFactory = await ethers.getContractFactory('NFTClaimTrackerV5');
  const riddler1 = '0x4375daBA68D97573efaf2822B98cfaF582C23bAA';
  const bestFTSOTokenContract = '0xC84490846AFEf9Ca5e70535cE993Fd8e4217F425';
  const deployedAddress = "0x3aDF60dE7c1c304Cf3AF5336525A8498BfB27198";
  const claimContract = new NFTClaimTrackerV5__factory(deployer);
  const abi = [
    'function setNewClaimableNFT(address _vaultWallet, address _claimableContract, uint256 _tokenId, uint256[] memory _blockReqs, uint256[] memory _vpReqs) external'
  ];
  const claimContract2 = new ethers.Contract(deployedAddress, abi, deployer);
  const tokenId = 4;
  const blocksRequired = [1315007];
  const votePower1 = ethers.utils.parseEther('1000');
  const vpRequired = [votePower1];
  const result = await claimContract2.setNewClaimableNFT(riddler1, bestFTSOTokenContract, tokenId, blocksRequired, vpRequired);
  console.log('result: ', result);
}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
