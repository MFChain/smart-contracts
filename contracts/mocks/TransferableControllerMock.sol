pragma solidity ^0.4.19;

import "./../MFC_coin.sol";
import "./../ICO_controller.sol";

contract TransferableControllerMock is TransferableInterface {

    MFC_Token public token = new MFC_Token();

    function isTransferable(address _sender) external returns(bool) {
        return true;
    }

    function sendAllTokensTo(address _to) external {
        token.transfer(_to, token.balanceOf(address(this)));
    }
}
