//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// ************************************** External Interfaces ****************************************************************************** */
interface Delegation {
  function votePowerFromToAt(
    address _from,
    address _to,
    uint256 _blockNumber
  ) external view returns (uint256);
}
interface ITokenContract {
    function transferFrom(address from, address to, uint256 tokenId) external;
	function safeTransferFrom(address from, address to, uint256 id,uint256 amount,bytes memory data) external;
	function safeBatchTransferFrom(address from, address to, uint256[] memory ids) external;
}

contract NFTClaimTrackerV5 is OwnableUpgradeable, PausableUpgradeable {
using CountersUpgradeable for CountersUpgradeable.Counter;
CountersUpgradeable.Counter private _itemId;

// ************************************** Struct Definitions ******************************************************************************** */
 struct ClaimableNFT{
	 address vaultWallet;
	 address claimableContract;
	 uint256 tokenId;
	 uint256[] blockReqs;
	 uint256[] vpReqs;
 }
 

// ************************************** Variable Definitions ******************************************************************************** */
mapping(uint256 => ClaimableNFT) public claimableNFTs;
mapping(address => mapping(uint256 => bool)) public tokenClaimed;

address public tsoAddress;  
address private contractAdmin;  
address public votePowerAddress;

// ************************************** Events Definitions ******************************************************************************** */
 event NFTClaimed(uint256 indexed itemId, address indexed claimingAddress);
 event ClaimableNFTAdded(uint256 indexed itemId, address indexed claimableContract, uint256 indexed tokenId, uint256[] blockReqs, uint256[] vpReqs);
 event ClaimableNFTUpdated(uint256 indexed itemUpdated, address indexed claimableContract, uint256 indexed tokenId, uint256[] blockReqs, uint256[] vpReqs);

// ************************************** Contract Initializer ******************************************************************************** */
function initializeContract(address _tsoAddress, address _votePowerAddress, address _contractAdmin) external initializer {
	__Ownable_init();
	__Pausable_init();
	tsoAddress = _tsoAddress;  
	contractAdmin = _contractAdmin;
	votePowerAddress = _votePowerAddress;  
	//votePowerAddress = 0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED;
  }

// ************************************** Modifiers  ******************************************************************************************* */
	modifier ownerOrAdmin() {
		bool isOwner = msg.sender == owner();
		bool isAdmin = msg.sender == contractAdmin;
        require(isOwner || isAdmin, "Error: must be contract owner or admin");
        _;
    }

// ************************************** Setter Functions ************************************************************************************* */
function setNewClaimableNFT(address _vaultWallet, address _claimableContract, uint256 _tokenId, uint256[] memory _blockReqs, uint256[] memory _vpReqs) external ownerOrAdmin {
	_itemId.increment();
	uint256 newItemId = _itemId.current();
	ClaimableNFT memory nft = ClaimableNFT(_vaultWallet, _claimableContract, _tokenId, _blockReqs, _vpReqs);
   	claimableNFTs[newItemId] = nft;
	emit ClaimableNFTAdded(newItemId, _claimableContract, _tokenId, _blockReqs, _vpReqs);
}
function updateClaimableNFT(uint256 _idToUpdate, address _vaultWallet, address _claimableContract, uint256 _tokenId, uint256[] memory _blockReqs, uint256[] memory _vpReqs) external ownerOrAdmin {
	claimableNFTs[_idToUpdate].claimableContract = _vaultWallet;
	claimableNFTs[_idToUpdate].claimableContract = _claimableContract;
	claimableNFTs[_idToUpdate].tokenId = _tokenId;
	claimableNFTs[_idToUpdate].blockReqs = _blockReqs;
	claimableNFTs[_idToUpdate].vpReqs = _vpReqs;
	emit ClaimableNFTUpdated(_idToUpdate, _claimableContract, _tokenId, _blockReqs, _vpReqs);
}
function updateTSOAddress(address _newTSOAddress) external ownerOrAdmin {
	tsoAddress = _newTSOAddress;
}
function updateContractAdmin(address _newAdmin) external ownerOrAdmin {
	contractAdmin = _newAdmin;
}
function updateVotePowerAddress(address _newVPA) external ownerOrAdmin {
	votePowerAddress = _newVPA;
}

// ************************************** View Functions *************************************************************************************** */
function userIsEligible(address _addressToCheck, uint256 _idToClaim) public view returns (bool) {
	return meetsRequirements(_addressToCheck, _idToClaim) && hasNotClaimed(_addressToCheck, _idToClaim);
}
function meetsRequirements(address _addressToCheck, uint256 _idToClaim) public view returns (bool) {
	ClaimableNFT memory nftToClaim = claimableNFTs[_idToClaim];	
	 uint256[] memory blockReqs = nftToClaim.blockReqs;
	 uint256[] memory vpReqs = nftToClaim.vpReqs;
	bool isEligible = true;
	for (uint256 i = 0; i <blockReqs.length; i++) {
		if(isEligible){
			uint256 blockToCheck = blockReqs[i];
			uint256 vpNeeded = vpReqs[i];
			uint256 votePowerLoop = getVotePowerByAddressBlock(_addressToCheck, blockToCheck);
		if (votePowerLoop < vpNeeded) {
			isEligible = false;
		}
		}
	}
	return isEligible;
}
function getVotePowerByAddressBlock(address _addressToCheck, uint256 _blockToCheck) public view returns (uint256) {
	Delegation delegationContract = Delegation(votePowerAddress);
	uint256 votePower = delegationContract.votePowerFromToAt(_addressToCheck, tsoAddress, _blockToCheck);
	return votePower;
}
function getBlockRequirements(uint256 _idToClaim) public view returns (uint256 [] memory) {
	return claimableNFTs[_idToClaim].blockReqs;
}
function getVPRequirements(uint256 _idToClaim) public view returns (uint256 [] memory) {
	return claimableNFTs[_idToClaim].vpReqs;
}
function getVaultWalletAddress(uint256 _idToClaim) public view returns (address) {
	ClaimableNFT memory nftToClaim = claimableNFTs[_idToClaim];
	return nftToClaim.vaultWallet;
}
function hasNotClaimed(address _addressToCheck, uint256 _idToClaim) public view returns (bool) {
	bool hasClaimed = tokenClaimed[_addressToCheck][_idToClaim];
	return !hasClaimed;
}

// ************************************** Claim Functions ************************************************************************************** */
function claimNFT(uint256 _idToClaim) whenNotPaused external {
	ClaimableNFT memory nftToClaim = claimableNFTs[_idToClaim];
	require(hasNotClaimed(msg.sender, _idToClaim), 'Already Claimed');
	require(meetsRequirements(msg.sender, _idToClaim), 'Vote Power Too Low');
	ITokenContract tokenContract = ITokenContract(nftToClaim.claimableContract);
	tokenContract.safeTransferFrom(nftToClaim.vaultWallet, msg.sender, nftToClaim.tokenId, 1, '');
	tokenClaimed[msg.sender][_idToClaim] = true;
	emit NFTClaimed(_idToClaim, msg.sender);
}
}