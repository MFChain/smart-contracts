pragma solidity ^0.4.19;

import "./../ICO_controller.sol";


contract IcoControllerMock is ICO_controller {

    function IcoControllerMock(address _holder, address _escrowIco) ICO_controller(_holder, _escrowIco) {}

    function setDevRewardReleaseTime(uint time) external {
        devRewardReleaseTime = time;
    }

    function setUnlockMarketingTokensTime(uint time1, uint time2) external {
        unlockMarketingTokensTime[0] = time1;
        unlockMarketingTokensTime[1] = time2;
    }
}
