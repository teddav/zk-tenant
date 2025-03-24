"use client";

// https://dev.to/zodiapps/how-to-scan-barcodes-in-your-reactjs-application-2668

import React, { useState, useEffect } from "react";
import { useZxing, DecodeHintType } from "react-zxing";

function Camera({ passResult }: { passResult: (result: string) => void }) {
  const [result, setResult] = useState("");

  useEffect(() => {
    if (result) {
      passResult(result);
    }
  }, [result, passResult]);

  const hints = new Map();
  hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");
  hints.set(DecodeHintType.ASSUME_GS1, false);
  const { ref } = useZxing({
    hints,
    timeBetweenDecodingAttempts: 500,
    onResult(result) {
      setResult(result.getText());
    },
  });

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {!result && <video ref={ref} className="w-full h-full object-cover" autoPlay playsInline />}
    </div>
  );
}

export default Camera;
