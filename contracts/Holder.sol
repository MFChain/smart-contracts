pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./multiowned.sol";


contract Holder is multiowned {
    using SafeMath for uint256;

    address escrowAddress;


    function Holder(address[] _owners, uint _required, address _escrowAddress) multiowned(_owners, _required) {
        escrowAddress = _escrowAddress;
    }

    function () payable {}

    function escrowFirstStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
        escrowAddress.transfer(this.balance.mul(6).div(10));
        //escrow 60% of got 50%
        return true;
    }

    function escrowSecondStage() external onlymanyowners(sha3(msg.data)) returns (bool success){
        escrowAddress.transfer(this.balance);
        //escrow remaning 40%
        return true;
    }

    function changeEscrowAddress(address _newAddress) external onlymanyowners(sha3(msg.data)) returns (bool success) {
        escrowAddress = _newAddress;
    }


}