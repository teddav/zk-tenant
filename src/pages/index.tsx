import Proof from "./Proof";
import Camera from "./Camera";
import { useState, useEffect } from "react";
import Image from "next/image";

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
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 flex items-center justify-center">
          <Image src="/logo.png" alt="zkTenant Logo" width={48} height={48} className="object-contain" />
        </div>
        <h1 className="text-3xl font-bold">zkTenant</h1>
      </div>
      <div className="max-w-2xl mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-gray-600 mb-4">
          zkTenant is a privacy-preserving document verification system that allows you to prove your identity and income without revealing
          sensitive information.
        </p>
        <p className="text-gray-600 mb-4">
          Simply scan your ID and tax documents to generate a zero-knowledge proof that verifies your eligibility while keeping your
          personal data private.
        </p>
        <div className="space-y-4">
          <div className="text-gray-600">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Scan your ID and tax documents</li>
              <li>Generate a zero-knowledge proof</li>
              <li>Submit the proof to the landlord (this is simulated here for this demo)</li>
              <li>The landlord can verify the proof without seeing your personal data</li>
            </ul>
          </div>
          <div className="border-t border-gray-200 my-4"></div>

          <p className="text-gray-600">
            The app is based on{" "}
            <a
              href="https://noir-lang.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Noir
            </a>
            . You can view the source code for the zero-knowledge circuit at{" "}
            <a
              href="https://github.com/teddav/tdd.nr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              tdd.nr
            </a>{" "}
            and the source code for this app{" "}
            <a
              href="https://github.com/teddav/zk-tenant"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              here
            </a>
            .
          </p>
          <div className="border-t border-gray-200 my-4"></div>
          <p className="text-gray-600">
            If you have any question, you can message me on Twitter:{" "}
            <a
              href="https://x.com/0xteddav"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              @0xteddav
            </a>
          </p>
        </div>
      </div>
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
              {canGenerateProof ? "Go to Generate Proof" : "Fill All Fields and Scan Documents"}
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
