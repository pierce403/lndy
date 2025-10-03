import { useState } from "react";
import { prepareContractCall } from "thirdweb";
import { upload } from "thirdweb/storage";
import { getLauncherContract } from "../lib/client";
import { client } from "../lib/client";
import { useWallet } from "../hooks/useWallet";
import { useTransactionExecutor } from "../hooks/useTransactionExecutor";
import { notifyLoanCreated, broadcastNewLoan } from "../utils/notifications";
import { notifyServerLoanCreated } from "../utils/serverNotifications";
import Modal from "./Modal";

const CreateLoan = () => {
  const { address } = useWallet();
  const [loanAmount, setLoanAmount] = useState<string>("100");
  const [interestRate, setInterestRate] = useState<string>("1000"); // 10% in basis points
  const [duration, setDuration] = useState<string>("2592000"); // 30 days in seconds
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    transactionHash: string;
    loanAmount: string;
    thankYouAmount: string;
    targetRepaymentDate: string;
  } | null>(null);

  const { executeTransaction } = useTransactionExecutor();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
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
      
      // Try the upload with proper error handling
      const uris = await upload({
        client,
        files: [file],
      });
      
      // The upload function returns an array of URIs, take the first one
      const uri = Array.isArray(uris) ? uris[0] : uris;
      
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
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error("Network error during upload. Please check your internet connection and try again.");
        } else if (error.message.includes('client')) {
          throw new Error("Configuration error. Please check your Thirdweb client ID.");
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }
      
      throw new Error("Failed to upload image to IPFS. Please try again.");
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
      const loanAmountWei = BigInt(parseFloat(loanAmount) * 1e6); // USDC uses 6 decimals
      const interestRateBps = parseInt(interestRate);
      const durationSeconds = parseInt(duration);
      const fundingPeriod = 604800; // 1 week in seconds
      
      // Calculate target repayment date (current time + duration)
      const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
      const targetRepaymentDate = currentTimestamp + durationSeconds;
      
      console.log("📊 CreateLoan: Processed parameters:", {
        loanAmountWei: loanAmountWei.toString(),
        loanAmountUSDC: parseFloat(loanAmount),
        interestRateBps,
        interestRatePercent: interestRateBps / 100,
        durationSeconds,
        durationDays: durationSeconds / 86400,
        currentTimestamp,
        targetRepaymentDate,
        targetRepaymentDateReadable: new Date(targetRepaymentDate * 1000).toLocaleString(),
        fundingPeriod,
        fundingPeriodDays: fundingPeriod / 86400
      });
      
      console.log("🔗 CreateLoan: Getting launcher contract instance...");
      const contract = getLauncherContract();
      console.log("✅ CreateLoan: Launcher contract obtained:", contract);
      
      console.log("📝 CreateLoan: Preparing contract call...");
      const transaction = prepareContractCall({
        contract,
        method: "function createLoan(uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingPeriod, string _title, string _description, string _baseImageURI)",
        params: [
          loanAmountWei,
          BigInt(interestRateBps),
          BigInt(targetRepaymentDate),
          BigInt(fundingPeriod),
          title,
          description,
          imageURI
        ]
      });
      
      console.log("🔗 CreateLoan: Transaction prepared:", transaction);
      console.log("📤 CreateLoan: Transaction parameters:", {
        loanAmount: loanAmountWei.toString(),
        thankYouAmount: interestRateBps,
        targetRepaymentDate: targetRepaymentDate,
        targetRepaymentDateReadable: new Date(targetRepaymentDate * 1000).toLocaleString(),
        fundingPeriod: fundingPeriod,
        title,
        description,
        imageURI
      });
      
      console.log("🚀 CreateLoan: Sending transaction...");
      executeTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 CreateLoan: Transaction successful!");
          console.log("✅ CreateLoan: Transaction result:", result);
          console.log("🔗 CreateLoan: Transaction hash:", result.transactionHash);
          console.log("📊 CreateLoan: Final loan data:", {
            amount: parseFloat(loanAmount) + " USD",
            thankYouAmount: (interestRateBps / 100) + "%",
            totalRepayment: (parseFloat(loanAmount) * (1 + interestRateBps / 10000)) + " USD",
            targetRepaymentDate: new Date(targetRepaymentDate * 1000).toLocaleDateString(),
            targetRepaymentDays: (durationSeconds / 86400) + " days from now",
            imageURI,
            creator: address
          });
          
          setShowSuccessModal(true);
          setSuccessDetails({
            transactionHash: result.transactionHash,
            loanAmount: parseFloat(loanAmount) + " USD",
            thankYouAmount: (interestRateBps / 100) + "%",
            targetRepaymentDate: new Date(targetRepaymentDate * 1000).toLocaleDateString()
          });
          
          // Send notifications for new loan creation
          if (address) {
            const loanData = {
              loanId: result.transactionHash, // Using transaction hash as loan ID
              borrowerAddress: address,
              loanAmount: parseFloat(loanAmount) + " USDC",
              title: title,
              description: description,
            };
            
            // Send both client-side and server-side notifications
            Promise.all([
              notifyLoanCreated(loanData),
              broadcastNewLoan(loanData),
              notifyServerLoanCreated({
                ...loanData,
                targetFids: [/* TODO: Get all subscribed user FIDs */]
              })
            ]).then(() => {
              console.log("✅ CreateLoan: All notifications sent successfully");
            }).catch(error => 
              console.error("❌ CreateLoan: Failed to send notifications:", error)
            );
          }
          
          console.log("🔄 CreateLoan: Resetting form fields...");
          setLoanAmount("100");
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
      
      // Show more specific error message to user
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to create loan: ${errorMessage}`);
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
        <>
          {/* Borrower Responsibility Warning */}
          <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium">📋 BORROWER RESPONSIBILITIES</p>
                  <p className="mt-1">
                    By creating this loan, you commit to making every effort to repay your supporters. 
                    <strong> Only request money you genuinely intend and expect to be able to repay.</strong> 
                    Consider unexpected life events, job changes, or emergencies that might affect your ability to repay. 
                    Your supporters are trusting you personally - treat this responsibility seriously.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  You're requesting (USD)
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
                  Thank You Amount (%)
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
                  Extra amount you'll return to show appreciation to your supporters
                </p>
                {loanAmount && interestRate && (
                  <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                    You'll return: ${((parseFloat(loanAmount) * (1 + parseFloat(interestRate) / 10000))).toLocaleString()} 
                    (includes ${((parseFloat(loanAmount) * parseFloat(interestRate)) / 10000).toLocaleString()} thank you to supporters)
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Repayment Timeframe (Days)
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
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  When you're planning to repay (you can repay gradually over time)
                </p>
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loan Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 20))}
                    maxLength={20}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Emergency Medical"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Short title for your loan (max 20 characters) - {title.length}/20
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loan Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                    maxLength={200}
                    rows={4}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe why you need this loan and how you plan to repay..."
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Describe the purpose of your loan and why people should fund it (max 200 characters) - {description.length}/200
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
                    disabled={isUploadingImage || isCreating}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      (isUploadingImage || isCreating) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This image will be used as the graphic for your loan NFT tokens (Max: 10MB, JPEG/PNG/GIF/WebP)
                </p>
                
                {isUploadingImage && (
                  <div className="mt-2 flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading to IPFS...
                  </div>
                )}
                
                {imagePreview && !isUploadingImage && (
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
        </>
      )}

      {showSuccessModal && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="🎉 Loan Created Successfully!"
        >
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Your loan has been created and is now live on the platform!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{successDetails?.loanAmount}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Thank You Amount:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{successDetails?.thankYouAmount}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Repayment Date:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{successDetails?.targetRepaymentDate}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction:</p>
                <a 
                  href={`https://basescan.org/tx/${successDetails?.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm break-all"
                >
                  {successDetails?.transactionHash}
                </a>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreateLoan;
