const About = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">About LNDY</h2>
        
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            LNDY is a decentralized social lending platform built on Ethereum's Base network. 
            It enables trusted peer-to-peer lending using smart contracts and NFTs to represent loan participation.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                🤝 For Borrowers
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Create loan requests with custom terms</li>
                <li>• Set your own interest/thank-you rates</li>
                <li>• Upload images for your loan NFTs</li>
                <li>• Make partial or full repayments anytime</li>
                <li>• Build trust within your community</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">
                💰 For Lenders
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Fund loans from people you trust</li>
                <li>• Receive NFTs representing your investment</li>
                <li>• Claim returns as loans are repaid</li>
                <li>• Trade NFTs on secondary markets</li>
                <li>• Support your community financially</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔄 How It Works
          </h3>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Create a Loan Request</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Borrowers create loan requests specifying amount, terms, and purpose. Each loan gets a unique smart contract.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Community Funding</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Supporters fund loans using USDC. Each contribution mints an ERC-1155 NFT representing their investment share.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Loan Activation</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Once fully funded, the borrower can withdraw USDC and the loan becomes active for repayment.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Repayment & Returns</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Borrowers make repayments in USDC. NFT holders can claim their proportional returns as payments are made.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔧 Technical Details
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Contracts</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>LndyLauncher:</strong> Factory contract for creating loans</li>
                  <li>• <strong>LndyLoan:</strong> Individual loan contracts (ERC-1155)</li>
                  <li>• <strong>LNDY Token:</strong> ERC-20 utility token</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Technology Stack</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>Blockchain:</strong> Ethereum Base Network</li>
                  <li>• <strong>Frontend:</strong> React + TypeScript + Vite</li>
                  <li>• <strong>Web3:</strong> Thirdweb SDK</li>
                  <li>• <strong>Storage:</strong> IPFS for loan images</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔗 Links & Resources
          </h3>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <a 
              href="https://github.com/pierce403/lndy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub Repository
            </a>
            
            <a 
              href="https://basescan.org/address/0x1e5a41abf9a83e1346978414ae4e001b50b0431f" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              View on BaseScan
            </a>
            
            <a 
              href="https://base.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              About Base Network
            </a>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">⚠️ Alpha Software Disclaimer</p>
                  <p className="mt-1">
                    LNDY is experimental software in active development. Use at your own risk and only invest amounts you can afford to lose. 
                    This platform is designed for trusted peer-to-peer lending within existing social relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 