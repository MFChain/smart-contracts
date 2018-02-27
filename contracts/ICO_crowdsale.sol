pragma solidity ^0.4.19;


import "./MFC_coin.sol";
import "./ICO_controller.sol";
import "./SafeMath.sol";
import "./Ownable.sol";
import "./Receiver_Interface.sol";



/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive. The contract requires a MintableToken that will be
 * minted as contributions arrive, note that the crowdsale contract
 * must be owner of the token in order to be able to mint it.
 */
contract WhitelistedCrowdsale is Ownable, ERC223Receiver {
    using SafeMath for uint256;

    // The token being sold
    MFC_Token public token;

    // start and end timestamps where investments are allowed (both inclusive)
    uint256 public startTime;
    uint256 public endTime;

    // address where funds are collected
    address public wallet;

    // how many token units a buyer gets per wei
    uint256 public rate;

    // amount of raised money in wei
    uint256 public weiRaised;

    ICO_controller private controller;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);


    function WhitelistedCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, MFC_Token _token) public {
        startTime = _startTime;
        endTime = _endTime;
        rate = _rate;
        wallet = _wallet;
        token = _token;
        controller = ICO_controller(msg.sender);
    }

    // fallback function can be used to buy tokens
    function() external payable {
        buyTokens(msg.sender);
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != address(0));
        require(validPurchase());


        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = getTokenAmount(weiAmount);

        // get avaible for crowdsale token balance
        uint256 avaibleTokenToSell = token.balanceOf(address(this));
        require(tokens <= avaibleTokenToSell);


        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.transfer(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
        forwardFunds(weiAmount);
        controller.addBuyerSpent(msg.sender, weiAmount);
    }

    // @return true if crowdsale event has ended
    function hasEnded() external view returns (bool) {
        return now > endTime;
    }

    // Override this method to have a way to add business logic to your crowdsale when buying
    function getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        uint256 basicAmount = weiAmount.mul(rate);
        uint256 bonusAmount = 0;
        if (weiAmount < 10 ether) {

        } else if (weiAmount < 25 ether) {
            bonusAmount = basicAmount.div(10);
            // 10%
        } else if (weiAmount < 100 ether) {
            bonusAmount = basicAmount.mul(15).div(100);
            // 15%
        } else {
            bonusAmount = basicAmount.div(5);
            // 20%
        }
        return basicAmount.add(bonusAmount);

    }

    // send ether to the fund collection wallet
    // override to create custom fund forwarding mechanisms
    function forwardFunds(uint256 weiAmount) internal {
        wallet.transfer(weiAmount);
    }

    // @return true if the transaction can buy tokens
    function validPurchase() internal view returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        bool isWhitelisted = controller.isAddressWhitelisted(msg.sender);
        return withinPeriod && nonZeroPurchase && isWhitelisted;
    }

    function burnRemainingTokens() external onlyOwner {
        token.burnAll();
    }

    function getWeiRaised() external returns (uint256){
        return weiRaised;
    }

}