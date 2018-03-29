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

    uint256 constant public PRIVATE_OFFER_SUPPLY = 42000000 * 1 ether;
    uint256 constant public PRE_SALE_SUPPLY = 50750000 * 1 ether;
    uint256 constant public CROWDSALE_SUPPLY = 208250000 * 1 ether;
    uint256 constant public SOFTCAP = 4720 * 1 ether;
    uint256 constant public MAX_DEV_REWARD = 40000000 * 1 ether;
    uint256 constant public INCENTIVE_PROGRAM_SUPPORT = 75000000 * 1 ether;
    uint256 constant public MARKETING_SUPPORT_SUPPLY = 100000000 * 1 ether;
    uint256 constant public AIRDROP_SUPPLY = 5000000 * 1 ether;

    uint constant public Q3_2018_START_DATE = 1530403200; // 2018 07 01  
    uint constant public Q2_2019_START_DATE = 1554076800; // 2019 04 01 
    uint constant public Q2_2020_START_DATE = 1585699200; // 2020 04 01

    uint public devRewardReleaseTime;
    uint[2] public unlockMarketingTokensTime;
    uint public unlockIndex = 0;

    uint256 public releaseMarketingTokenAmount = MARKETING_SUPPORT_SUPPLY.div(2);

    uint256 public totalDevReward;
    uint256 public totalSold;
    uint256 public totalAirdropAdrresses;

    bool public crowdsaleFinished;

    function ICO_controller(address _holder, address _escrowIco) {
        require(_holder!=address(0));
        require(_escrowIco!=address(0));
        devRewardReleaseTime = Q3_2018_START_DATE + (uint(block.blockhash(block.number - 1)) % 7948800);

        //sets random date for unlock marketing support tokens during Q2 of 2019 and 2020 years
        unlockMarketingTokensTime[0] = Q2_2019_START_DATE + (uint(block.blockhash(block.number - 2)) % 7948800);
        unlockMarketingTokensTime[1] = Q2_2020_START_DATE + (uint(block.blockhash(block.number - 3)) % 7948800);

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

    function addBuyerToWhitelist(address _buyer) public onlyOwner returns (bool success) {
        assert(_buyer != address(0));
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
 
    function addAirdrop(address[] _airdropAddresses) external onlyOwner returns (bool success) {
        require(crowdsaleFinished==false);
        for(uint i = 0; i < _airdropAddresses.length; i++) {
            require(_airdropAddresses[i] != address(0));
            if(airdropList[_airdropAddresses[i]] == false){
                airdropList[_airdropAddresses[i]] = true;
                totalAirdropAdrresses = totalAirdropAdrresses.add(1);
            }
            
        }
        return true;
    }

    function removeAirdrop(address[] _airdropAddresses) external onlyOwner returns (bool success) {
        require(crowdsaleFinished==false);
        for(uint i = 0; i < _airdropAddresses.length; i++) {
            if(airdropList[_airdropAddresses[i]] == true){
                airdropList[_airdropAddresses[i]] = false;
                totalAirdropAdrresses = totalAirdropAdrresses.sub(1);
            }            
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
        privateOffer = startIco(_startTime, _endTime, 12000, 0 ether, 200 ether, _escrow, true);
        token.transfer(address(privateOffer), PRIVATE_OFFER_SUPPLY);
    }

    // Create PreSale ICO
    function startPreSaleIco(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(address(privateOffer) != address(0));
        require(address(preSale)== address(0));
        require(privateOffer.hasEnded() == true);
        preSale = startIco(_startTime, _endTime, 10150, 0 ether, 200 ether, false);
        token.transfer(address(preSale), PRE_SALE_SUPPLY);
        privateOffer.burnRemainingTokens();
    }

    // Create Crowdsale
    function startCrowdsale(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(address(preSale) != address(0));
        require(address(crowdsale) == address(0));
        require(preSale.hasEnded() == true);
        crowdsale = startIco(_startTime, _endTime, 8500, 0 ether, 200 ether, false);
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
            // burn some unspent reward tokens
            token.burn(MAX_DEV_REWARD.sub(totalDevReward));
            // burn after airdrop left tokens
            if (totalAirdropAdrresses != 0) {
               uint256 airdropToBurn = AIRDROP_SUPPLY.sub(AIRDROP_SUPPLY.div(totalAirdropAdrresses).mul(totalAirdropAdrresses));
                if (airdropToBurn != 0){
                    token.burn(airdropToBurn);
                } 
            } else {
                token.burn(AIRDROP_SUPPLY);
            }
            // send 50% of ico eth to contract onwer
            escrowIco.transfer(this.balance.div(2));
            // send other 50% to multisig holder address
            holder.transfer(this.balance);
        }
        crowdsaleFinished = true;

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

    function getAirdropTokens() external {
        require(airdropList[msg.sender]);
        airdropList[msg.sender] = false;
        token.transfer(msg.sender, AIRDROP_SUPPLY.div(totalAirdropAdrresses));
    }

    function increasePrivateOfferEndTime(uint256 _endTime) external onlyOwner {
        require(privateOffer != address(0));
        privateOffer.increaseEndTime(_endTime);
    }

    function isTransferable(address _sender) external returns(bool) {
        if(crowdsaleFinished || isICO(_sender) || _sender == address(this)){
            return true;
        }
        return false;
    }
}