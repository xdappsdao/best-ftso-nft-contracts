import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';


export const NFTP_ABI = [
  "function calculateClaimableRewards(address _user) external view returns (uint256)",
  "function rewardClaimableForBlock(address _user, uint256 _vpBlock) public view returns (uint256)"
];

const nftpAddress = '0x74158DAAa7600Fb5b1479607bEcc3Fcc6C49c1a3';
const userToCheck = '0x13dD6daF273E3844cE310D6BcA435437874f96Dc';
const userToCheck2 = '0x6ac44de5fdce0aa8087b7d66e8f0d0b54fe632fb';

const nftpContract = new ethers.Contract(nftpAddress, NFTP_ABI, ethers.provider);

async function main(): Promise<void> {

  //const claimableRewardBN = await nftpContract.rewardClaimableForBlock(userToCheck, 2);
 //  console.log('claimableRewardBN', claimableRewardBN);
 //  const claimableReward = parseFloat(ethers.utils.formatUnits(claimableRewardBN));
//  console.log('claimableRewardsTotalBN', claimableReward);

  //const curr = await nftpContract.getDelegateTo();
 // console.log('epoch', curr);
  // const vpBlock = await nftpContract.getCurrentRewardEpoch();
  // console.log('vpBlock', vpBlock.toNumber());
  // const fma = await nftpContract.getCurrentVPBlock(vpBlock);
  // console.log('vpBlock', fma.toNumber());


  const claimableRewardsTotalBN = await nftpContract.calculateClaimableRewards(userToCheck2);
 console.log('claimableRewardsTotalBN', claimableRewardsTotalBN);
 const claimableRewardsTotal = parseFloat(ethers.utils.formatUnits(claimableRewardsTotalBN));
 console.log('claimableRewardsTotal', claimableRewardsTotal);
  console.log("Done");
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
