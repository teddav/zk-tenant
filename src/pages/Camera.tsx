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
  }, [result]);

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
      <video ref={ref} className="w-full h-full object-cover" autoPlay playsInline />
      {result && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
          <span>Last result: </span>
          <span>{result}</span>
        </div>
      )}
    </div>
  );
}

export default Camera;
