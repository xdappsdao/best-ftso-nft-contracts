import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { BestFTSONFTs__factory } from "../typechain";

async function main(): Promise<void> {
  const BestFTSONFTsFactory: ContractFactory = await ethers.getContractFactory('BestFTSONFTs');
  //const abi = ["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];
  const contractAddress = "0xC84490846AFEf9Ca5e70535cE993Fd8e4217F425";
  const claimABI = ['function userIsEligible(address _addressToCheck, uint256 _idToClaim) public view returns (bool)',
    'function getVotePowerByAddressBlock(address _addressToCheck, uint256 _blockToCheck) public view returns (uint256)',
    "function claimNFT(uint256 _idToClaim) external",
    "function getVaultWalletAddress(uint256 _idToClaim) public view returns (address)",
    'function getBlockRequirements(uint256 _idToClaim) public view returns (uint256 [] memory)'];
  const abiToken = [
    'function isApprovedForAll(address account, address operator) external view returns (bool)',
    'function balanceOf(address account, uint256 id) external view returns (uint256)'
  ];
  const claimTracker = "0x3aDF60dE7c1c304Cf3AF5336525A8498BfB27198";
  const riddlerMinter = '0x4375daBA68D97573efaf2822B98cfaF582C23bAA';
  const me = '0xba0797b2BCea8de74eb9EC19F6F2bfC05325e77E';
  const [deployer, me2] = await ethers.getSigners();
  //const contract = new ethers.Contract(contractAddress, abi, deployer);
  //const contract = new BestFTSONFTs__factory(deployer).attach(contractAddress);
  const contract2 = new ethers.Contract(claimTracker, claimABI, me2);
  const result = await contract2.getVotePowerByAddressBlock(me, 783203);
  const result2 = await contract2.userIsEligible(me, 1);
  const result3 = await contract2.claimNFT(1, { gasLimit: 100000 });
 // const bal1 = await contract.balanceOf(riddlerMinter, 1);
 // const name = await contract.name();
//  const symbol = await contract.symbol();
//  const formattedResult = ethers.utils.formatUnits(result);

//  console.log('name ', name);
//  console.log('symbol ', symbol);
  console.log('result2 ', result2);
  console.log('result3 ', result3);
  console.log('result ', result);
///  console.log('bal1 ', bal1.toNumber());
  // console.log('result2 ', result2[0].toNumber());


}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
