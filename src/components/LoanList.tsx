import { useLoans } from "../hooks/useLoans";
import LoanCard from "./LoanCard";

const LoanList = () => {
  const { loans, isLoading, error } = useLoans();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Available Loans</h2>
      
      {error ? (
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">Configuration Error</p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-4">
            Please configure your contract addresses in the environment variables.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300">No loans available at the moment</p>
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
