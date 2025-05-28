import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { upload } from "thirdweb/storage";
import { getLauncherContract } from "../lib/client";
import { client } from "../lib/client";

const CreateLoan = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const [loanAmount, setLoanAmount] = useState<string>("40000");
  const [interestRate, setInterestRate] = useState<string>("1000"); // 10% in basis points
  const [duration, setDuration] = useState<string>("2592000"); // 30 days in seconds
  const [description, setDescription] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const { mutate: sendTransaction } = useSendTransaction();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    try {
      console.log("🚀 CreateLoan: Starting IPFS upload process...");
      console.log("📄 CreateLoan: File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      setIsUploadingImage(true);
      console.log("⏳ CreateLoan: Set uploading state to true");
      
      console.log("☁️ CreateLoan: Calling Thirdweb upload function...");
      console.log("🔗 CreateLoan: Using client:", client);
      
      const uri = await upload({
        client,
        files: [file],
      });
      
      console.log("✅ CreateLoan: IPFS upload successful!");
      console.log("🔗 CreateLoan: Returned URI:", uri);
      console.log("📊 CreateLoan: Upload stats:", {
        originalFileName: file.name,
        uploadedURI: uri,
        uploadTime: new Date().toISOString()
      });
      
      return uri;
    } catch (error) {
      console.error("💥 CreateLoan: IPFS upload failed!");
      console.error("❌ CreateLoan: Upload error details:", error);
      console.error("🔍 CreateLoan: Error breakdown:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        fileName: file.name,
        fileSize: file.size
      });
      throw new Error("Failed to upload image to IPFS");
    } finally {
      console.log("🏁 CreateLoan: IPFS upload process completed, resetting upload state");
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🎯 CreateLoan: Form submission started");
    console.log("👤 CreateLoan: Current user address:", address);
    
    if (!address) {
      console.warn("⚠️ CreateLoan: No wallet connected, showing alert");
      alert("Please connect your wallet first");
      return;
    }

    if (!selectedImage) {
      console.warn("⚠️ CreateLoan: No image selected, showing alert");
      alert("Please select an image for your loan NFT");
      return;
    }

    try {
      console.log("🚀 CreateLoan: Starting loan creation process...");
      console.log("📋 CreateLoan: Form data collected:", {
        loanAmount,
        interestRate,
        duration,
        description: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
        imageFileName: selectedImage.name,
        userAddress: address
      });
      
      setIsCreating(true);
      console.log("⏳ CreateLoan: Set creating state to true");
      
      // Upload image to IPFS first
      console.log("📸 CreateLoan: Starting image upload to IPFS...");
      const imageURI = await uploadImageToIPFS(selectedImage);
      console.log("✅ CreateLoan: Image upload completed, URI:", imageURI);
      
      console.log("🔢 CreateLoan: Processing loan parameters...");
      const loanAmountWei = BigInt(parseFloat(loanAmount) * 1e18);
      const interestRateBps = parseInt(interestRate);
      const durationSeconds = parseInt(duration);
      const fundingPeriod = 604800; // 1 week in seconds
      
      console.log("📊 CreateLoan: Processed parameters:", {
        loanAmountWei: loanAmountWei.toString(),
        loanAmountETH: parseFloat(loanAmount),
        interestRateBps,
        interestRatePercent: interestRateBps / 100,
        durationSeconds,
        durationDays: durationSeconds / 86400,
        fundingPeriod,
        fundingPeriodDays: fundingPeriod / 86400
      });
      
      console.log("🔗 CreateLoan: Getting launcher contract instance...");
      const contract = getLauncherContract();
      console.log("✅ CreateLoan: Launcher contract obtained:", contract);
      
      console.log("📝 CreateLoan: Preparing contract call...");
      const transaction = prepareContractCall({
        contract,
        method: "function createLoan(uint256 _loanAmount, uint256 _interestRate, uint256 _duration, uint256 _fundingPeriod, string _description, string _imageURI)",
        params: [
          loanAmountWei,
          BigInt(interestRateBps),
          BigInt(durationSeconds),
          BigInt(fundingPeriod),
          description,
          imageURI
        ]
      });
      
      console.log("🔗 CreateLoan: Transaction prepared:", transaction);
      console.log("📤 CreateLoan: Transaction parameters:", {
        loanAmount: loanAmountWei.toString(),
        interestRate: interestRateBps,
        duration: durationSeconds,
        fundingPeriod: fundingPeriod,
        description,
        imageURI
      });
      
      console.log("🚀 CreateLoan: Sending transaction...");
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 CreateLoan: Transaction successful!");
          console.log("✅ CreateLoan: Transaction result:", result);
          console.log("🔗 CreateLoan: Transaction hash:", result.transactionHash);
          console.log("📊 CreateLoan: Final loan data:", {
            amount: parseFloat(loanAmount) + " ETH",
            interest: (interestRateBps / 100) + "%",
            duration: (durationSeconds / 86400) + " days",
            imageURI,
            creator: address
          });
          
          alert("Loan created successfully!");
          
          console.log("🔄 CreateLoan: Resetting form fields...");
          setLoanAmount("40000");
          setInterestRate("1000");
          setDuration("2592000");
          setDescription("");
          setSelectedImage(null);
          setImagePreview("");
          console.log("✅ CreateLoan: Form reset completed");
        },
        onError: (error) => {
          console.error("💥 CreateLoan: Transaction failed!");
          console.error("❌ CreateLoan: Transaction error:", error);
          console.error("🔍 CreateLoan: Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
          });
          alert("Failed to create loan. See console for details.");
        }
      });
    } catch (err) {
      console.error("💥 CreateLoan: Critical error in loan creation process!");
      console.error("❌ CreateLoan: Error details:", err);
      console.error("🔍 CreateLoan: Error breakdown:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        formData: { loanAmount, interestRate, duration, description: description.length }
      });
      alert("Failed to create loan. See console for details.");
    } finally {
      console.log("🏁 CreateLoan: Loan creation process completed, resetting creating state");
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Loan</h2>
      
      {!address ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please connect your wallet to create a loan</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Amount (USD)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="loanAmount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interest Rate (%)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="interestRate"
                  value={parseFloat(interestRate) / 100}
                  onChange={(e) => setInterestRate((parseFloat(e.target.value) * 100).toString())}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  min="0"
                  step="0.1"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This is the interest rate you'll pay to lenders
              </p>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Duration (Days)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="duration"
                  value={parseInt(duration) / 86400} // Convert seconds to days
                  onChange={(e) => setDuration((parseInt(e.target.value) * 86400).toString())}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Describe the purpose of your loan and why people should fund it
              </p>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan NFT Image
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This image will be used as the graphic for your loan NFT tokens
              </p>
              
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <img
                    src={imagePreview}
                    alt="NFT Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreating || isUploadingImage}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                  (isCreating || isUploadingImage) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUploadingImage ? "Uploading Image..." : isCreating ? "Creating..." : "Create Loan"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateLoan;
