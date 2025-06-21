// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Escrow {
    address public owner;
    IERC20 public usdtToken;
    
    struct Trade {
        uint256 tradeId;
        address buyer;
        address seller;
        uint256 amount;
        bool isActive;
        bool isCompleted;
    }
    
    mapping(uint256 => Trade) public trades;
    mapping(uint256 => uint256) public escrowBalances;
    
    event Deposited(uint256 indexed tradeId, address indexed seller, uint256 amount);
    event Released(uint256 indexed tradeId, address indexed buyer, uint256 amount);
    event Refunded(uint256 indexed tradeId, address indexed seller, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier tradeExists(uint256 _tradeId) {
        require(trades[_tradeId].isActive, "Trade does not exist or is not active");
        _;
    }
    
    constructor(address _usdtToken) {
        owner = msg.sender;
        usdtToken = IERC20(_usdtToken);
    }
    
    function deposit(
        uint256 _tradeId,
        address _buyer,
        address _seller,
        uint256 _amount
    ) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(!trades[_tradeId].isActive, "Trade already exists");
        
        // Transfer USDT from seller to this contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), _amount),
            "USDT transfer failed"
        );
        
        trades[_tradeId] = Trade({
            tradeId: _tradeId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            isActive: true,
            isCompleted: false
        });
        
        escrowBalances[_tradeId] = _amount;
        
        emit Deposited(_tradeId, _seller, _amount);
    }
    
    function release(uint256 _tradeId) external onlyOwner tradeExists(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(!trade.isCompleted, "Trade already completed");
        
        uint256 amount = escrowBalances[_tradeId];
        require(amount > 0, "No funds to release");
        
        trade.isCompleted = true;
        trade.isActive = false;
        escrowBalances[_tradeId] = 0;
        
        // Transfer USDT to buyer
        require(
            usdtToken.transfer(trade.buyer, amount),
            "USDT transfer to buyer failed"
        );
        
        emit Released(_tradeId, trade.buyer, amount);
    }
    
    function refund(uint256 _tradeId) external onlyOwner tradeExists(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(!trade.isCompleted, "Trade already completed");
        
        uint256 amount = escrowBalances[_tradeId];
        require(amount > 0, "No funds to refund");
        
        trade.isCompleted = true;
        trade.isActive = false;
        escrowBalances[_tradeId] = 0;
        
        // Transfer USDT back to seller
        require(
            usdtToken.transfer(trade.seller, amount),
            "USDT transfer to seller failed"
        );
        
        emit Refunded(_tradeId, trade.seller, amount);
    }
    
    function getTradeDetails(uint256 _tradeId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        bool isActive,
        bool isCompleted
    ) {
        Trade memory trade = trades[_tradeId];
        return (trade.buyer, trade.seller, trade.amount, trade.isActive, trade.isCompleted);
    }
    
    function getEscrowBalance(uint256 _tradeId) external view returns (uint256) {
        return escrowBalances[_tradeId];
    }
    
    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
    
    function updateOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}