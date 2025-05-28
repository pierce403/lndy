// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LndyLoan.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LndyLauncher
 * @dev Factory contract that creates new LndyLoan instances for social lending
 */
contract LndyLauncher is Ownable {
    // Array to store all created loans
    address[] public loans;
    
    // Mapping from borrower to their loans
    mapping(address => address[]) public borrowerLoans;
    
    // Events
    event LoanCreated(address indexed loanAddress, address indexed borrower, uint256 loanAmount, uint256 thankYouAmount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new social loan
     * @param _loanAmount Total USDC amount requested (with 6 decimals)
     * @param _thankYouAmount Thank you amount in basis points (e.g., 1000 = 10%)
     * @param _targetRepaymentDate When borrower plans to repay (timestamp)
     * @param _fundingPeriod Period in seconds during which the loan can be funded
     * @param _description Description of the loan purpose
     * @param _baseImageURI Base IPFS URI for the loan NFT images
     */
    function createLoan(
        uint256 _loanAmount,
        uint256 _thankYouAmount,
        uint256 _targetRepaymentDate,
        uint256 _fundingPeriod,
        string memory _description,
        string memory _baseImageURI
    ) external returns (address) {
        // Create a new LndyLoan contract
        LndyLoan newLoan = new LndyLoan(
            _loanAmount,
            _thankYouAmount,
            _targetRepaymentDate,
            _fundingPeriod,
            _description,
            _baseImageURI,
            msg.sender
        );
        
        address loanAddress = address(newLoan);
        
        // Store the loan address
        loans.push(loanAddress);
        borrowerLoans[msg.sender].push(loanAddress);
        
        emit LoanCreated(loanAddress, msg.sender, _loanAmount, _thankYouAmount);
        
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
     * @param borrower The borrower's address
     * @return Array of loan addresses created by the borrower
     */
    function getBorrowerLoans(address borrower) external view returns (address[] memory) {
        return borrowerLoans[borrower];
    }
    
    /**
     * @dev Get the total number of loans created
     * @return The total number of loans
     */
    function getTotalLoans() external view returns (uint256) {
        return loans.length;
    }
}
