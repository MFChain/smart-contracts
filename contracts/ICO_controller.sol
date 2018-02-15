pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./MFC_coin.sol";
import "./ICO_crowdsale.sol";
import "./Holder.sol";

contract ICO_controller is Ownable {

    using SafeMath for uint256;
    // The token being sold
    MFC_Token public token = new MFC_Token();

    // add address for multisig!!
    address public holder;

    // list of buyer are able to participate in ICOs
    mapping(address => bool) public buyersWhitelist;

    // store each buyer spent ether
    mapping(address => uint256) public buyerSpent;

    // devs&advisors reward
    mapping(address => uint256) public devRewards;

    address incentiveProgram;

    WhitelistedCrowdsale public privateOffer;
    WhitelistedCrowdsale public preSale;
    WhitelistedCrowdsale public crowdsale;

    uint256 constant public PRIVATE_OFFER_SUPPLY = 7000000 * 1 ether;
    uint256 constant public PRE_SALE_SUPPLY = 36000000 * 1 ether;
    uint256 constant public CROWDSALE_SUPPLY = 237000000 * 1 ether;
    uint256 constant public SOFTCUP = 4720 * 1 ether;
    uint256 constant public MAX_DEV_REWARD = 40000000 * 1 ether;
    uint256 constant public INCENTIVE_PROGRAM_SUPPORT = 80000000 * 1 ether;
    uint256 constant public MARKETING_SUPPORT_SUPPLY = 100000000 * 1 ether;

    uint constant public Q3_2018_START_DATE = 1530403200; // 2018 07 01 
    uint constant public Q1_2019_START_DATE = 1546300800; // 2019 01 01 
    uint constant public Q2_2019_START_DATE = 1554076800; // 2019 04 01 
    uint constant public Q3_2019_START_DATE = 1561939200; // 2019 07 01 
    uint constant public Q4_2019_START_DATE = 1569888000; // 2019 10 01 
    uint public devRewardReleaseTime;
    uint[4] public unlockMarketingTokensTime;
    uint public unlockIndex;
    uint public releaseMarketingTokenAmount = MARKETING_SUPPORT_SUPPLY.div(4);

    uint256 public totalDevReward;
    uint256 public totalSold;

    bool public crowdsaleFinished;

    function ICO_controller(address _holder, address _incentive_program) {
        devRewardReleaseTime = Q3_2018_START_DATE + uint(block.blockhash(block.number - 1)) % 7948800;

        unlockMarketingTokensTime[0] = Q1_2019_START_DATE + uint(block.blockhash(block.number - 2)) % 7948800;
        unlockMarketingTokensTime[1] = Q2_2019_START_DATE + uint(block.blockhash(block.number - 3)) % 7948800;
        unlockMarketingTokensTime[2] = Q3_2019_START_DATE + uint(block.blockhash(block.number - 4)) % 7948800;
        unlockMarketingTokensTime[3] = Q4_2019_START_DATE + uint(block.blockhash(block.number - 5)) % 7948800;
        holder = _holder;
        incentiveProgram = _incentive_program;
    }

    function () payable {}

    modifier onlyIco() {
        require(msg.sender == address(privateOffer) || msg.sender == address(preSale) || msg.sender == address(crowdsale));
        _;
    }

    function addBuyerToWhitelist(address _buyer) public onlyOwner returns (bool success) {
        require(_buyer != address(0));
        buyersWhitelist[_buyer] = true;
        return true;
    }

    function removeBuyerFromWhitelist(address _buyer) public onlyOwner returns (bool success) {
        if (buyersWhitelist[_buyer] == true) {
        buyersWhitelist[_buyer] = false;
        return true;
        }
        return false;
    }

    function addBuyers(address[] _buyers) external onlyOwner returns (bool success) {
        for (uint i = 0; i < _buyers.length; i++) {
            addBuyerToWhitelist(_buyers[i]);
        }
        return true;
    }

    function removeBuyers(address[] _buyers) external onlyOwner returns (bool success) {
        for (uint i = 0; i < _buyers.length; i++) {
            removeBuyerFromWhitelist(_buyers[i]);
        }
        return true;
    }

    function isAddressWhitelisted(address buyer) external returns (bool isWhitelisted) {
        return buyersWhitelist[buyer];
    }

    // Adds Devs Token Reward
    function addDevReward(address _devAddress, uint256 _amount) public onlyOwner returns (bool success) {
        require(MAX_DEV_REWARD.sub(totalDevReward) >= _amount);
        require(_devAddress != address(0));
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

    // Create Privaet Offer Sale NOTE: should think about hardwritten rate or parametrized!!!!
    function startPrivateOffer(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
        require(address(privateOffer) == address(0));
        privateOffer = new WhitelistedCrowdsale(_startTime, _endTime, _rate, address(this), token);
        token.transfer(address(privateOffer), PRIVATE_OFFER_SUPPLY);
    }

    // Create PreSale ICO
    function startPreSaleIco(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
        require(address(privateOffer) != address(0));
        require(address(preSale)== address(0));
        require(privateOffer.hasEnded() == true);
        preSale = new WhitelistedCrowdsale(_startTime, _endTime, _rate, address(this), token);
        token.transfer(address(preSale), PRE_SALE_SUPPLY);
        privateOffer.burnRemainingTokens();
    }

    // Create Crowdsale
    function startCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
        require(address(preSale) != address(0));
        require(address(crowdsale) == address(0));
        require(preSale.hasEnded() == true);
        crowdsale = new WhitelistedCrowdsale(_startTime, _endTime, _rate, address(this), token);
        token.transfer(address(crowdsale), CROWDSALE_SUPPLY);
        preSale.burnRemainingTokens();
    }

    function finishCrowdsale() external onlyOwner {
        require(address(crowdsale) != address(0));
        require(crowdsale.hasEnded() == true);
        require(crowdsaleFinished == false);
        crowdsale.burnRemainingTokens();
        uint256 totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised().add(crowdsale.getWeiRaised()));
        if (totalSold >= SOFTCUP) {
            token.transfer(incentiveProgram, INCENTIVE_PROGRAM_SUPPORT);
            // sends token for support program
            token.burn(MAX_DEV_REWARD.sub(totalDevReward));
            // burn some unspent reward tokens
            owner.transfer(this.balance.div(2));
            // send 50% of ico eth to contract onwer
            address(holder).transfer(this.balance);
            // send other 50% to multisig holder address
        }
        crowdsaleFinished = true;

    }

    // Count each buyer spent amount in case ICO wuoldn't reach SOFTCUP
    function addBuyerSpent(address _buyer, uint256 _amount) external onlyIco {
        buyerSpent[_buyer] = buyerSpent[_buyer].add(_amount);
    }

    function refund() external returns (bool success) {
        require(address(crowdsale) != address(0));
        require(crowdsale.hasEnded());
        if (totalSold == 0) {
            totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised().add(crowdsale.getWeiRaised()));
        }
        require(totalSold < SOFTCUP);
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
        require(unlockIndex < 4);
        require(unlockMarketingTokensTime[unlockIndex] < now);
        uint256 amount = releaseMarketingTokenAmount;
        // It is needed to prevent DAO vulnerability that allows owner get all tokens for once.
        releaseMarketingTokenAmount = 0;
        token.transfer(owner, amount);
        releaseMarketingTokenAmount = amount;
        unlockIndex++;
    }
}