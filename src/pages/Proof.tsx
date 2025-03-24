"use client";

import { UltraHonkBackend } from "@aztec/bb.js";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import { useState } from "react";

import { tddIdCircuitFormatter, fieldMatchersID, fieldMatchersTaxes } from "../tdd";
import circuit from "../tdd_id.json";

export type RawData = {
  rawDataId: string;
  rawDataTaxes: string;
};

export async function prove(rawData: RawData) {
  const noir = new Noir(circuit as CompiledCircuit);
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: navigator.hardwareConcurrency });

  const formattedDataId = await tddIdCircuitFormatter(rawData.rawDataId);
  const formattedDataTaxes = await tddIdCircuitFormatter(rawData.rawDataTaxes);
  const idMatchers = fieldMatchersID(formattedDataId.parserResult);
  const taxesMatchers = fieldMatchersTaxes(formattedDataTaxes.parserResult);
  // Combine all documents into a single input
  const combinedData = {
    tdd_id: formattedDataId.circuitData,
    tdd_taxes: formattedDataTaxes.circuitData,
    ...idMatchers,
    ...taxesMatchers,
  };
  console.log("combinedData", combinedData);

  const { witness } = await noir.execute(combinedData);
  console.time("Proof Generation");
  const proof = await backend.generateProof(witness);
  console.timeEnd("Proof Generation");
  console.log("proof", proof);
  return proof;
}

export default function Proof(rawData: RawData) {
  const [proof, setProof] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleProve = async () => {
    setIsGenerating(true);
    try {
      const result = await prove(rawData);
      setProof(result);
    } catch (error) {
      console.error("Error generating proof:", error);
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

        <button
          onClick={handleProve}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isGenerating ? "Generating Proof..." : "Generate Proof"}
        </button>

        {proof && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated Proof:</h3>
            <pre className="p-4 bg-gray-100 rounded-lg overflow-auto">{JSON.stringify(proof, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
