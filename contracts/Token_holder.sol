pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./MFC_coin.sol";
import "./multiowned.sol";
import "./Receiver_Interface.sol";


contract TokenHolder is multiowned, ERC223Receiver {
    using SafeMath for uint256;
    // All ICOs finished flag
    bool public activatedEscrow = false;

    MFC_Token public token;

    function TokenHolder(address[] _owners, uint _required, MFC_Token _token) multiowned(_owners, _required) {
        token = _token;
    }

    function escrowTokensTo(address escrowAddress) external onlymanyowners(sha3(msg.data)) returns (bool success){
        token.transfer(escrowAddress, token.balanceOf(address(this)));
    }

}