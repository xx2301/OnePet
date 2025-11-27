// Fresh OneChain transaction helper using only @mysten/sui SDK
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';

const RPC_URL = 'https://rpc-testnet.onelabs.cc:443';

export async function executeOneChainTransaction({ 
  packageId, 
  module, 
  function: func, 
  args = [],
  typeArgs = []
}) {
  const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
  
  if (!wallet) {
    throw new Error('OneWallet not found. Please install One Wallet extension.');
  }

  // Get connected account
  const accounts = await wallet.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet account connected');
  }
  const sender = accounts[0];

  console.log('Building transaction for:', `${packageId}::${module}::${func}`);
  console.log('Sender:', sender);
  console.log('Args:', args);

  // Create SuiClient for building
  const client = new SuiClient({ url: RPC_URL });

  // Create transaction using @mysten/sui Transaction class
  const tx = new Transaction();
  
  // Don't set sender - let wallet handle it
  // tx.setSender(sender);
  
  // Set gas budget explicitly
  tx.setGasBudget(50000000);
  
  // For OneChain, we need to specify gas coins manually since they use OCT
  // Fetch OCT coins for gas
  try {
    const coins = await client.getCoins({
      owner: sender,
      coinType: '0x2::oct::OCT'
    });
    
    if (coins.data && coins.data.length > 0) {
      console.log('Found OCT coins for gas:', coins.data.length);
      
      // Check if any args are coin object IDs (to avoid using the same coin for gas and payment)
      const usedCoinIds = args
        .filter(arg => typeof arg === 'object' && arg.type === 'object')
        .map(arg => arg.value);
      
      // Find a coin that's not being used in the transaction
      const gasCoin = coins.data.find(c => !usedCoinIds.includes(c.coinObjectId));
      
      if (gasCoin) {
        console.log('Using gas coin:', gasCoin.coinObjectId, '(not used in transaction)');
        tx.setGasPayment([{
          objectId: gasCoin.coinObjectId,
          version: gasCoin.version,
          digest: gasCoin.digest
        }]);
      } else {
        console.warn('All coins are being used in transaction, using first coin for gas');
        tx.setGasPayment([{
          objectId: coins.data[0].coinObjectId,
          version: coins.data[0].version,
          digest: coins.data[0].digest
        }]);
      }
    } else {
      console.warn('No OCT coins found, transaction may fail');
    }
  } catch (e) {
    console.warn('Failed to fetch OCT coins:', e);
  }
  
  // Process arguments - convert to transaction arguments
  const txArgs = args.map((arg, idx) => {
    if (typeof arg === 'object' && arg.type === 'object') {
      console.log(`Arg ${idx}: Object ref`, arg.value);
      // Just use tx.object() - SDK will auto-detect if it's shared
      return tx.object(arg.value);
    } else if (typeof arg === 'object' && arg.type === 'pure') {
      console.log(`Arg ${idx}: Pure value`, arg.value, 'valueType:', arg.valueType);
      
      // Handle different value types with BCS serialization
      if (Array.isArray(arg.value)) {
        console.log(`Arg ${idx}: Serializing array as vector<u8>`);
        return tx.pure(bcs.vector(bcs.U8).serialize(arg.value));
      } else if (arg.valueType === 'u8') {
        console.log(`Arg ${idx}: Serializing as u8`);
        return tx.pure(bcs.u8().serialize(arg.value));
      } else if (arg.valueType === 'u64') {
        console.log(`Arg ${idx}: Serializing as u64`);
        return tx.pure(bcs.u64().serialize(arg.value));
      } else if (arg.valueType) {
        // If a specific type is provided, use it
        console.log(`Arg ${idx}: Using specified type ${arg.valueType}`);
        return tx.pure(arg.valueType, arg.value);
      }
      
      return tx.pure(arg.value);
    } else {
      console.log(`Arg ${idx}: Auto pure`, arg);
      return tx.pure(arg);
    }
  });

  // Add move call
  tx.moveCall({
    target: `${packageId}::${module}::${func}`,
    arguments: txArgs,
    typeArguments: typeArgs,
  });

  console.log('Transaction built, attempting to sign and execute...');
  
  // Debug: Try to get more detailed error by doing a dry run ourselves
  try {
    console.log('Attempting local dry run...');
    tx.setSender(sender);
    const dryRunResult = await client.dryRunTransactionBlock({
      transactionBlock: await tx.build({ client })
    });
    console.log('Dry run result:', dryRunResult);
    if (dryRunResult.effects.status.status !== 'success') {
      console.error('Dry run failed with status:', dryRunResult.effects.status);
      throw new Error(`Transaction would fail: ${dryRunResult.effects.status.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Dry run error:', err.message);
    throw new Error(`Transaction validation failed: ${err.message}`);
  }

  // Try signing with wallet
  try {
    // Method 1: Try signAndExecuteTransaction with Transaction object directly (no build)
    if (wallet.signAndExecuteTransaction) {
      console.log('Trying: signAndExecuteTransaction with tx object');
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
        chain: 'one:testnet',
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
      console.log('✓ Transaction successful:', result);
      return result;
    }
  } catch (err) {
    console.warn('signAndExecuteTransaction failed:', err.message, err);
    // If user rejected, throw immediately
    if (err.message.includes('reject') || err.message.includes('denied') || err.message.includes('User denied') || err.code === 4001) {
      throw new Error('Transaction was rejected by user');
    }
  }

  // Method 2: Try signAndExecuteTransactionBlock with tx object
  try {
    if (wallet.signAndExecuteTransactionBlock) {
      console.log('Trying: signAndExecuteTransactionBlock with tx object');
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        chain: 'one:testnet',
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
      console.log('✓ Transaction successful:', result);
      return result;
    }
  } catch (err) {
    console.warn('signAndExecuteTransactionBlock with object failed:', err.message, err);
    if (err.message.includes('reject') || err.message.includes('denied') || err.message.includes('User denied') || err.code === 4001) {
      throw new Error('Transaction was rejected by user');
    }
  }

  // Method 2: Build with client and use signAndExecuteTransactionBlock with bytes
  try {
    console.log('Trying: Build and serialize transaction');
    // Set sender before building
    tx.setSender(sender);
    const txBytes = await tx.build({ client });
    
    console.log('Transaction bytes built, length:', txBytes.length);
    
    if (wallet.signAndExecuteTransactionBlock) {
      // Try with base64 encoded transaction
      const base64Tx = btoa(String.fromCharCode(...txBytes));
      console.log('Transaction as base64:', base64Tx.substring(0, 50) + '...');
      
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: base64Tx,
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
      console.log('✓ Transaction successful via base64:', result);
      return result;
    }
  } catch (err) {
    console.warn('Build and serialize failed:', err.message);
    // If user rejected, throw with clear message
    if (err.message.includes('reject') || err.message.includes('denied') || err.message.includes('User denied') || err.code === 4001) {
      throw new Error('Transaction was rejected by user');
    }
    throw new Error(`Transaction failed: ${err.message}`);
  }

  throw new Error('No compatible wallet signing method found');
}
