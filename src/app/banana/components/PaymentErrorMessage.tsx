import React from 'react';

interface PaymentErrorMessageProps {
  message: string;
  isUsingStellar: boolean;
  onRetry?: () => void;
}

const PaymentErrorMessage: React.FC<PaymentErrorMessageProps> = ({
  message,
  isUsingStellar,
  onRetry
}) => {
  if (isUsingStellar) {
    return (
      <div className="p-4 bg-yellow-950/60 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-yellow-300 font-semibold">Stellar Token Required</p>
            <p className="text-yellow-200 text-sm mt-1">Please provide a valid stellar token in the URL parameters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-950/60 border border-yellow-500/30 rounded-lg">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-yellow-300 font-semibold">Payment Required</p>
          <p className="text-yellow-200 text-sm mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-md transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentErrorMessage;