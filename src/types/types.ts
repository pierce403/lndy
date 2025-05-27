export interface Loan {
  address: string;
  loanAmount: bigint;
  interestRate: number;
  duration: number;
  fundingDeadline: number;
  repaymentDate: number;
  description: string;
  borrower: string;
  totalFunded: bigint;
  isActive: boolean;
  isRepaid: boolean;
}
