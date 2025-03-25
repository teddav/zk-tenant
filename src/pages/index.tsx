import Proof, { UserInfo } from "./Proof";
import Camera from "./Camera";
import { useState, useEffect } from "react";

export default function Home() {
  const [rawDataId, setRawDataId] = useState<string>("");
  const [rawDataTaxes, setRawDataTaxes] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [scanningType, setScanningType] = useState<"id" | "taxes" | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    taxYear: "",
    expectedRevenue: "",
  });

  useEffect(() => {
    // Small delay to ensure proper mounting
    if (scanningType) {
      setShowCamera(true);
    } else {
      setShowCamera(false);
    }
  }, [scanningType]);

  const handleScan = (result: string) => {
    if (scanningType === "id") {
      setRawDataId(result);
    } else if (scanningType === "taxes") {
      setRawDataTaxes(result);
    }
    setScanningType(null);
  };

  const handleProve = () => {
    setIsScanning(false);
  };

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const canGenerateProof =
    rawDataId && rawDataTaxes && userInfo.firstName && userInfo.lastName && userInfo.taxYear && userInfo.expectedRevenue;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold mb-8">Document Scanner</h1>

      {isScanning ? (
        <div className="w-full max-w-2xl">
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

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Required Documents:</h2>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${rawDataId ? "bg-green-100" : "bg-gray-100"}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">ID Document {rawDataId && "✓"}</p>
                  <button
                    onClick={() => setScanningType("id")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    {rawDataId ? "Rescan ID" : "Scan ID"}
                  </button>
                </div>
                {rawDataId && <p className="text-sm text-gray-600 truncate">{rawDataId}</p>}
              </div>
              <div className={`p-4 rounded-lg ${rawDataTaxes ? "bg-green-100" : "bg-gray-100"}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">Tax Report {rawDataTaxes && "✓"}</p>
                  <button
                    onClick={() => setScanningType("taxes")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    {rawDataTaxes ? "Rescan Taxes" : "Scan Taxes"}
                  </button>
                </div>
                {rawDataTaxes && <p className="text-sm text-gray-600 truncate">{rawDataTaxes}</p>}
              </div>
            </div>
          </div>

          {showCamera && scanningType && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Scanning {scanningType === "id" ? "ID Document" : "Tax Report"}</h3>
              <Camera passResult={handleScan} />
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={handleProve}
              disabled={!canGenerateProof}
              className={`mt-4 px-4 py-2 text-white rounded transition-colors ${
                canGenerateProof ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {canGenerateProof ? "Generate Proof" : "Fill All Fields and Scan Documents"}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <Proof rawDataId={rawDataId} rawDataTaxes={rawDataTaxes} userInfo={userInfo} />
        </div>
      )}
    </div>
  );
}
