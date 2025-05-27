import { useState } from "react";
import { useAddress, useContract, useContractWrite } from "@thirdweb-dev/react";

const CreateLoan = () => {
  const address = useAddress();
  const [loanAmount, setLoanAmount] = useState<string>("40000");
  const [interestRate, setInterestRate] = useState<string>("1000"); // 10% in basis points
  const [duration, setDuration] = useState<string>("2592000"); // 30 days in seconds
  const [description, setDescription] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const { contract } = useContract(import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS);
  const { mutateAsync: createLoan, isLoading } = useContractWrite(contract, "createLoan");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsCreating(true);
      
      const loanAmountWei = BigInt(parseFloat(loanAmount) * 1e18);
      const interestRateBps = parseInt(interestRate);
      const durationSeconds = parseInt(duration);
      const fundingPeriod = 604800; // 1 week in seconds
      
      const data = await createLoan({ 
        args: [
          loanAmountWei,
          interestRateBps,
          durationSeconds,
          fundingPeriod,
          description
        ] 
      });
      
      console.info("Contract call success", data);
      alert("Loan created successfully!");
      
      setLoanAmount("40000");
      setInterestRate("1000");
      setDuration("2592000");
      setDescription("");
    } catch (err) {
      console.error("Contract call failure", err);
      alert("Failed to create loan. See console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Create a New Loan</h2>
      
      {!address ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Please connect your wallet to create a loan</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
                Loan Amount (USD)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="loanAmount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                Interest Rate (%)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="interestRate"
                  value={parseFloat(interestRate) / 100}
                  onChange={(e) => setInterestRate((parseFloat(e.target.value) * 100).toString())}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                  min="0"
                  step="0.1"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This is the interest rate you'll pay to lenders
              </p>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Loan Duration (Days)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="duration"
                  value={parseInt(duration) / 86400} // Convert seconds to days
                  onChange={(e) => setDuration((parseInt(e.target.value) * 86400).toString())}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Loan Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Describe the purpose of your loan and why people should fund it
              </p>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || isCreating}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (isLoading || isCreating) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading || isCreating ? "Creating..." : "Create Loan"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateLoan;
