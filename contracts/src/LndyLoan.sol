// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/eip/ERC1155.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";

/**
 * @title LndyLoan
 * @dev ERC1155 contract representing a loan that can be funded by multiple lenders.
 * Each token ID represents a specific loan, and the amount of tokens represents the contribution.
 */
contract LndyLoan is ERC1155, Ownable {
    // Loan details
    uint256 public loanAmount;
    uint256 public interestRate; // in basis points (e.g., 1000 = 10%)
    uint256 public duration; // in seconds
    uint256 public fundingDeadline;
    uint256 public repaymentDate;
    string public description;
    address public borrower;
    
    // Loan state
    uint256 public totalFunded;
    bool public isActive;
    bool public isRepaid;
    
    // Token ID for this loan
    uint256 public constant LOAN_TOKEN_ID = 1;
    
    // Events
    event LoanCreated(address borrower, uint256 amount, uint256 interestRate, uint256 duration);
    event LoanFunded(address funder, uint256 amount);
    event LoanActivated(uint256 totalFunded);
    event LoanRepaid();
    
    /**
     * @dev Constructor to create a new loan
     * @param _loanAmount Total amount requested for the loan
     * @param _interestRate Interest rate in basis points (e.g., 1000 = 10%)
     * @param _duration Duration of the loan in seconds
     * @param _fundingPeriod Period in seconds during which the loan can be funded
     * @param _description Description of the loan purpose
     * @param _borrower Address of the borrower
     */
    constructor(
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _fundingPeriod,
        string memory _description,
        address _borrower
    ) ERC1155("") {
        loanAmount = _loanAmount;
        interestRate = _interestRate;
        duration = _duration;
        fundingDeadline = block.timestamp + _fundingPeriod;
        description = _description;
        borrower = _borrower;
        
        _transferOwnership(_borrower);
        
        emit LoanCreated(_borrower, _loanAmount, _interestRate, _duration);
    }
    
    /**
     * @dev Fund the loan by contributing a specific amount
     * @param _amount Amount to contribute to the loan
     */
    function fundLoan(uint256 _amount) external payable {
        require(block.timestamp < fundingDeadline, "Funding period has ended");
        require(!isActive, "Loan is already active");
        require(totalFunded + _amount <= loanAmount, "Funding amount exceeds loan requirement");
        
        // Mint tokens to the funder representing their contribution
        _mint(msg.sender, LOAN_TOKEN_ID, _amount, "");
        
        totalFunded += _amount;
        
        // If loan is fully funded, activate it
        if (totalFunded == loanAmount) {
            isActive = true;
            repaymentDate = block.timestamp + duration;
            emit LoanActivated(totalFunded);
        }
        
        emit LoanFunded(msg.sender, _amount);
    }
    
    /**
     * @dev Repay the loan (only callable by borrower)
     */
    function repayLoan() external payable onlyOwner {
        require(isActive, "Loan is not active");
        require(!isRepaid, "Loan is already repaid");
        
        // Calculate total repayment amount (principal + interest)
        uint256 interestAmount = (loanAmount * interestRate) / 10000;
        uint256 totalRepayment = loanAmount + interestAmount;
        
        require(msg.value >= totalRepayment, "Insufficient repayment amount");
        
        isRepaid = true;
        
        emit LoanRepaid();
    }
    
    /**
     * @dev Withdraw funds if loan is not activated before deadline
     * Only callable by lenders if funding deadline has passed and loan is not active
     */
    function withdrawFunds() external {
        require(block.timestamp > fundingDeadline, "Funding period has not ended");
        require(!isActive, "Loan is already active");
        
        uint256 userContribution = balanceOf(msg.sender, LOAN_TOKEN_ID);
        require(userContribution > 0, "No funds to withdraw");
        
        // Burn the tokens
        _burn(msg.sender, LOAN_TOKEN_ID, userContribution);
        
        // Transfer the funds back to the lender
        payable(msg.sender).transfer(userContribution);
    }
    
    /**
     * @dev Claim returns after loan is repaid
     * Only callable by lenders if loan is repaid
     */
    function claimReturns() external {
        require(isRepaid, "Loan is not repaid yet");
        
        uint256 userContribution = balanceOf(msg.sender, LOAN_TOKEN_ID);
        require(userContribution > 0, "No returns to claim");
        
        // Calculate returns (principal + interest share)
        uint256 interestAmount = (loanAmount * interestRate) / 10000;
        uint256 userInterest = (userContribution * interestAmount) / loanAmount;
        uint256 totalReturns = userContribution + userInterest;
        
        // Burn the tokens
        _burn(msg.sender, LOAN_TOKEN_ID, userContribution);
        
        // Transfer the returns to the lender
        payable(msg.sender).transfer(totalReturns);
    }
    
    /**
     * @dev Get loan details
     * @return Loan details as a struct
     */
    function getLoanDetails() external view returns (
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _fundingDeadline,
        uint256 _repaymentDate,
        string memory _description,
        address _borrower,
        uint256 _totalFunded,
        bool _isActive,
        bool _isRepaid
    ) {
        return (
            loanAmount,
            interestRate,
            duration,
            fundingDeadline,
            repaymentDate,
            description,
            borrower,
            totalFunded,
            isActive,
            isRepaid
        );
    }
    
    /**
     * @dev Check if tokens are transferable
     * Tokens are only transferable after the loan is activated
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // If this is a mint or burn, allow it
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Otherwise, only allow transfers if the loan is active
        require(isActive, "Tokens are not transferable until loan is activated");
    }
}
