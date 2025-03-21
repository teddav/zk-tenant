"use client";

import { UltraHonkBackend } from "@aztec/bb.js";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";

import { tdd } from "../tdd";

import circuit from "../tdd_id.json";

export async function prove(rawData: string) {
  const noir = new Noir(circuit as CompiledCircuit);
  const backend = new UltraHonkBackend(circuit.bytecode, { threads: navigator.hardwareConcurrency });

  const data = await tdd(rawData);
  console.log(data);

  const { witness } = await noir.execute(data);
  console.time("Proof Generation");
  const proof = await backend.generateProof(witness);
  console.timeEnd("Proof Generation");
  console.log(proof);
}

export default function Proof({ rawData }: { rawData: string }) {
  console.log("rawData", rawData);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      hello2
      <button onClick={() => prove(rawData)}>Prove</button>
    </div>
  );
}
