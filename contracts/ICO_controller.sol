pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./MFC_coin.sol";
import "./ICO_crowdsale.sol";
import "./Holder.sol";

contract ICO_controller is Ownable{

	using SafeMath for uint256;
    // The token being sold
    MFC_Token public token = new MFC_Token();

    // add address for multisig!!
    Holder holder = new Holder([0x123, 0x123, 0x123], 3);

    // list of buyer are able to participate in ICOs
    mapping(address=>bool) public buyersWhitelist;

    // store each buyer spent ether
    mapping(address=>uint256) public buyerSpent;

    // devs&advisors reward
    mapping(address=>uint256) public devRewards;

    address incentiveProgramAddress = address(0); // TODO

    WhitelistedCrowdsale public privateOffer;
    WhitelistedCrowdsale public preSale;
    WhitelistedCrowdsale public crowdsale;

    uint256 public PRIVATE_OFFER_SUPPLY = 7000000 * 1 ether;
    uint256 public PRE_SALE_SUPPLY = 36000000 * 1 ether;
    uint256 public CROWDSALE_SUPPLY = 237000000 * 1 ether;
    uint256 public SOFTCUP = 4720 * 1 ether;
    uint256 public MAX_DEV_REWARD = 40000000 * 1 ether;
    uint256 public INCENTIVE_PROGRAM_SUPPORT = 80000000 * 1 ether;

    uint256 public totalDevReward;

    bool public crowdsaleFinished;

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
    	require(_buyer != address(0));
    	buyersWhitelist[_buyer] = false;
    	return true;
    }

    function addBuyers(address[] _buyers) external onlyOwner returns (bool success) {
    	for(uint i=0; i < _buyers.length; i++){
            addBuyerToWhitelist(_buyers[i]);
        }
        return true;
    }

    function removeBuyers(address[] _buyers) external onlyOwner {
    	for(uint i=0; i < _buyers.length; i++){
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
    	for(uint i=0; i < _amounts.length; i++){
    		addDevReward(_devAddresses[i], _amounts[i]);
    	}
    	return true;
    }

    // Create Privaet Offer Sale NOTE: should think about hardwritten rate or parametrized!!!!
    function startPrivateOffer(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
    	privateOffer = new WhitelistedCrowdsale(_startTime, _endTime, _rate, address(this), token);
    	token.transfer(address(privateOffer), PRIVATE_OFFER_SUPPLY);
    }

    // Create PreSale ICO
    function startPreSaleIco(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
    	require(address(privateOffer) != address(0));
    	require(privateOffer.hasEnded() == true);
    	preSale = new WhitelistedCrowdsale(_startTime, _endTime, _rate, address(this), token);
    	token.transfer(address(preSale), PRE_SALE_SUPPLY);
    	privateOffer.burnRemainingTokens();
    }

    // Create Crowdsale
    function startCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate) external onlyOwner {
    	require(address(preSale) != address(0));
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
    		token.transfer(incentiveProgramAddress, INCENTIVE_PROGRAM_SUPPORT);
    		token.burn(MAX_DEV_REWARD.sub(totalDevReward));
    		owner.transfer(this.balance.div(2));
    		address(holder).transfer(this.balance);
    		holder.activateEscrow();    		
    	}
    	crowdsaleFinished = true;
    	    	
    }

    // Count each buyer spent amount in case ICO wuoldn't reach SOFTCUP
    function addBuyerSpent(address _buyer, uint256 _amount) external onlyIco {
    	buyerSpent[_buyer] = buyerSpent[_buyer].add(_amount);
    }

    function refund() external returns(bool success) {
    	require(address(crowdsale) != address(0));
    	require(crowdsale.hasEnded());
    	uint256 totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised().add(crowdsale.getWeiRaised()));
    	require(totalSold < SOFTCUP);
		uint256 amount = buyerSpent[msg.sender];
		buyerSpent[msg.sender] = 0;
		msg.sender.transfer(amount);
		return true;

    }

    //TODO add Randow date check
    function getDevReward() external {
    	uint256 amount = devRewards[msg.sender];
    	devRewards[msg.sender] = 0;
    	token.transfer(msg.sender, amount);
    }
}