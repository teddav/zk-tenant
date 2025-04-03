"use client";

import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import { InputMap } from "@noir-lang/noir_js";
import { useState } from "react";

import circuit from "../circuit.json";

type UserInfo = {
  firstName: string;
  lastName: string;
  taxYear: string;
  expectedRevenue: string;
};

type VerificationProps = {
  proof: ProofData;
  returnValue: InputMap;
};

type ReturnValue = {
  base_revenue: string;
  year: string;
  first_name: {
    storage: Array<string>;
  };
  last_name: {
    storage: Array<string>;
  };
};

type VerificationError = {
  type: "proof" | "data";
  message: string;
  details?: string[];
};

async function verifyProof(proof: ProofData) {
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: navigator.hardwareConcurrency });
  const isValid = await backend.verifyProof(proof);
  return isValid;
}

function verifyData(returnValue: ReturnValue, expectedData: UserInfo): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const baseRevenue = parseInt(returnValue.base_revenue, 16);
  const year = parseInt(returnValue.year, 16);
  const firstName = returnValue.first_name.storage
    .map((hex) => String.fromCharCode(parseInt(hex, 16)))
    .filter((v) => v != "\x00")
    .join("");
  const lastName = returnValue.last_name.storage
    .map((hex) => String.fromCharCode(parseInt(hex, 16)))
    .filter((v) => v != "\x00")
    .join("");

  if (baseRevenue <= parseInt(expectedData.expectedRevenue)) {
    errors.push(`Expected revenue (${baseRevenue}) is not greater than ${expectedData.expectedRevenue}`);
  }
  if (year !== parseInt(expectedData.taxYear)) {
    errors.push(`Tax year mismatch: document shows ${year}, expected ${expectedData.taxYear}`);
  }
  if (firstName !== expectedData.firstName.toLowerCase()) {
    errors.push(`First name mismatch: document shows "${firstName}", expected "${expectedData.firstName.toLowerCase()}"`);
  }
  if (lastName !== expectedData.lastName.toLowerCase()) {
    errors.push(`Last name mismatch: document shows "${lastName}", expected "${expectedData.lastName.toLowerCase()}"`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default function Verification({ proof, returnValue }: VerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationError, setVerificationError] = useState<VerificationError | null>(null);
  const [progress, setProgress] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    taxYear: "",
    expectedRevenue: "",
  });

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setProgress(0);
    setVerificationError(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95));
    }, 150);

    try {
      const validProof = await verifyProof(proof);
      const { isValid: validData, errors } = verifyData(returnValue as ReturnValue, userInfo);

      clearInterval(progressInterval);
      setProgress(0);

      if (validProof && validData) {
        setIsVerified(true);
      } else if (!validProof) {
        setIsVerified(false);
        setVerificationError({
          type: "proof",
          message: "The cryptographic proof could not be verified. This might indicate tampering or corruption of the proof data.",
          details: ["Please try generating the proof again", "If the problem persists, contact support"],
        });
      } else {
        setIsVerified(false);
        setVerificationError({
          type: "data",
          message: "The document data does not match the provided information.",
          details: errors,
        });
      }
    } catch (error) {
      console.error("Error verifying proof:", error);
      setVerificationError({
        type: "proof",
        message: "An unexpected error occurred during verification.",
        details: ["Please try again", "If the problem persists, contact support"],
      });
      clearInterval(progressInterval);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={userInfo.firstName}
              onChange={(e) => handleUserInfoChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={userInfo.lastName}
              onChange={(e) => handleUserInfoChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="taxYear" className="block text-sm font-medium text-gray-700 mb-1">
              Year of Tax Return
            </label>
            <input
              type="number"
              id="taxYear"
              value={userInfo.taxYear}
              onChange={(e) => handleUserInfoChange("taxYear", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="2000"
              max="2024"
            />
          </div>
          <div>
            <label htmlFor="expectedRevenue" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Tax Revenue
            </label>
            <input
              type="number"
              id="expectedRevenue"
              value={userInfo.expectedRevenue}
              onChange={(e) => handleUserInfoChange("expectedRevenue", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
      >
        {isVerifying ? "Verifying..." : "Verify Proof"}
      </button>

      {isVerifying && (
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <div className="text-green-500 font-medium">Verifying proof... {progress}%</div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-2 text-sm text-gray-500 text-center">Please wait while we verify your proof...</p>
        </div>
      )}

      {isVerified !== null && (
        <div className={`mt-4 p-4 rounded-lg ${isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <div className="flex items-start space-x-2">
            {isVerified ? (
              <>
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium">Proof verified successfully!</p>
                  <p className="text-sm mt-1">All document information matches your provided details.</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium">{verificationError?.message}</p>
                  {verificationError?.details && (
                    <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                      {verificationError.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
