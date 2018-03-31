pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./MFC_coin.sol";
import "./ICO_crowdsale.sol";

interface TransferableInterface {
    function isTransferable(address _sender) external returns(bool);
}

contract ICO_controller is Ownable, TransferableInterface {

    using SafeMath for uint256;
    // The token being sold
    MFC_Token public token = new MFC_Token();

    // add address for multisig!!
    address public holder;

    // list of buyer are able to participate in ICOs
    mapping(address => bool) public buyersWhitelist;

    // list of addresses that could send tokens
    mapping(address => bool) public sendersWhitelist;

    // list of addresses accepted to airdrop
    mapping(address => bool) public airdropList;

    // store each buyer spent ether
    mapping(address => uint256) public buyerSpent;

    // devs&advisors reward
    mapping(address => uint256) public devRewards;

    address public incentiveProgram;
    address public escrowIco;

    WhitelistedCrowdsale public privateOffer;
    WhitelistedCrowdsale public preSale;
    WhitelistedCrowdsale public crowdsale;

    uint256 constant public PRIVATE_OFFER_SUPPLY = 42000 * 1 ether;
    uint256 constant public PRE_SALE_SUPPLY = 50750 * 1 ether;
    uint256 constant public CROWDSALE_SUPPLY = 208250 * 1 ether;
    uint256 constant public SOFTCAP = 3 * 1 ether;
    uint256 constant public MAX_DEV_REWARD = 40000 * 1 ether;
    uint256 constant public INCENTIVE_PROGRAM_SUPPORT = 75000 * 1 ether;
    uint256 constant public MARKETING_SUPPORT_SUPPLY = 100000 * 1 ether;
    uint256 constant public AIRDROP_SUPPLY = 5000 * 1 ether;

    uint constant public Q3_2018_START_DATE = 1530403200; // 2018 07 01  
    uint constant public Q2_2019_START_DATE = 1554076800; // 2019 04 01 
    uint constant public Q2_2020_START_DATE = 1585699200; // 2020 04 01

    uint public devRewardReleaseTime;
    uint[2] public unlockMarketingTokensTime;
    uint public unlockIndex = 0;

    uint256 public releaseMarketingTokenAmount = MARKETING_SUPPORT_SUPPLY.div(2);

    uint256 public totalDevReward;
    uint256 public totalSold;
    uint256 public airdropSpent;

    bool public crowdsaleFinished;

    function ICO_controller(address _holder, address _escrowIco) {
        require(_holder!=address(0));
        require(_escrowIco!=address(0));
        devRewardReleaseTime = now;

        //sets random date for unlock marketing support tokens during Q2 of 2019 and 2020 years
        unlockMarketingTokensTime[0] = now;
        unlockMarketingTokensTime[1] = now;

        holder = _holder;
        escrowIco = _escrowIco;
    }

    function () payable {}

    function isICO(address _check) returns (bool) {
        return _check == address(privateOffer) || _check == address(preSale) || _check == address(crowdsale);
    }

    modifier onlyIco() {
        require(isICO(msg.sender));
        _;
    }

    function setIncentiveProgram(address _incentive_program) public onlyOwner {
        require(incentiveProgram==address(0));
        incentiveProgram = _incentive_program;
    }

    function addToSendersWhitelist(address[] _senders) public onlyOwner {
        for(uint i = 0; i < _senders.length; i++){
            require(_senders[i] != address(0));
            sendersWhitelist[_senders[i]] = true;
        }        
    }

    function removeFromSendersWhitelist(address[] _senders) public onlyOwner {
        for(uint i = 0; i < _senders.length; i++){
            require(_senders[i] != address(0));
            delete sendersWhitelist[_senders[i]];
        }
    }

    function addBuyers(address[] _buyers) external onlyOwner {
        for (uint i = 0; i < _buyers.length; i++) {
            require(_buyers[i] != address(0));
            buyersWhitelist[_buyers[i]] = true;
        }
    }

    function removeBuyers(address[] _buyers) external onlyOwner {
        for (uint i = 0; i < _buyers.length; i++) {
            delete buyersWhitelist[_buyers[i]];
        }
    }

    function isAddressWhitelisted(address buyer) external returns (bool isWhitelisted) {
        return buyersWhitelist[buyer];
    }

    // Adds Devs Token Reward
    function addDevReward(address _devAddress, uint256 _amount) public onlyOwner returns (bool success) {
        require(MAX_DEV_REWARD.sub(totalDevReward) >= _amount);
        require(_devAddress != address(0));
        require(crowdsaleFinished == false);
        totalDevReward = totalDevReward.add(_amount);
        devRewards[_devAddress] = devRewards[_devAddress].add(_amount);
        return true;
    }

    function addRewards(address[] _devAddresses, uint256[] _amounts) external onlyOwner returns (bool success) {
        require(_devAddresses.length == _amounts.length);
        for (uint i = 0; i < _amounts.length; i++) {
            addDevReward(_devAddresses[i], _amounts[i]);
        }
        return true;
    }

    function startIco(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _min, uint256 _max, bool _countPurchaseAmount) internal returns (WhitelistedCrowdsale){
        return startIco(_startTime, _endTime, _rate, _min,_max, address(this), _countPurchaseAmount);
    }

    function startIco(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _min, uint256 _max, address _escrow, bool _countPurchaseAmount) internal returns (WhitelistedCrowdsale){
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_rate > 0);
        return new WhitelistedCrowdsale(_startTime, _endTime, _rate, _min,_max, _escrow, token, _countPurchaseAmount);
    }

    // Create Privaet Offer Sale NOTE: should think about hardwritten rate or parametrized!!!!
    function startPrivateOffer(uint256 _startTime, uint256 _endTime, address _escrow) external onlyOwner {
        require(address(privateOffer) == address(0));
        require(_escrow != address(0));
        privateOffer = startIco(_startTime, _endTime, 12000, 0.1 ether, 200 ether, _escrow, true);
        token.transfer(address(privateOffer), PRIVATE_OFFER_SUPPLY);
    }

    // Create PreSale ICO
    function startPreSaleIco(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(address(privateOffer) != address(0));
        require(address(preSale)== address(0));
        require(privateOffer.hasEnded() == true);
        preSale = startIco(_startTime, _endTime, 10150, 0.1 ether, 200 ether, false);
        token.transfer(address(preSale), PRE_SALE_SUPPLY);
        privateOffer.burnRemainingTokens();
    }

    // Create Crowdsale
    function startCrowdsale(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(address(preSale) != address(0));
        require(address(crowdsale) == address(0));
        require(preSale.hasEnded() == true);
        crowdsale = startIco(_startTime, _endTime, 8500, 0.1 ether, 200 ether, false);
        token.transfer(address(crowdsale), CROWDSALE_SUPPLY);
        preSale.burnRemainingTokens();
    }

    function finishCrowdsale() external onlyOwner {
        require(address(crowdsale) != address(0));
        require(crowdsale.hasEnded() == true);
        require(crowdsaleFinished == false);
        require(incentiveProgram != address(0));
        crowdsale.burnRemainingTokens();
        totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised().add(crowdsale.getWeiRaised()));
        if (totalSold >= SOFTCAP) {
            // sends token for support program
            bool success = token.transfer(incentiveProgram, INCENTIVE_PROGRAM_SUPPORT);
            assert(success==true);
            // send 50% of ico eth to contract onwer
            escrowIco.transfer(this.balance.div(2));
            // send other 50% to multisig holder address
            holder.transfer(this.balance);
        }
        crowdsaleFinished = true;

    }

    function finishCrowdsaleBurnUnused() external onlyOwner {
        require(crowdsaleFinished == true);
        
        // // burn some unspent reward tokens
        uint256 unspendDevReward = MAX_DEV_REWARD.sub(totalDevReward);
        uint256 controllerAvaibleBalance = token.balanceOf(address(this));
        controllerAvaibleBalance = controllerAvaibleBalance.sub(MARKETING_SUPPORT_SUPPLY);
        
        if (unspendDevReward != 0 && controllerAvaibleBalance >= unspendDevReward) {
            token.burn(unspendDevReward);
            controllerAvaibleBalance = controllerAvaibleBalance.sub(unspendDevReward);
        }
        // burn after airdrop left tokens
        uint256 airdropToBurn = AIRDROP_SUPPLY.sub(airdropSpent);
        if (airdropToBurn != 0 && controllerAvaibleBalance >= airdropToBurn){
            token.burn(airdropToBurn);
        }
    }

    // Count each buyer spent amount in case ICO wouldn't reach SOFTCAP
    function addBuyerSpent(address _buyer, uint256 _amount) external onlyIco {
        buyerSpent[_buyer] = buyerSpent[_buyer].add(_amount);
    }

    function refund() external returns (bool success) {
        require(address(crowdsale) != address(0));
        require(crowdsale.hasEnded());
        if (totalSold == 0) {
            totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised()).add(crowdsale.getWeiRaised());
        }
        require(totalSold < SOFTCAP);
        require(buyerSpent[msg.sender] > 0);
        uint256 amount = buyerSpent[msg.sender];
        buyerSpent[msg.sender] = 0;
        msg.sender.transfer(amount);
        return true;

    }

    function getDevReward() external {
        require(devRewardReleaseTime < now);
        uint256 amount = devRewards[msg.sender];
        devRewards[msg.sender] = 0;
        token.transfer(msg.sender, amount);
    }

    function getLockedMarketingTokens() onlyOwner external {
        require(unlockIndex < 2);
        require(unlockMarketingTokensTime[unlockIndex] < now);
        uint256 amount = releaseMarketingTokenAmount;
        // It is needed to prevent DAO vulnerability that allows owner get all tokens for once.
        releaseMarketingTokenAmount = 0;
        token.transfer(owner, amount);
        releaseMarketingTokenAmount = amount;
        unlockIndex++;
    }

    function increasePrivateOfferEndTime(uint256 _endTime) external onlyOwner {
        require(privateOffer != address(0));
        privateOffer.increaseEndTime(_endTime);
    }

    function isTransferable(address _sender) external returns(bool) {
        if(crowdsaleFinished || isICO(_sender) || sendersWhitelist[_sender] || _sender == address(this)){
            return true;
        }
        return false;
    }

    function sendAirdrop(address[] _addresses, uint256[] _amounts) external onlyOwner {
        require(_addresses.length == _amounts.length);
        for(uint i = 0; i < _addresses.length; i++){
            airdropSpent = airdropSpent.add(_amounts[i]);
            require(AIRDROP_SUPPLY >= airdropSpent);
            require(_addresses[i] != address(0));
            token.transfer(_addresses[i], _amounts[i]);
        }
    }
}