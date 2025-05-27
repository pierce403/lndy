import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";
import { Loan } from "../types/types";

interface LoanCardProps {
  loan: Loan;
}

const LoanCard = ({ loan }: LoanCardProps) => {
  const address = useAddress();
  const { contract } = useContract(loan.address);
  const { mutateAsync: fundLoan, isLoading } = useContractWrite(contract, "fundLoan");

  const progressPercentage = loan.loanAmount > 0 
    ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount)
    : 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e18).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const handleFund = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const fundAmount = BigInt(1e18); // 1 ETH equivalent
      
      await fundLoan({ 
        args: [fundAmount],
        overrides: {
          value: fundAmount
        }
      });
      
      alert("Loan funded successfully!");
    } catch (err) {
      console.error("Error funding loan:", err);
      alert("Failed to fund loan. See console for details.");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate">{loan.description}</h3>
            <p className="text-sm text-gray-500">By {loan.borrower.substring(0, 6)}...{loan.borrower.substring(38)}</p>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            loan.isRepaid 
              ? "bg-green-100 text-green-800" 
              : loan.isActive 
                ? "bg-blue-100 text-blue-800" 
                : "bg-yellow-100 text-yellow-800"
          }`}>
            {loan.isRepaid ? "Repaid" : loan.isActive ? "Active" : "Funding"}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Interest Rate</span>
            <span className="font-medium">{loan.interestRate / 100}%</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium">{Math.floor(loan.duration / 86400)} days</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Funding Deadline</span>
            <span className="font-medium">{formatDate(loan.fundingDeadline)}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Funding Progress</span>
            <span className="font-medium">{formatCurrency(loan.totalFunded)} / {formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {progressPercentage}% funded
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        {!loan.isActive && !loan.isRepaid && Math.floor(Date.now() / 1000) < loan.fundingDeadline ? (
          <button
            onClick={handleFund}
            disabled={isLoading || !address}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading || !address ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Processing..." : "Fund This Loan"}
          </button>
        ) : loan.isActive && !loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600">
            Loan is active and NFTs are now tradable
          </div>
        ) : loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600">
            Loan has been repaid
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600">
            Funding period has ended
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCard;
