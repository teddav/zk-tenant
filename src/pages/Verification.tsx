"use client";

import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import { InputMap } from "@noir-lang/noir_js";
import { useState } from "react";

import circuit from "../circuit.json";

type UserInfo = {
  firstName: string;
  lastName: string;
  taxYear: number;
  expectedRevenue: number;
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

async function verifyProof(proof: ProofData) {
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: navigator.hardwareConcurrency });
  const isValid = await backend.verifyProof(proof);
  return isValid;
}

function verifyData(returnValue: ReturnValue, expectedData: UserInfo) {
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

  return (
    baseRevenue > expectedData.expectedRevenue &&
    year === expectedData.taxYear &&
    firstName === expectedData.firstName.toLowerCase() &&
    lastName === expectedData.lastName.toLowerCase()
  );
}

export default function Verification({ proof, returnValue }: VerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    taxYear: 0,
    expectedRevenue: 0,
  });

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const validProof = await verifyProof(proof);
      const validData = verifyData(returnValue as ReturnValue, userInfo);

      if (validProof && validData) {
        setIsVerified(true);
      } else if (!validProof) {
        setVerificationError("Error verifying proof.");
      } else if (!validData) {
        setVerificationError("Error verifying personal info. Check that the data matches the scanned documents");
      }
    } catch (error) {
      console.error("Error verifying proof:", error);
      setIsVerified(false);
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
