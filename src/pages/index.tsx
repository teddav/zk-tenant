import Proof from "./Proof";
import Camera from "./Camera";
import { useState, useEffect } from "react";

export default function Home() {
  const [data, setData] = useState("");

  useEffect(() => {
    console.log("DATA UPDATED", data);
  }, [data]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Camera passResult={setData} />
      <br />
      {data && <Proof rawData={data} />}
    </div>
  );
}
