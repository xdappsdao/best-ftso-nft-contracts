import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { SGBNFT721V3__factory } from "../typechain";
import { BigNumber } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("NFT MarketplaceToken", () => {
  let tokenAddress: string;
  describe("Deploy Contracts", async () => {
    it("Should Deploy The Contracts", async () => {
      const [deployer, user1] = await ethers.getSigners();
      const tokenFactory = new SGBNFT721V3__factory(deployer);
      const tokenContract = await upgrades.deployProxy(tokenFactory, ['SGB NFTs', 'SBNFT'], { initializer: 'initializeContract' });
      console.log(tokenContract.address)
      //  const tokenContract = await tokenFactory.deploy("Token-CHAI", "Chai", marketplaceContract.address);
      tokenAddress = tokenContract.address;
    });
  });

});
