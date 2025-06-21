// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DigiPayEscrow
 * @dev Smart contract for P2P USDT trading with escrow functionality
 */
contract DigiPayEscrow is Ownable, ReentrancyGuard {
    IERC20 public usdtToken;
    
    struct Trade {
        uint256 tradeId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 rate; // NGN per USDT (scaled by 1e2)
        bool isActive;
        bool isCompleted;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    mapping(uint256 => Trade) public trades;
    mapping(address => uint256[]) public userTrades;
    mapping(address => bool) public authorizedOperators;
    
    uint256 public tradeCounter;
    uint256 public platformFee = 25; // 0.25% (25/10000)
    address public feeRecipient;
    
    event TradeCreated(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 rate
    );
    
    event TradeCompleted(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    
    event TradeCancelled(
        uint256 indexed tradeId,
        address indexed seller,
        uint256 amount
    );
    
    event FundsDeposited(
        uint256 indexed tradeId,
        address indexed seller,
        uint256 amount
    );
    
    modifier onlyAuthorized() {
        require(
            authorizedOperators[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    
    modifier tradeExists(uint256 _tradeId) {
        require(trades[_tradeId].tradeId != 0, "Trade does not exist");
        _;
    }
    
    modifier tradeActive(uint256 _tradeId) {
        require(trades[_tradeId].isActive, "Trade is not active");
        _;
    }
    
    constructor(address _usdtToken, address _feeRecipient) {
        usdtToken = IERC20(_usdtToken);
        feeRecipient = _feeRecipient;
        tradeCounter = 0;
    }
    
    /**
     * @dev Create a new trade and deposit USDT into escrow
     * @param _tradeId Unique trade identifier from backend
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _amount Amount of USDT to trade
     * @param _rate Exchange rate (NGN per USDT)
     */
    function createTrade(
        uint256 _tradeId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _rate
    ) external nonReentrant {
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        require(_buyer != _seller, "Buyer and seller cannot be the same");
        require(_amount > 0, "Amount must be greater than 0");
        require(_rate > 0, "Rate must be greater than 0");
        require(trades[_tradeId].tradeId == 0, "Trade ID already exists");
        
        // Transfer USDT from seller to contract
        require(
            usdtToken.transferFrom(_seller, address(this), _amount),
            "USDT transfer failed"
        );
        
        trades[_tradeId] = Trade({
            tradeId: _tradeId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            rate: _rate,
            isActive: true,
            isCompleted: false,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        userTrades[_buyer].push(_tradeId);
        userTrades[_seller].push(_tradeId);
        tradeCounter++;
        
        emit TradeCreated(_tradeId, _buyer, _seller, _amount, _rate);
        emit FundsDeposited(_tradeId, _seller, _amount);
    }
    
    /**
     * @dev Complete a trade and release USDT to buyer
     * @param _tradeId Trade identifier
     */
    function completeTrade(uint256 _tradeId) 
        external 
        onlyAuthorized 
        tradeExists(_tradeId) 
        tradeActive(_tradeId) 
        nonReentrant 
    {
        Trade storage trade = trades[_tradeId];
        
        uint256 feeAmount = (trade.amount * platformFee) / 10000;
        uint256 buyerAmount = trade.amount - feeAmount;
        
        trade.isActive = false;
        trade.isCompleted = true;
        trade.completedAt = block.timestamp;
        
        // Transfer USDT to buyer (minus fee)
        require(
            usdtToken.transfer(trade.buyer, buyerAmount),
            "Transfer to buyer failed"
        );
        
        // Transfer fee to platform
        if (feeAmount > 0) {
            require(
                usdtToken.transfer(feeRecipient, feeAmount),
                "Fee transfer failed"
            );
        }
        
        emit TradeCompleted(_tradeId, trade.buyer, trade.seller, buyerAmount);
    }
    
    /**
     * @dev Cancel a trade and refund USDT to seller
     * @param _tradeId Trade identifier
     */
    function cancelTrade(uint256 _tradeId) 
        external 
        onlyAuthorized 
        tradeExists(_tradeId) 
        tradeActive(_tradeId) 
        nonReentrant 
    {
        Trade storage trade = trades[_tradeId];
        
        trade.isActive = false;
        trade.completedAt = block.timestamp;
        
        // Refund USDT to seller
        require(
            usdtToken.transfer(trade.seller, trade.amount),
            "Refund to seller failed"
        );
        
        emit TradeCancelled(_tradeId, trade.seller, trade.amount);
    }
    
    /**
     * @dev Get trade details
     * @param _tradeId Trade identifier
     */
    function getTrade(uint256 _tradeId) 
        external 
        view 
        tradeExists(_tradeId) 
        returns (Trade memory) 
    {
        return trades[_tradeId];
    }
    
    /**
     * @dev Get user's trade history
     * @param _user User address
     */
    function getUserTrades(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userTrades[_user];
    }
    
    /**
     * @dev Get contract's USDT balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }
    
    /**
     * @dev Add authorized operator
     * @param _operator Address to authorize
     */
    function addAuthorizedOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
    }
    
    /**
     * @dev Remove authorized operator
     * @param _operator Address to remove authorization
     */
    function removeAuthorizedOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
    }
    
    /**
     * @dev Update platform fee
     * @param _newFee New fee in basis points (max 1000 = 10%)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }
    
    /**
     * @dev Update fee recipient
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");
        feeRecipient = _newRecipient;
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= usdtToken.balanceOf(address(this)), "Insufficient balance");
        require(usdtToken.transfer(owner(), _amount), "Emergency withdrawal failed");
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalTrades,
        uint256 activeTrades,
        uint256 totalVolume,
        uint256 contractBalance
    ) {
        uint256 _activeTrades = 0;
        uint256 _totalVolume = 0;
        
        for (uint256 i = 1; i <= tradeCounter; i++) {
            if (trades[i].tradeId != 0) {
                if (trades[i].isActive) {
                    _activeTrades++;
                }
                if (trades[i].isCompleted) {
                    _totalVolume += trades[i].amount;
                }
            }
        }
        
        return (
            tradeCounter,
            _activeTrades,
            _totalVolume,
            usdtToken.balanceOf(address(this))
        );
    }
}