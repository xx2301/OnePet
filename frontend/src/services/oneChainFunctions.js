// import { Transaction } from '@onelabs/sui';
// import { PACKAGE_ID, client } from './oneChainClient';

// // Generic function to call any Move function
// export const callMoveFunction = async (targetModule, args = [], gasBudget = 20000000) => {
//   if (!window.onewallet) throw new Error("Please install One Wallet first");

//   const tx = new Transaction();
//   tx.moveCall({
//     target: `${PACKAGE_ID}::${targetModule}`,
//     arguments: args.map(arg => {
//       if (typeof arg === "string" && arg.startsWith("0x")) return tx.object(arg);
//       if (typeof arg === "string") return tx.pure(Array.from(new TextEncoder().encode(arg)), "vector<u8>");
//       return tx.pure(arg);
//     })
//   });
//   tx.setGasBudget(gasBudget);

//   const result = await window.onewallet.signAndExecuteTransaction({ transaction: tx });
//   return result;
// };

// // Fetch user-owned objects
// export const getUserObjects = async (userAddress, objectType) => {
//   const objects = await client.getOwnedObjects({ owner: userAddress, filter: { StructType: objectType } });
//   return objects.data || [];
// };
