import { ethers, upgrades } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { BestFTSONFTs__factory } from "../typechain";

async function main(): Promise<void> {
  const nftpAddress = '0x3B46090e608cBC963356f30857F4DAcC09f5DDC4';
  //const BestFTSONFTsFactory: ContractFactory = await ethers.getContractFactory('BestFTSONFTs');
  //const abi = ["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];
  const contractAddress = "0xC84490846AFEf9Ca5e70535cE993Fd8e4217F425";
  const [deployer] = await ethers.getSigners();
  //const contract = new ethers.Contract(contractAddress, abi, deployer);
  const contract = new BestFTSONFTs__factory(deployer).attach(contractAddress);
  const name = await contract.name();
  const symbol = await contract.setNFTPAddress(nftpAddress)

  console.log('name ', name);
  console.log('symbol ', symbol);


}
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
