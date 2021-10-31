//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface Delegation {
  function votePowerFromToAt(
    address _from,
    address _to,
    uint256 _blockNumber
  ) external view returns (uint256);
}

interface FTSOManager {
  function getRewardEpochVotePowerBlock(uint256 _rewardEpoch) external view returns (uint256);
  function getCurrentRewardEpoch() external view returns (uint256);
}

contract NFTP is ERC20Upgradeable, OwnableUpgradeable {
  uint256 public SGBDelegatedDenominator;
  uint256 public tokenRewardPerVPBPerDenominator;
  uint256 public vpBlocksToClaim;

  //If the user claimed rewards for a specific block
  mapping(address => mapping(uint256 => bool)) public vpBlockClaimed;
  //address of delegation contract we will read off of
  address public delegationAddress;
  //address votepower the user needs to have delegated to to earn rewards
  address public delegatedTo;
  //address of FTSO Manager Contract
  address public ftsoManagerAddress;  
  //address that is allowed to burn tokens when spent
  address public burnApprover;

  bool public isTransferable;

  //Events
  event BurnApproverSet(address newBurnApprover);
  event NFTPointsBurned(address indexed burningAddress, uint256 amountBurned);
  event NFTPsClaimed(address indexed claimingAddress, uint256 rewardsClaimed);

  //initializer for upgradable
  function initializeContract(string memory _name, string memory _symbol) public {
	_name = _name;
	_symbol = _symbol;
    delegationAddress = 0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED;
    delegatedTo = 0x939789ed3D07A80da886A3E3017d665cBb5591dC;
    ftsoManagerAddress = 0xbfA12e4E1411B62EdA8B035d71735667422A6A9e;
    SGBDelegatedDenominator = 1000;
    tokenRewardPerVPBPerDenominator = 7;
    vpBlocksToClaim = 3; //if not claimed after 3 voting power blocks
	isTransferable = false; //tokens are not transferable on start
  }

  //Setter Functions

  function setDelegationAddress(address _delegationAddress) external onlyOwner {
    delegationAddress = _delegationAddress;
  }

  function setDelegatedTo(address _delegatedTo) external onlyOwner {
    delegatedTo = _delegatedTo;
  }

  function setFTSOManagerAddress(address _FTSOManagerAddress) external onlyOwner {
    ftsoManagerAddress = _FTSOManagerAddress;
  }

  function setBlocksToClaim(uint8 _blocksToClaim) external onlyOwner {
    vpBlocksToClaim = _blocksToClaim;
  }

  function setRewardDenominator(uint256 _denominator) external onlyOwner {
    SGBDelegatedDenominator = _denominator;
  }

  function setTokenRewardPerDenominator(uint256 _tokenReward) external onlyOwner {
    tokenRewardPerVPBPerDenominator = _tokenReward;
  }

  function setTransferable(bool _isTransferable) external onlyOwner {
	  isTransferable = _isTransferable;
  }	
  
  function setBurnApproverAddress(address _newBurnApprover) external onlyOwner {
	  burnApprover = _newBurnApprover;
	  emit BurnApproverSet(_newBurnApprover);
  }


  //Override ERC20 Transfer and TransferFrom

  function transfer(address recipient, uint256 amount) public override returns (bool) {
	    require(isTransferable, "NFT points are not currently transferable");
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

  function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
		require(isTransferable, "NFT points are not currently transferable");
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = allowance(sender, _msgSender()); //_allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        return true;
    }

	//Burn Points when used - only burnApproverAddress can burn
	function burnPoints(address _accountToBurn, uint256 _amountToBurn) external {
		require(msg.sender == burnApprover);
		_burn(_accountToBurn, _amountToBurn);
		emit NFTPointsBurned(_accountToBurn, _amountToBurn);
	}


  //return bNFT tokens earned per voting power block
  function currentRewardRate(address _user) public view returns (uint256) {
  	Delegation delegationContract = Delegation(delegationAddress);
    uint256 currentDelegated = delegationContract.votePowerFromToAt(_user, delegatedTo, block.number);

    return (currentDelegated * tokenRewardPerVPBPerDenominator) / SGBDelegatedDenominator; //in wei
  }

  function rewardClaimableForBlock(address _user, uint256 _vpBlock) public view returns (uint256) {
    //if the user already claimed these rewards there's no use to calculate, claimable reward for block is 0
    if (vpBlockClaimed[_user][_vpBlock]) {
      return 0;
    }

  	Delegation delegationContract = Delegation(delegationAddress);
    uint256 delegatedAtBlock = delegationContract.votePowerFromToAt(_user, delegatedTo, _vpBlock);
    //This returns raw tokens delegated in wei

    return (delegatedAtBlock * tokenRewardPerVPBPerDenominator) / SGBDelegatedDenominator; //claimable reward in wei, 1e18 is 1 bNFT token
  }

  //calculate independently for each voting block because delegated amount/earn rate will be different
  function calculateClaimableRewards(address _user) external view returns (uint256) {
  	FTSOManager ftsoManagerContract = FTSOManager(ftsoManagerAddress);
    uint256 blocksToClaim;
    uint256 claimableReward;

    uint256 numEpochs = ftsoManagerContract.getCurrentRewardEpoch() + 1;
    uint256 mostCurrentBlock = ftsoManagerContract.getRewardEpochVotePowerBlock(numEpochs - 1);

    //if the current block has been claimed, return 0 since everything before will have been claimed or expired
    if (vpBlockClaimed[_user][mostCurrentBlock]) {
      return 0;
    }

    //either do the total number of epochs or the last vpBlocksToClaim
    if (numEpochs < vpBlocksToClaim) {
      blocksToClaim = numEpochs;
    } else {
      blocksToClaim = vpBlocksToClaim;
    }

    for (uint256 i = 0; i < blocksToClaim; i++) {
      uint256 blockToClaim = ftsoManagerContract.getRewardEpochVotePowerBlock(numEpochs - 1 - i);
      claimableReward += rewardClaimableForBlock(_user, blockToClaim);
    }

    return claimableReward;
  }

  function claimRewards() external {
  	FTSOManager ftsoManagerContract = FTSOManager(ftsoManagerAddress);
    uint256 numEpochs = ftsoManagerContract.getCurrentRewardEpoch() + 1;
    uint256 mostCurrentBlock = ftsoManagerContract.getRewardEpochVotePowerBlock(numEpochs - 1);
    require(!vpBlockClaimed[msg.sender][mostCurrentBlock], "Rewards Already Claimed For Current Voting Power Block");

    uint256 claimableRewards;
    uint256[] memory blocksToClaim = new uint256[](vpBlocksToClaim);
    uint256 index = 0;

    if (numEpochs < vpBlocksToClaim) {
      for (uint256 i = 0; i < numEpochs; i++) {
        uint256 blockToClaim = ftsoManagerContract.getRewardEpochVotePowerBlock(numEpochs - 1 - i);
        if (!vpBlockClaimed[msg.sender][blockToClaim]) {
          blocksToClaim[index] = blockToClaim;
          index++;
        }
      }
    } else {
      for (uint256 i = 0; i < vpBlocksToClaim; i++) {
        uint256 blockToClaim = ftsoManagerContract.getRewardEpochVotePowerBlock(numEpochs - 1 - i);
        if (!vpBlockClaimed[msg.sender][blockToClaim]) {
          blocksToClaim[index] = blockToClaim;
          index++;
        }
      }
    }

    //don't send a call for the unused portion of the array, only go through index
    for (uint256 i = 0; i < index; i++) {
      claimableRewards += rewardClaimableForBlock(msg.sender, blocksToClaim[i]);
      vpBlockClaimed[msg.sender][blocksToClaim[i]] = true;
    }
    //need to mint after calculating claimable
    _mint(msg.sender, claimableRewards);
	emit NFTPsClaimed(msg.sender, claimableRewards);
  }
}
