// Simplified API wrapper for OnePet Move calls
import { executeOneChainTransaction } from './oneChainTx';
import { PACKAGE_ID, GLOBAL_STATS_ID, CLOCK_ID, SHOP_SYSTEM_ID } from '../constants';

// Initialize user account
export async function initializeUserAccount(username) {
  // Convert username string to bytes array for vector<u8>
  const encoder = new TextEncoder();
  const usernameBytes = Array.from(encoder.encode(username));

  console.log('Initializing user with username:', username);
  console.log('Username bytes:', usernameBytes);
  console.log('Username bytes length:', usernameBytes.length);

  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'user_initializer',
    function: 'initialize_user_account',
    args: [
      { type: 'pure', value: usernameBytes, valueType: 'vector<u8>' },
      { type: 'object', value: GLOBAL_STATS_ID }  // Let SDK auto-detect shared object
    ]
  });
}

// Create first pet (free for new users)
export async function createFirstPet(userStateId, petName, petType) {
  const encoder = new TextEncoder();
  const nameBytes = Array.from(encoder.encode(petName));

  console.log('Creating first pet:', { petName, petType, userStateId });
  console.log('Pet name bytes:', nameBytes);

  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'create_first_pet',
    args: [
      { type: 'object', value: userStateId },
      { type: 'pure', value: nameBytes, valueType: 'vector<u8>' },
      { type: 'pure', value: petType, valueType: 'u8' },
      { type: 'object', value: GLOBAL_STATS_ID }
    ]
  });
}

// Feed pet (requires cooldown + inventory items)
export async function feedPet(petId, cooldownId, inventoryId) {
  console.log('Feeding pet:', { petId, cooldownId, inventoryId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'feed_pet',
    args: [
      { type: 'object', value: petId },
      { type: 'object', value: cooldownId },
      { type: 'object', value: inventoryId },
      { type: 'object', value: GLOBAL_STATS_ID },
      { type: 'object', value: CLOCK_ID }
    ]
  });
}

// Play with pet
export async function playPet(petId, cooldownId) {
  console.log('Playing with pet:', { petId, cooldownId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'play_pet',
    args: [
      { type: 'object', value: petId },
      { type: 'object', value: cooldownId },
      { type: 'object', value: GLOBAL_STATS_ID },
      { type: 'object', value: CLOCK_ID }
    ]
  });
}

// Sleep pet
export async function sleepPet(petId) {
  console.log('Pet sleeping:', { petId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'sleep_pet',
    args: [
      { type: 'object', value: petId },
      { type: 'object', value: GLOBAL_STATS_ID }
    ]
  });
}

// Fetch user objects from RPC
export async function getUserObjects(address) {
  const response = await fetch('https://rpc-testnet.onelabs.cc:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getOwnedObjects',
      params: [
        address,
        {
          filter: { Package: PACKAGE_ID },
          options: { showType: true, showContent: true, showDisplay: true }
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.result?.data || [];
}

// Add item to inventory
export async function addItemToInventory(inventoryId, itemId) {
  console.log('Adding item to inventory:', { inventoryId, itemId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'inventory',
    function: 'add_item',
    args: [
      { type: 'object', value: inventoryId },
      { type: 'pure', value: itemId, valueType: 'u64' }
    ]
  });
}

// Buy item from shop
export async function buyShopItem(shopId, inventoryId, itemId, quantity, paymentCoinId) {
  console.log('Buying item from shop:', { shopId, inventoryId, itemId, quantity, paymentCoinId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'shop_system',
    function: 'buy_item',
    args: [
      { type: 'object', value: shopId },
      { type: 'object', value: inventoryId },
      { type: 'pure', value: itemId, valueType: 'u64' },
      { type: 'pure', value: quantity, valueType: 'u64' },
      { type: 'object', value: paymentCoinId },
      { type: 'object', value: GLOBAL_STATS_ID }
    ]
  });
}

// Get OCT balance
export async function getOCTBalance(address) {
  const response = await fetch('https://rpc-testnet.onelabs.cc:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getBalance',
      params: [address, '0x2::oct::OCT']
    })
  });
  
  const data = await response.json();
  return data.result?.totalBalance || '0';
}

// Get PetToken balance
export async function getPetTokenBalance(address) {
  const response = await fetch('https://rpc-testnet.onelabs.cc:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getOwnedObjects',
      params: [
        address,
        {
          filter: { StructType: `${PACKAGE_ID}::pet_token::PetCoin` },
          options: { showContent: true }
        }
      ]
    })
  });
  
  const data = await response.json();
  const coins = data.result?.data || [];
  
  // Sum up all PetCoin balances
  let totalBalance = 0;
  for (const coin of coins) {
    const balance = coin?.data?.content?.fields?.balance;
    if (balance) {
      totalBalance += Number(balance);
    }
  }
  
  return totalBalance;
}

// Mint starter PetTokens
export async function mintStarterTokens(address, amount = 100) {
  console.log('Minting starter tokens:', { address, amount });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_token',
    function: 'mint_test_tokens',
    args: [
      { type: 'pure', value: address, valueType: 'address' },
      { type: 'pure', value: amount, valueType: 'u64' }
    ]
  });
}

// Create monster based on pet level
export async function createMonsterBasedOnPetLevel(petId, monsterName) {
  const encoder = new TextEncoder();
  const nameBytes = Array.from(encoder.encode(monsterName));
  
  console.log('Creating monster:', { petId, monsterName });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pve_battle',
    function: 'create_monster_based_on_pet_level',
    args: [
      { type: 'object', value: petId },
      { type: 'pure', value: nameBytes, valueType: 'vector<u8>' }
    ]
  });
}

// Start PvE battle
export async function startPvEBattle(playerAddress, petId, monsterId) {
  console.log('Starting PvE battle:', { playerAddress, petId, monsterId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pve_battle',
    function: 'start_pve_battle',
    args: [
      { type: 'pure', value: playerAddress, valueType: 'address' },
      { type: 'object', value: petId },
      { type: 'object', value: monsterId },
      { type: 'object', value: GLOBAL_STATS_ID }
    ]
  });
}

// Remove item from inventory
export async function removeItemFromInventory(inventoryId, itemId) {
  console.log('Removing item from inventory:', { inventoryId, itemId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'inventory',
    function: 'remove_item',
    args: [
      { type: 'object', value: inventoryId },
      { type: 'pure', value: itemId, valueType: 'u64' }
    ]
  });
}

// Spin the daily wheel
export async function spinWheel(dailyTrackerId, inventoryId, petId) {
  console.log('Spinning wheel:', { dailyTrackerId, inventoryId, petId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'wheel_system',
    function: 'spin_wheel',
    args: [
      { type: 'object', value: dailyTrackerId },
      { type: 'object', value: inventoryId },
      { type: 'object', value: petId }
    ]
  });
}

// Level up pet
export async function levelUpPet(petId, expGained) {
  console.log('Leveling up pet:', { petId, expGained });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'level_up',
    args: [
      { type: 'object', value: petId },
      { type: 'pure', value: expGained, valueType: 'u64' }
    ]
  });
}
