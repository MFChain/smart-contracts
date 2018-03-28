pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./multiowned.sol";


contract Holder is multiowned {
    using SafeMath for uint256;

    address public escrowAddress;
    bool private isEscrowFirstStage;


    function Holder(address[] _owners, uint _required, address _escrowAddress) multiowned(_owners, _required) {
        escrowAddress = _escrowAddress;
        isEscrowFirstStage = false;
    }

    function () payable {}

    function escrowFirstStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
        escrowAddress.transfer(this.balance.mul(6).div(10));
        isEscrowFirstStage = true;
        //escrow 60% of got 50%
        return true;
    }

    function escrowSecondStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
        require(isEscrowFirstStage);
        escrowAddress.transfer(this.balance);
        //escrow remaning 40%
        return true;
    }

    function changeEscrowAddress(address _newAddress) external onlymanyowners(sha3(msg.data)) returns (bool success) {
        escrowAddress = _newAddress;
    }


}