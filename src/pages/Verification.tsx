"use client";

import { useState } from "react";

type VerificationProps = {
  proof: string;
};

export default function Verification({ proof }: VerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // TODO: Implement actual verification logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate verification
      setIsVerified(true);
    } catch (error) {
      console.error("Error verifying proof:", error);
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
      >
        {isVerifying ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Verifying...</span>
          </div>
        ) : (
          "Verify Proof"
        )}
      </button>

      {isVerified !== null && (
        <div className={`mt-4 p-4 rounded-lg ${isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <div className="flex items-center space-x-2">
            {isVerified ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Proof verified successfully!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Proof verification failed</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
