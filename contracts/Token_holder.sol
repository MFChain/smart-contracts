pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./MFC_coin.sol";
import "./multiowned.sol";
import "./Receiver_Interface.sol";


contract TokenHolder is multiowned, ERC223Receiver {
    using SafeMath for uint256;

    MFC_Token public token;

    function TokenHolder(address[] _owners, uint _required, address _token) multiowned(_owners, _required) {
        token = MFC_Token(_token);
    }

    function escrowTokensTo(address escrowAddress) external onlymanyowners(sha3(msg.data)) returns (bool success){
        token.transfer(escrowAddress, token.balanceOf(address(this)));
    }

}