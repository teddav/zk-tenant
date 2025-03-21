"use client";

// https://dev.to/zodiapps/how-to-scan-barcodes-in-your-reactjs-application-2668

import React, { useState, useEffect } from "react";
import { useZxing, DecodeHintType } from "react-zxing";

function Camera({ passResult }: { passResult: (result: string) => void }) {
  const [result, setResult] = useState("");

  useEffect(() => {
    passResult(result);
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
    <>
      <video ref={ref} />
      <p>
        <span>Last result:</span>
        <span>{result}</span>
      </p>
    </>
  );
}

export default Camera;
