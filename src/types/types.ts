export interface Loan {
  address: string;
  loanAmount: bigint;
  interestRate: number;
  duration: number;
  fundingDeadline: number;
  repaymentDate: number;
  title?: string;
  description: string;
  imageURI: string;
  borrower: string;
  totalFunded: bigint;
  isActive: boolean;
  isRepaid: boolean;
}

export interface Investment {
  loanAddress: string;
  tokenId: number;
  contributionAmount: number; // in USDC
  claimedAmount: number; // amount already claimed
  claimableAmount: number; // amount available to claim now
  loanDescription: string;
  loanImageURI: string;
  borrower: string;
  isLoanActive: boolean;
  isLoanRepaid: boolean;
  totalRepaidAmount: number;
  actualRepaidAmount: number;
}
