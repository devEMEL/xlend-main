"use client"
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import xlend from "@/abi/Xlend.json";
import { useFhe } from "@/components/FheProvider";

interface Fund {
  id: number;
  owner: string;
  clearLiquidity: number;
  liquidityHandle: string;
}


export default function Home() {
  const [funds, setFunds] = useState<Array<Fund> | null>(null);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedFundRepay, setSelectedFundRepay] = useState<Fund | null>(null);
  
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [isBorrowing, setisBorrowing] = useState(false);
  const [isRepaying, setisRepaying] = useState(false);
  

  const [showMainContent, setShowMainContent] = useState(false); 
  // const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);

  // store decrypted amounts per project
  const [decrypted, setDecrypted] = useState<Record<number, number>>({});
  const [decrypting, setDecrypting] = useState<number | null>(null);

  const fhe = useFhe();

  /**
   * PURCHASE
   * 
   * function borrow(
        uint256 fundId,
        externalEuint64 amountExt,
        bytes calldata proof
    )
   */
  async function borrow() {
    console.log("Borrowing...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    if (!selectedFund) return;

    if (!amount || Number(amount) <= 0) {
      setTxStatus("❌ Enter a valid amount");
      return;
    }

    try {
      setisBorrowing(true);
      setTxStatus("⏳ Encrypting amount...");

      setTxStatus("Encrypting...");
      const value = ethers.parseUnits(String(amount), 6);
      const result = await fhe.createEncryptedInput(xlend.address, userAddress)
      .add64(value)
      .encrypt();
      console.log({result});

      console.log({handle: result.handles[0], proof: result.inputProof});


      setTxStatus("⏳ Sending transaction...");
      console.log( selectedFund.id,
        result.handles[0],
        result.inputProof)

      const contract = new ethers.Contract(xlend.address, xlend.abi, signer);
      const tx = await contract.borrow(
        selectedFund.id,
        result.handles[0],
        result.inputProof
      );

      await tx.wait();

      setTxStatus("✅ Purchase successful!");

      setTimeout(() => {
        setSelectedFund(null);
        setTxStatus("");
        setAmount("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setTxStatus("❌ Tx failed: " + (err.reason || err.message));
    } finally {
      setisBorrowing(false);
    }
  }

  async function repay() {
    console.log("Repaying...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    if (!selectedFundRepay) return;

    if (!amount || Number(amount) <= 0) {
      setTxStatus("❌ Enter a valid amount");
      return;
    }

    try {
      setisRepaying(true);
      setTxStatus("⏳ Encrypting amount...");

      setTxStatus("Encrypting...");
      const value = ethers.parseUnits(String(amount), 6);
      const result = await fhe.createEncryptedInput(xlend.address, userAddress)
      .add64(value)
      .encrypt();
      console.log({result});

      console.log({handle: result.handles[0], proof: result.inputProof});


      setTxStatus("⏳ Sending transaction...");
      console.log( selectedFundRepay.id,
        result.handles[0],
        result.inputProof)

      const contract = new ethers.Contract(xlend.address, xlend.abi, signer);
      const tx = await contract.repay(
        selectedFundRepay.id,
        result.handles[0],
        result.inputProof
      );

      await tx.wait();

      setTxStatus("✅ Repay successful!");

      setTimeout(() => {
        setSelectedFundRepay(null);
        setTxStatus("");
        setAmount("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setTxStatus("❌ Tx failed: " + (err.reason || err.message));
    } finally {
      setisRepaying(false);
    }
  }


  /**
   * DECRYPT USER ALLOCATION FOR A SINGLE PROJECT
   */
  async function decryptAllocation(fundId: number) {
    try {
      console.log("decryptAllocation -- decryptAllocation")
      setDecrypting(fundId);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(xlend.address, xlend.abi, signer);

      const ciphertextHandle = await contract.getMyDebt(fundId);
      console.log({ciphertextHandle});
      


      // decrypt value
      let value = BigInt(0);
      const keypair = fhe!.generateKeypair();
      const handleContractPairs = [
          {
              handle: ciphertextHandle,
              contractAddress: xlend.address,
          },
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "1"; // String for consistency
      const contractAddresses = [xlend.address];

      const eip712 = fhe!.createEIP712(
          keypair.publicKey, 
          contractAddresses, 
          startTimeStamp, 
          durationDays
      );
      
      const signature = await signer!.signTypedData(
          eip712.domain,
          {
              UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
          },
          eip712.message,
      );

      console.log('Signature:', signature);

      const result = await fhe.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature!.replace("0x", ""),
          contractAddresses,
          signer!.address,
          startTimeStamp,
          durationDays,
      );
      value = result[ciphertextHandle] as bigint;
      value = BigInt(result[ciphertextHandle]);

      console.log({decryptedValue: result[ciphertextHandle]});
      console.log({decryptedValue: value});


      const revealed = Number(value);
      // if (revealed > 0) {
        setDecrypted((prev) => ({ ...prev, [fundId]: revealed }));
      // }
    } catch (err: any) {
      console.error(err);
      alert("Decryption failed: " + (err.reason || err.message));
    } finally {
      setDecrypting(null);
    }
  }

  
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        setShowMainContent(true);
        setLoading(true);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log({provider, signer});
        const contract = new ethers.Contract(xlend.address, xlend.abi, provider);

        const fundCount = await contract.nextFundId();
        console.log({fundCount})
        // const count = Number(fundCount.toString()) - 1;
        const count = Number(fundCount.toString());

        if (count === 0) {
          setFunds([]);
          return;
        }

        const indices = Array.from({ length: count }, (_, i) => i + 1);

        
        const calls = indices.map(i => contract.funds(i));
        const results = await Promise.all(calls);


        const parsed = results.map((r, index) => ({
          id: index + 1,  
          owner: r[0],  
          clearLiquidity: ethers.formatUnits(String(Number(r[1])), 6),
          liquidityHandle: r[2],
        }));
        console.log({parsed})

        if (mounted) setFunds(parsed); 
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, []);


  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">All Projects</h1>
      {/* <button onClick={() => {
        console.log({fhe});
      }}>log fhe</button> */}

      {/* ALL PROJECT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {funds && funds.map((p) => (
          <div
            key={p.id}
            className="bg-[#111] p-6 rounded-xl border border-gray-700 hover:border-yellow-400 transition"
          >

            <div className="mt-3 space-y-1 text-gray-400 text-sm">
              <p><strong>ID:</strong> {p.id}</p>
              <p><strong>Owner:</strong> {p.owner.slice(0, 6)}...{p.owner.slice(-4)}</p>
              <p><strong>Total Supply:</strong> {p.clearLiquidity}</p>
            </div>

            {/* USER ALLOCATION DISPLAY */}
            <div className="mt-4 p-3 bg-black/40 border border-gray-700 rounded-lg text-sm">
              <strong>Your Allocation:</strong>
              <br />

              {decrypted[p.id] !== undefined ? (
                <span className="text-green-400 font-semibold text-lg">
                  {decrypted[p.id]}
                </span>
              ) : (
                <span className="text-gray-400">
                  Encrypted — decrypt to reveal
                </span>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col gap-3 mt-4">
              {/* BORROW */}
              <button
                onClick={() => setSelectedFund(p)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition"
              >
                Borrow Fund
              </button>
              <button
                onClick={() => setSelectedFundRepay(p)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition"
              >
                Repay
              </button>

              {/* DECRYPT */}
              <button
                onClick={() => decryptAllocation(p.id)}
                disabled={decrypting === p.id}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                {decrypting === p.id
                  ? "Decrypting..."
                  : "Decrypt My Allocation"}
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* BORROW MODAL */}
      {selectedFund && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#111] p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">
              Borrow Fund – {selectedFund.id}
            </h2>

            <label className="block mb-2 text-sm text-gray-400">
              Enter amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white"
              placeholder="e.g. 100"
            />

            {txStatus && (
              <p className="mt-3 text-sm text-yellow-400">{txStatus}</p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={borrow}
                disabled={isBorrowing}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {isBorrowing ? "Processing..." : "Borrow"}
              </button>

              <button
                onClick={() => setSelectedFund(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repay modal */}
      {selectedFundRepay && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#111] p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">
              Repay Fund – {selectedFundRepay.id}
            </h2>

            <label className="block mb-2 text-sm text-gray-400">
              Enter amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white"
              placeholder="e.g. 100"
            />

            {txStatus && (
              <p className="mt-3 text-sm text-yellow-400">{txStatus}</p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={repay}
                disabled={isRepaying}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {isBorrowing ? "Processing..." : "Repay"}
              </button>

              <button
                onClick={() => setSelectedFundRepay(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
