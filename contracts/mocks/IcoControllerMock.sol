pragma solidity ^0.4.19;

import "./../ICO_controller.sol";


contract IcoControllerMock is ICO_controller {

    function IcoControllerMock(address _holder, address _escrowIco) ICO_controller(_holder, _escrowIco) {}

    function setDevRewardReleaseTime(uint time) external {
        devRewardReleaseTime = time;
    }
}