import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Transaction } from "@mysten/sui/transactions";

export async function submitMoveCall({
  pkg,
  module,
  func,
  args = [],
  typeArgs = [],
  gasBudget = 50_000_000,
}) {
  const wallet =
    window.onechainWallet || window.onewallet || window.oneWallet;

  if (!wallet) throw new Error("Wallet not detected");

  try {
    console.log("Executing Move Call:", `${pkg}::${module}::${func}`);
    console.log("Raw args:", args);
    console.log("Type args:", typeArgs);
    
    // Log available wallet methods for debugging
    console.log("Available wallet methods:", Object.keys(wallet).filter(k => typeof wallet[k] === 'function'));

    // Create Sui transaction block
    const tx = new TransactionBlock();
    const target = `${pkg}::${module}::${func}`;

    // Process arguments: handle object refs (@...) and pure values
    const processedArgs = args.map((a, idx) => {
      // Object reference starts with @
      if (typeof a === 'string' && a.startsWith('@')) {
        const objId = a.slice(1);
        console.log(`Arg ${idx}: Object reference ->`, objId);
        return tx.object(objId);
      }
      // Array -> pass as-is for vector<u8>, let SDK handle encoding
      if (Array.isArray(a)) {
        console.log(`Arg ${idx}: Array (vector<u8>) length:`, a.length);
        // Try passing as Uint8Array
        return tx.pure(new Uint8Array(a));
      }
      // Pure value (string, number, boolean)
      console.log(`Arg ${idx}: Pure value ->`, a);
      return tx.pure(a);
    });

    console.log("Processed args count:", processedArgs.length);

    tx.moveCall({
      target,
      arguments: processedArgs,
      typeArguments: typeArgs,
    });

    tx.setGasBudget(gasBudget);

    // Try multiple wallet signing methods
    let result;
    let lastError;
    
    // Method -2: Use wallet.request method with raw transaction data
    if (typeof wallet.request === 'function') {
      try {
        console.log("Trying: wallet.request with sui_signAndExecuteTransactionBlock");
        
        // Get sender address
        const accounts = await wallet.getAccounts();
        console.log("Accounts:", accounts);
        // accounts is array of strings, not objects
        const sender = accounts[0];
        console.log("Sender address:", sender);
        
        if (sender) {
          // Set sender before building
          tx.setSender(sender);
          
          // Build transaction with sender - use SuiClient from @mysten/sui.js (compatible with TransactionBlock)
          const { SuiClient } = await import('@mysten/sui.js/client');
          const client = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' });
          
          const txBytes = await tx.build({ client });
          console.log("Transaction built, bytes length:", txBytes.length);
          
          result = await wallet.request({
            method: 'sui_signAndExecuteTransactionBlock',
            params: {
              transactionBlock: Array.from(txBytes),
              options: {
                showEvents: true,
                showEffects: true,
                showObjectChanges: true,
              },
            },
          });
          
          console.log("✓ Tx success via wallet.request:", result);
          return result;
        } else {
          console.warn("✗ wallet.request: No sender address found");
        }
      } catch (err) {
        lastError = err;
        console.warn("✗ wallet.request failed:", err.message, err);
      }
    }
    
    // Method -1: Try with new Transaction class from @mysten/sui
    try {
      console.log("Trying: Transaction class from @mysten/sui");
      const newTx = new Transaction();
      
      // Process arguments same way
      const processedArgs = args.map((a) => {
        if (typeof a === 'string' && a.startsWith('@')) {
          return newTx.object(a.slice(1));
        }
        if (Array.isArray(a)) {
          return newTx.pure(Uint8Array.from(a));
        }
        return newTx.pure(a);
      });

      newTx.moveCall({
        target,
        arguments: processedArgs,
        typeArguments: typeArgs,
      });

      newTx.setGasBudget(gasBudget);

      result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: newTx,
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
      console.log("✓ Tx success with Transaction class:", result);
      return result;
    } catch (err) {
      lastError = err;
      console.warn("✗ Transaction class from @mysten/sui failed:", err.message);
    }
    
    // Method 0: signTransactionBlock (wallet has this!)
    if (typeof wallet.signTransactionBlock === 'function') {
      try {
        console.log("Trying: signTransactionBlock");
        
        // Serialize the transaction block to bytes
        const transactionBlockBytes = await tx.build({ provider: {
          getReferenceGasPrice: async () => 1000n,
        }});
        
        const { signature } = await wallet.signTransactionBlock({
          transactionBlock: transactionBlockBytes,
        });
        console.log("Transaction signed, executing...");
        
        // Now execute it via RPC
        const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";
        const executeRes = await fetch(SUI_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sui_executeTransactionBlock",
            params: [
              Array.from(transactionBlockBytes),
              [signature],
              {
                showEvents: true,
                showEffects: true,
                showObjectChanges: true,
              },
            ],
          }),
        });
        
        const executeData = await executeRes.json();
        if (executeData.error) {
          throw new Error(executeData.error.message || "Execution failed");
        }
        
        result = executeData.result;
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ signTransactionBlock failed:", err.message);
      }
    }
    
    // Method 1: signAndExecuteTransactionBlock with transactionBlock (standard)
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      try {
        console.log("Trying: signAndExecuteTransactionBlock with transactionBlock");
        result = await wallet.signAndExecuteTransactionBlock({
          transactionBlock: tx,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
          },
        });
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ signAndExecuteTransactionBlock(transactionBlock) failed:", err.message);
      }
    }

    // Method 2: signAndExecuteTransactionBlock with transaction parameter
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      try {
        console.log("Trying: signAndExecuteTransactionBlock with transaction");
        result = await wallet.signAndExecuteTransactionBlock({
          transaction: tx,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
          },
        });
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ signAndExecuteTransactionBlock(transaction) failed:", err.message);
      }
    }

    // Method 3: signAndExecuteTransaction
    if (typeof wallet.signAndExecuteTransaction === 'function') {
      try {
        console.log("Trying: signAndExecuteTransaction");
        result = await wallet.signAndExecuteTransaction({
          transaction: tx,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
          },
        });
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ signAndExecuteTransaction failed:", err.message);
      }
    }

    // Method 4: signTransaction + executeTransaction (separate calls)
    if (typeof wallet.signTransaction === 'function') {
      try {
        console.log("Trying: signTransaction");
        const signed = await wallet.signTransaction({ transaction: tx });
        console.log("Transaction signed:", signed);
        
        if (typeof wallet.executeTransaction === 'function') {
          console.log("Trying: executeTransaction");
          result = await wallet.executeTransaction(signed);
          console.log("✓ Tx success:", result);
          return result;
        }
      } catch (err) {
        lastError = err;
        console.warn("✗ signTransaction/executeTransaction failed:", err.message);
      }
    }

    // Method 5: executeMoveCall (if wallet has custom method)
    if (typeof wallet.executeMoveCall === 'function') {
      try {
        console.log("Trying: executeMoveCall");
        result = await wallet.executeMoveCall({
          packageObjectId: pkg,
          module,
          function: func,
          typeArguments: typeArgs,
          arguments: args,
          gasBudget,
        });
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ executeMoveCall failed:", err.message);
      }
    }

    // Method 6: Direct tx pass (no wrapper object)
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      try {
        console.log("Trying: direct tx pass");
        result = await wallet.signAndExecuteTransactionBlock(tx);
        console.log("✓ Tx success:", result);
        return result;
      } catch (err) {
        lastError = err;
        console.warn("✗ Direct tx pass failed:", err.message);
      }
    }

    console.error("All methods failed. Last error:", lastError);
    throw new Error(`All wallet signing methods failed. Last error: ${lastError?.message || 'Unknown'}. Available methods: ${Object.keys(wallet).filter(k => typeof wallet[k] === 'function').join(', ')}`);

  } catch (error) {
    console.error("MoveCall failed:", error);
    throw error;
  }
}
