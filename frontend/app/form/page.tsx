"use client"
import React, { useState } from "react";
import { ethers } from "ethers";
import xlend from "@/abi/Xlend.json";
import { useFhe } from "@/components/FheProvider";


export default function FormPage() {

  const [supply, setSupply] = useState("");

  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fhe = useFhe();


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessId(null);


    try {

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(xlend.address, xlend.abi, signer);
      const totalSupply = ethers.parseUnits(supply, 6); 
      const userAddress = await signer.getAddress();

      const encryptedInput = await fhe
      .createEncryptedInput(xlend.address, userAddress)
      .add64(BigInt(totalSupply))
      .encrypt();
    console.log({encryptedInput});
    
      const tx = await contract.createFund(totalSupply, encryptedInput.handles[0], encryptedInput.inputProof);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) =>
        log.fragment?.name === "FundCreated"
      );

      const fundId = event?.args?.FundCreated
        ? Number(event.args.fundId)
        : null;

      setSuccessId(fundId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Transaction failed");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex justify-center px-6 py-14">
      <div className="w-full max-w-xl bg-[#111] border border-[#FFEB3B]/20 rounded-2xl p-8 shadow-xl">
        
        <h1 className="text-3xl font-bold text-white mb-8">
          Create Fund
        </h1>


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Total Supply */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1">Total Supply</label>
            <input
              type="number"
              className="bg-[#0A0A0A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FFEB3B]"
              placeholder="Enter total supply"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:bg-gray-600 disabled:text-gray-400"
          >
            {loading ? "Creating..." : "Create Fund"}
          </button>
        </form>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-400 mt-4 text-sm">{errorMsg}</p>
        )}

        {/* Success */}
        {successId !== null && (
          <p className="text-green-400 mt-4 text-sm">
            Fund created successfully.  
            Fund ID: <span className="text-[#FFEB3B] font-bold">{successId}</span>
          </p>
        )}
      </div>
    </div>
  );
}
