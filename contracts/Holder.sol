pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./MFC_coin.sol";
import "./multiowned.sol";




contract Holder is multiowned {
	using SafeMath for uint256;
	// All ICOs finished flag
	bool public activatedEscrow = false;

	address escrowAddress;


	function Holder(address[] _owners, uint _required, address _escrowAddress) multiowned(_owners, _required) {
		escrowAddress = _escrowAddress;
    }

	// ICO controller activates this function after all ICOs finished
	function activateEscrow() external onlycreator{
		activateEscrow = true;
	}

	function escrowFirstStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
		escrowAddress.transfer(this.balance.mul(6).div(10)); //escrow 60% of got 50%
		return true;
	}

	function escrowSecondStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
		escrowAddress.transfer(this.balance); //escrow remaning 40%
		return true;
	}





}