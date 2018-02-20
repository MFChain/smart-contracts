pragma solidity ^0.4.19;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

    /**
    * @dev Multiplies two numbers, throws on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    /**
    * @dev Integer division of two numbers, truncating the quotient.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    /**
    * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    /**
    * @dev Adds two numbers, throws on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;


    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    function Ownable() public {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

}


/*
* Contract that is working with ERC223 tokens
*/

contract ERC223Receiver {

    struct TKN {
        address sender;
        uint value;
        bytes data;
        bytes4 sig;
    }

    // Override this function to have working tokenFallback
    function tokenFallback(address _from, uint _value, bytes _data) public pure returns (bool ok) {
        // TKN memory tkn;
        // tkn.sender = _from;
        // tkn.value = _value;
        // tkn.data = _data;
        // uint32 u = uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24);
        // tkn.sig = bytes4(u);

        /* tkn variable is analogue of msg variable of Ether transaction
        *  tkn.sender is person who initiated this token transaction   (analogue of msg.sender)
        *  tkn.value the number of tokens that were sent   (analogue of msg.value)
        *  tkn.data is data of token transaction   (analogue of msg.data)
        *  tkn.sig is 4 bytes signature of function
        *  if data of token transaction is a function execution
        */
        return true;
    }
}


/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
    uint256 public totalSupply;

    function balanceOf(address who) public constant returns (uint256);

    function transfer(address to, uint256 value) public returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) public constant returns (uint256);

    function transferFrom(address from, address to, uint256 value) public returns (bool);

    function approve(address spender, uint256 value) public returns (bool);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
contract BasicToken is ERC20Basic {
    using SafeMath for uint256;

    mapping(address => uint256) balances;

    /**
    * @dev transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);
        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev Gets the balance of the specified address.
     * @param _owner The address to query the the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address _owner) public constant returns (uint256 balance) {
        return balances[_owner];
    }
}

/** 
 * @title Standard ERC20 token 
 * 
 * @dev Implementation of the basic standard token. 
 * @dev https://github.com/ethereum/EIPs/issues/20 
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol 
 */
contract StandardToken is ERC20, BasicToken {

    mapping(address => mapping(address => uint256)) internal allowed;

    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     *
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param _owner address The address which owns the funds.
     * @param _spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    /**
     * approve should be called when allowed[_spender] == 0. To increment
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined) * From MonolithDAO Token.sol
     */
    function increaseApproval(address _spender, uint _addedValue) public returns (bool success) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool success) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function() public payable {
        revert();
    }

}


 /*
  ERC223 additions to ERC20

  Interface wise is ERC20 + data paramenter to transfer and transferFrom.
 */

contract ERC223 is ERC20 {
  function transfer(address to, uint value, bytes data) returns (bool ok);
  function transferFrom(address from, address to, uint value, bytes data) returns (bool ok);
}


contract Standard223Token is ERC223, StandardToken {
    //function that is called when a user or another contract wants to transfer funds
    function transfer(address _to, uint _value, bytes _data) returns (bool success) {
        //filtering if the target is a contract with bytecode inside it
        if (!super.transfer(_to, _value)) throw;
        // do a normal token transfer
        if (isContract(_to)) return contractFallback(msg.sender, _to, _value, _data);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value, bytes _data) returns (bool success) {
        if (!super.transferFrom(_from, _to, _value)) throw;
        // do a normal token transfer
        if (isContract(_to)) return contractFallback(_from, _to, _value, _data);
        return true;
    }

    function transfer(address _to, uint _value) returns (bool success) {
        return transfer(_to, _value, new bytes(0));
    }

    function transferFrom(address _from, address _to, uint _value) returns (bool success) {
        return transferFrom(_from, _to, _value, new bytes(0));
    }

    //function that is called when transaction target is a contract
    function contractFallback(address _origin, address _to, uint _value, bytes _data) private returns (bool success) {
        ERC223Receiver reciever = ERC223Receiver(_to);
        return reciever.tokenFallback(msg.sender, _value, _data);
    }

    //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    function isContract(address _addr) private returns (bool is_contract) {
        // retrieve the size of the code on target address, this needs assembly
        uint length;
        assembly {length := extcodesize(_addr)}
        return length > 0;
    }

}


/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract BurnableToken is Standard223Token {

    /**
     * @dev Burns a specific amount of tokens.
     * @param _value The amount of token to be burned.
     */
    function burn(uint _value) public {
        require(_value > 0);
        require(_value <= balances[msg.sender]);
        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(burner, _value);
    }

    function burnAll() public {
        address burner = msg.sender;
        totalSupply = totalSupply.sub(balances[burner]);
        Burn(burner, balances[burner]);
        balances[burner] = 0;
    }

    event Burn(address indexed burner, uint indexed value);

}


contract MFC_Token is BurnableToken {

    string public constant name = "MFC Coin Token";

    string public constant symbol = "MFC";

    uint32 public constant decimals = 18;

    uint256 public INITIAL_SUPPLY = 500000000 * 1 ether;

    function MFC_Token() {
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }

}

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
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_rate > 0);
        require(_wallet != address(0));
        require(_token != address(0));

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
        if (weiAmount < 5 ether) {

        } else if (weiAmount < 10 ether) {
            bonusAmount = basicAmount.div(10);
            // 10%
        } else if (weiAmount < 25 ether) {
            bonusAmount = basicAmount.mul(15).div(100);
            // 15%
        } else if (weiAmount < 100 ether) {
            bonusAmount = basicAmount.mul(17).div(100);
            // 17%
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

    function getWeiRaised() external returns (uint256 weiRaised){
        return weiRaised;
    }

}


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
        totalSold = privateOffer.getWeiRaised().add(preSale.getWeiRaised().add(crowdsale.getWeiRaised()));
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
