import { useLoans } from "../hooks/useLoans";
import LoanCard from "./LoanCard";

const LoanList = () => {
  const { loans, isLoading } = useLoans();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Available Loans</h2>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No loans available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => (
            <LoanCard key={loan.address} loan={loan} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanList;
