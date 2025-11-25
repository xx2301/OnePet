import React, { useState } from 'react';
import { PACKAGE_ID } from './constants';

export default function MintTokens() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) {
      setMessage("❌ Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setMessage("⏳ Minting 1000 test OCT tokens...");

      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Import Transaction and bcs from @mysten/sui
      const { Transaction } = await import('@mysten/sui/transactions');
      
      const tx = new Transaction();
      
      // Mint test PetTokens - call mint_test_tokens function
      tx.moveCall({
        target: `${PACKAGE_ID}::pet_token::mint_test_tokens`,
        arguments: [
          tx.pure.address(addr),
          tx.pure.u64(1000)
        ]
      });

      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        }
      });

      console.log('Mint result:', result);
      setMessage("✅ Successfully minted 1000 PetTokens!");
      
      // Refresh after 2 seconds
      setTimeout(() => {
        window.dispatchEvent(new Event('balanceUpdate'));
      }, 2000);

    } catch (error) {
      console.error('Mint error:', error);
      setMessage(`❌ Failed to mint: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>🪙 Test Token Faucet</h3>
      <p>Get free PetTokens for testing</p>
      <button 
        onClick={handleMint} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {loading ? 'Minting...' : 'Mint 1000 Tokens'}
      </button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
