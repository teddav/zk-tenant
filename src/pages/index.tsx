import Proof from "./Proof";
import Camera from "./Camera";
import { useState, useEffect } from "react";

export default function Home() {
  const [rawDataId, setRawDataId] = useState<string>("");
  const [rawDataTaxes, setRawDataTaxes] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [scanningType, setScanningType] = useState<"id" | "taxes" | null>(null);
  const [showCamera, setShowCamera] = useState(false);

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

  const canGenerateProof = rawDataId && rawDataTaxes;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold mb-8">Document Scanner</h1>

      {isScanning ? (
        <div className="w-full max-w-2xl">
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
          <Proof rawDataId={rawDataId} rawDataTaxes={rawDataTaxes} />
        </div>
      )}
    </div>
  );
}
