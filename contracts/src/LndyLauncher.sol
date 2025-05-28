// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LndyLoan.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LndyLauncher
 * @dev Factory contract that creates new LndyLoan instances
 */
contract LndyLauncher is Ownable {
    // Array to store all created loans
    address[] public loans;
    
    // Mapping from borrower to their loans
    mapping(address => address[]) public borrowerLoans;
    
    // Events
    event LoanCreated(address indexed loanAddress, address indexed borrower);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new loan
     * @param _loanAmount Total amount requested for the loan
     * @param _interestRate Interest rate in basis points (e.g., 1000 = 10%)
     * @param _duration Duration of the loan in seconds
     * @param _fundingPeriod Period in seconds during which the loan can be funded
     * @param _description Description of the loan purpose
     */
    function createLoan(
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _fundingPeriod,
        string memory _description
    ) external returns (address) {
        // Create a new LndyLoan contract
        LndyLoan newLoan = new LndyLoan(
            _loanAmount,
            _interestRate,
            _duration,
            _fundingPeriod,
            _description,
            msg.sender
        );
        
        address loanAddress = address(newLoan);
        
        // Store the loan address
        loans.push(loanAddress);
        borrowerLoans[msg.sender].push(loanAddress);
        
        emit LoanCreated(loanAddress, msg.sender);
        
        return loanAddress;
    }
    
    /**
     * @dev Get all loans
     * @return Array of loan addresses
     */
    function getAllLoans() external view returns (address[] memory) {
        return loans;
    }
    
    /**
     * @dev Get loans created by a specific borrower
     * @param _borrower Address of the borrower
     * @return Array of loan addresses
     */
    function getLoansByBorrower(address _borrower) external view returns (address[] memory) {
        return borrowerLoans[_borrower];
    }
    
    /**
     * @dev Get the total number of loans
     * @return Number of loans
     */
    function getLoanCount() external view returns (uint256) {
        return loans.length;
    }
}
