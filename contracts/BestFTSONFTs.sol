//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/IERC1155MetadataURIUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface INFTPContract {
  function redeemPoints(address _accountToBurn, uint256 _amountToBurn) external;
  function boostMintDirectly(address _receivingAddress, uint256 _amountToMint) external;
}

contract BestFTSONFTs is ERC1155SupplyUpgradeable, OwnableUpgradeable  {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;
	address private _mintAdmin;
	address private _nftpAddress;

// ******************************************* Structs ************************************************************************
    struct Token {
        uint256 id;
        address creator;
        string uri;
    }
    struct Royalty {
        uint256 royalty;
        address royaltyAddress;
    }
    struct Boost {
        uint256 dailyBoost;
        uint256 percentageBoost;
        uint256 burnBoost;
        uint256 expires;
    }
    struct NFTPPrices {
		address vaultWallet;
        uint256 nftpCost;
        uint256 qtyAvail;
        uint256 expires;
    }
// ******************************************* Mappings ************************************************************************
    // Mapping from address to mint permission
    mapping(address => bool) public canMint;
    // Mapping from token ID to Token Data
    mapping(uint256 => Token) public tokens;
    // Mapping from token ID to Royalty Data
    mapping(uint256 => Royalty) public royalties;
    // Mapping from token ID to Boost Data
    mapping(uint256 => Boost) public boosts;
    // Mapping from token ID to NFTP Data
    mapping(uint256 => NFTPPrices) public nftpListings;

// ******************************************* Added Vars ************************************************************************
	string private _name;
	string private _symbol;

// ******************************************* Events ************************************************************************
    event BoostSet(uint256 indexed tokenId, uint256 dailyBoost, uint256 percentageBoost, uint256 burnBoost, uint256 expires);
    event RoyaltyAddressUpdated(uint256 indexed tokenId, address indexed newAddress, address indexed oldAddress);
    event MinterAdded(address indexed addressAdded, bool mintStatus);
    event NFTPPriceSet(uint256 indexed tokenId, address indexed vaultWallet, uint256 nftpCost, uint256 qtyAvail, uint256 expires);
    event NFTPClaimed(uint256 indexed tokenId, address indexed claimingAddress, uint256 nftpCost, uint256 qtyClaimed);
    event BurnBoost(uint256 indexed tokenId, address indexed burningAddress, uint256 qtyBurned, uint256 totalBonus);

// ******************************************* Initiaizer ************************************************************************
	function initializeContract(string memory _nameInit, string memory _symbolInit, address[] memory _initialMinters, address _mintAdminInitial, address _nftpAddressInitial) external initializer {
		__ERC1155_init('');
		__Ownable_init();
		__ERC1155Supply_init();
		_name = _nameInit;
		_symbol = _symbolInit;
		_mintAdminInitial = _mintAdminInitial;
		_nftpAddress = _nftpAddressInitial;
		for (uint256 i = 0; i < _initialMinters.length; i++) {
			canMint[_initialMinters[i]] = true;
		}
	}
// ******************************************* Modifiers ************************************************************************
	modifier ownerOrAdmin() {
		bool isOwner = msg.sender == owner();
		bool isAdmin = msg.sender == _mintAdmin;
        require(isOwner || isAdmin, "Error: must be contract owner or admin");
        _;
    }

// ******************************************* Setter Functions ************************************************************************
	function setMintAdmin(address _mintAdminAddress)onlyOwner external {
		_mintAdmin = _mintAdminAddress;
    }	
	function setNFTPAddress(address _newNFTPAddress) onlyOwner external {
        _nftpAddress = _newNFTPAddress;
    }	
	function addMinter(address _mintingAddress, bool approvalStatus) ownerOrAdmin external {
		canMint[_mintingAddress] = approvalStatus;
		emit MinterAdded(_mintingAddress, approvalStatus);
    }
	function updateRoyaltyAddress(uint256 tokenIdToUpate, address _newAddress) external {
			address currentRoyaltyAddress = royalties[tokenIdToUpate].royaltyAddress;
			require(msg.sender == currentRoyaltyAddress, "Only the current Royalty Address Can Update the Royalty Address");
			royalties[tokenIdToUpate].royaltyAddress = _newAddress;
			emit RoyaltyAddressUpdated(tokenIdToUpate, _newAddress, currentRoyaltyAddress);
    }	
	function setBoostDetails(uint256 tokenId, uint256 _dailyBoost, uint256 _percentageBoost, uint256 _burnBoost, uint256 _expires) ownerOrAdmin external {
        boosts[tokenId].dailyBoost = _dailyBoost;
        boosts[tokenId].percentageBoost = _percentageBoost;
        boosts[tokenId].burnBoost = _burnBoost;
        boosts[tokenId].expires = _expires;
		emit BoostSet(tokenId, _dailyBoost, _percentageBoost, _burnBoost, _expires);
    }	
	function setNFTPDetails(uint256 _tokenId, address _vaultWallet, uint256 _nftpCost, uint256 _qtyAvail, uint256 _expires) ownerOrAdmin external {
        nftpListings[_tokenId].vaultWallet = _vaultWallet;
        nftpListings[_tokenId].nftpCost = _nftpCost;
        nftpListings[_tokenId].qtyAvail = _qtyAvail;
        nftpListings[_tokenId].expires = _expires;
		emit NFTPPriceSet(_tokenId, _vaultWallet, _nftpCost, _qtyAvail, _expires);
    }	

// ******************************************* Getter Functions ************************************************************************
	function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenURI(tokenId);
    }
	function name() public view returns (string memory) {
        return _name;
    }
	function symbol() public view returns (string memory) {
        return _symbol;
    }
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return tokens[tokenId].uri;
    }  
    function getCanMint(address _addressToCheck) public view returns (bool) {
        return canMint[_addressToCheck];
    }
    function getRoyaltyAddress(uint256 _tokenId) public view returns (address) {
        return royalties[_tokenId].royaltyAddress;
    }
    function getRoyaltyAmount(uint256 _tokenId, uint256 salePrice) public view returns (uint256) {
        uint256 resultAmount = (royalties[_tokenId].royalty * salePrice)/10000;
        return resultAmount;
    }
    function getDailyBoost(uint256 _tokenId) public view returns (uint256) {
        return boosts[_tokenId].dailyBoost;
    }
    function getPercentageBoost(uint256 _tokenId) public view returns (uint256) {
        return boosts[_tokenId].percentageBoost;
    }
    function getBoostExpiration(uint256 _tokenId) public view returns (uint256) {
        return boosts[_tokenId].expires;
    }
    function getNFTPVaultAddress(uint256 _tokenId) public view returns (address) {
        return nftpListings[_tokenId].vaultWallet;
    }
    function getNFTPQTYAvail(uint256 _tokenId) public view returns (uint256) {
        return nftpListings[_tokenId].qtyAvail;
    }
    function getNFTPPrice(uint256 _tokenId) public view returns (uint256) {
        return nftpListings[_tokenId].nftpCost;
    }
    function getNFTPExpires(uint256 _tokenId) public view returns (uint256) {
        return nftpListings[_tokenId].expires;
    }
// ******************************************* Mint Functions **************************************************************************
    function mint(string memory newTokenURI, uint256 amount) public returns(uint256) {
		require(canMint[msg.sender], "You do not have the permission to mint new tokens");
        return _mintItem(newTokenURI, amount, 0, address(0));
    } 
    function mintWithRoyalty(string memory newTokenURI, uint256 amount, uint256 _royalty, address _royaltyAddress) public returns(uint256) {
		require(canMint[msg.sender], "You do not have the permission to mint new tokens");
        return _mintItem(newTokenURI, amount, _royalty, _royaltyAddress);
    }
    function _mintItem(string memory newTokenURI, uint256 amount, uint256 _royalty, address _royaltyAddress) internal returns(uint256) {
        address minter = msg.sender;
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _mint(minter, newTokenId, amount, ''); 
        tokens[newTokenId] = Token(newTokenId, minter, newTokenURI);
        royalties[newTokenId] = Royalty(_royalty, _royaltyAddress);
        return newTokenId;
    }	
	 function _mintBatch(string[] memory listOfURIs, uint256[] calldata amounts, uint256 _royalty, address _royaltyAddress) internal returns(uint256[] memory) {
        address minter = msg.sender;
		uint256[] memory listOfNewIDs;
		for (uint256 i = 0; i < listOfURIs.length; i++) {
        	_tokenIdCounter.increment();
        	uint256 newTokenId = _tokenIdCounter.current();
        	tokens[newTokenId] = Token(newTokenId, minter, listOfURIs[i]);
        	royalties[newTokenId] = Royalty(_royalty, _royaltyAddress);
			listOfNewIDs[i] = newTokenId;	
		}
        _mintBatch(minter, listOfNewIDs, amounts, ''); 
        return listOfNewIDs;
    }
	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

// ******************************************* Burn Functions **************************************************************************
function burn(uint256 _tokenId, uint256 _qtyToBurn) public {
		uint256 balance = balanceOf(msg.sender, _tokenId);
		require(balance >= _qtyToBurn, "You do not have that many tokens to burn");
		_burn(msg.sender, _tokenId, _qtyToBurn);
		uint256 bonusNFTP = _qtyToBurn * boosts[_tokenId].burnBoost;
		if(bonusNFTP > 0){
		INFTPContract nftp = INFTPContract(_nftpAddress);
		nftp.boostMintDirectly(msg.sender, bonusNFTP);
		emit BurnBoost(_tokenId, msg.sender, _qtyToBurn, bonusNFTP);
		}
    } 

}