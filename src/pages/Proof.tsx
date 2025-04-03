"use client";

import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import { CompiledCircuit, InputMap, Noir } from "@noir-lang/noir_js";
import { useState } from "react";

import Verification from "./Verification";

import { buildCircuitData } from "../parseTdd";
import circuit from "../circuit.json";

type RawData = {
  rawDataId: string;
  rawDataTaxes: string;
};

export async function prove(rawData: RawData) {
  const noir = new Noir(circuit as CompiledCircuit);
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: navigator.hardwareConcurrency });

  const combinedData = await buildCircuitData(rawData.rawDataId, rawData.rawDataTaxes);
  console.log("combinedData", combinedData);

  const { witness, returnValue } = await noir.execute(combinedData as InputMap);
  console.log("returnValue", returnValue);

  console.time("Proof Generation");
  const proof = await backend.generateProof(witness);
  console.timeEnd("Proof Generation");
  console.log("proof", proof);
  return { proof, returnValue };
}

export default function Proof(rawData: RawData) {
  const [proof, setProof] = useState<ProofData | null>(null);
  const [returnValue, setReturnValue] = useState<InputMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProve = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress updates, "freezes" at 95%
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95));
    }, 300);

    try {
      const result = await prove(rawData);
      clearInterval(progressInterval);
      setProgress(100);
      setProof(result.proof);
      setReturnValue(result.returnValue as InputMap);
    } catch (error) {
      console.error("Error generating proof:", error);
      clearInterval(progressInterval);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-xl font-semibold">Proof Generation</h2>

      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Documents to Prove:</h3>
          <div className="space-y-2">
            <div key={0} className="p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">Document ID</p>
              <pre className="text-sm text-gray-600 overflow-auto">{rawData.rawDataId}</pre>
            </div>
            <div key={1} className="p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">Document Taxes</p>
              <pre className="text-sm text-gray-600 overflow-auto">{rawData.rawDataTaxes}</pre>
            </div>
          </div>
        </div>

        {!proof && (
          <button
            onClick={handleProve}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {isGenerating ? "Generating Proof..." : "Generate Proof"}
          </button>
        )}

        {isGenerating && (
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-blue-500 font-medium">Generating proof... {progress}%</div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-2 text-sm text-gray-500 text-center">This may take up to 30 seconds. Please do not close the window.</p>
          </div>
        )}

        {proof && returnValue && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated Proof:</h3>
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
              <div className="max-h-48 overflow-y-auto p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm text-gray-600">{JSON.stringify(proof, null, 2)}</pre>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            </div>
            <Verification proof={proof} returnValue={returnValue} />
          </div>
        )}
      </div>
    </div>
  );
}
