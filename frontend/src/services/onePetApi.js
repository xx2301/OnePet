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

// Create additional pet (costs 50 OCT)
export async function buyAdditionalPet(userStateId, petName, petType, paymentCoinId) {
  const encoder = new TextEncoder();
  const nameBytes = Array.from(encoder.encode(petName));

  console.log('Buying additional pet:', { petName, petType, userStateId, paymentCoinId });

  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'pet_stats',
    function: 'create_pet',
    args: [
      { type: 'object', value: userStateId },
      { type: 'pure', value: nameBytes, valueType: 'vector<u8>' },
      { type: 'pure', value: petType, valueType: 'u8' },
      { type: 'object', value: paymentCoinId },
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
  let allObjects = [];
  let hasNextPage = true;
  let cursor = null;

  // Fetch all objects with pagination (RPC limits to 50 per request)
  while (hasNextPage) {
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
          },
          cursor,
          50 // Fetch 50 at a time
        ]
      })
    });
    
    const data = await response.json();
    const result = data.result || {};
    const objects = result.data || [];
    
    allObjects = allObjects.concat(objects);
    
    hasNextPage = result.hasNextPage || false;
    cursor = result.nextCursor || null;
    
    console.log(`📄 Fetched ${objects.length} objects (Total: ${allObjects.length}, HasMore: ${hasNextPage})`);
  }
  
  return allObjects;
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

// Check if user can spin (using Move view function)
export async function checkCanSpin(dailyTrackerId) {
  try {
    // Convert to MILLISECONDS (contract expects milliseconds, not seconds)
    const currentTime = Date.now();
    console.log('Checking can spin with time (milliseconds):', currentTime);
    
    const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
    if (!wallet) {
      throw new Error('No wallet found');
    }

    // One Wallet / OneChain may not expose a `getClient()` helper. Create a Sui RPC client
    // directly for devInspect. This uses the same RPC used elsewhere in the app.
    const { SuiClient } = await import('@mysten/sui/client');
    const { TransactionBlock } = await import('@mysten/sui.js/transactions');
    const RPC_URL = 'https://rpc-testnet.onelabs.cc:443';
    const client = new SuiClient({ url: RPC_URL });
    
    // Build transaction block for view call
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::daily_limits::can_spin`,
      arguments: [
        txb.object(dailyTrackerId),
        txb.pure(currentTime, 'u64')
      ]
    });

    // Inspect the transaction (doesn't execute on chain)
    const result = await client.devInspectTransactionBlock({
      sender: localStorage.getItem('suiAddress'),
      transactionBlock: txb
    });

    console.log('Can spin result (devInspect):', result);

    // Try several strategies to decode the boolean return value.
    try {
      const res0 = result?.results?.[0];
      const returnValues = res0?.returnValues || res0?.return_value || result?.returnValues || [];

      // Case 1: already parsed nested array like [[1]]
      if (Array.isArray(returnValues) && returnValues.length > 0) {
        const first = returnValues[0];

        // Check if it's already a boolean
        if (typeof first === 'boolean') {
          console.log('Decoded canSpin from boolean:', first);
          return first;
        }

        // Check if it's [value, type] format (standard Sui return format)
        if (Array.isArray(first) && first.length === 2) {
          const [value, type] = first;
          if (type === 'bool') {
            const canSpin = Boolean(value);
            console.log('Decoded canSpin from [value, type] bool:', canSpin);
            return canSpin;
          }
        }

        if (Array.isArray(first) && first.length > 0 && typeof first[0] === 'number') {
          const canSpin = first[0] === 1;
          console.log('Decoded canSpin from nested numeric array:', canSpin);
          return canSpin;
        }

        // Case 2: first entry is a base64/hex string -> decode
        if (typeof first === 'string') {
          let bytes = null;
          try {
            // Try base64
            const str = first;
            // base64 may include padding and non-printable bytes
            const bin = atob(str);
            bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
          } catch (e) {
            void e;
            // Not base64 -> maybe hex like 0x01
            try {
              const hex = first.replace(/^0x/, '');
              const pairs = hex.match(/.{1,2}/g) || [];
              bytes = Uint8Array.from(pairs.map(p => parseInt(p, 16)));
            } catch (e2) {
              void e2;
              bytes = null;
            }
          }

          if (bytes && bytes.length > 0) {
            const canSpin = bytes[0] === 1;
            console.log('Decoded canSpin from string returnValue:', canSpin, 'bytes:', bytes);
            return canSpin;
          }
        }
      }
    } catch (decodeErr) {
      console.warn('Failed to decode devInspect return value for can_spin:', decodeErr);
    }

    // If we couldn't decode a boolean, be conservative and return false
    console.warn('Could not parse can_spin return value, defaulting to false');
    return false;
  } catch (error) {
    console.error('Error checking can spin:', error);
    return false;
  }
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

// Claim daily check-in reward
export async function claimDailyReward(dailyRewardId, inventoryId, badgeId) {
  console.log('Claiming daily reward:', { dailyRewardId, inventoryId, badgeId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'reward_system',
    function: 'claim_daily_reward',
    args: [
      { type: 'object', value: dailyRewardId },
      { type: 'object', value: inventoryId },
      { type: 'object', value: badgeId }
    ]
  });
}

// Create achievement tracker
export async function createAchievement(achievementType) {
  console.log('Creating achievement:', { achievementType });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'reward_system',
    function: 'create_achievement',
    args: [
      { type: 'pure', value: achievementType, valueType: 'u64' }
    ]
  });
}

// Mark achievement as completed (called by system/user when achievement is earned)
export async function markAchievementComplete(achievementId) {
  console.log('Marking achievement complete:', { achievementId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'reward_system',
    function: 'mark_achievement_complete',
    args: [
      { type: 'object', value: achievementId }
    ]
  });
}

// Claim achievement rewards (after achievement is marked complete)
export async function claimAchievement(achievementId, inventoryId, badgeId) {
  console.log('Claiming achievement:', { achievementId, inventoryId, badgeId });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'reward_system',
    function: 'check_achievement',
    args: [
      { type: 'object', value: achievementId },
      { type: 'object', value: inventoryId },
      { type: 'object', value: badgeId }
    ]
  });
}

// Create profile badge
export async function createProfile(username) {
  console.log('Creating profile:', { username });
  return await executeOneChainTransaction({
    packageId: PACKAGE_ID,
    module: 'profile_badge',
    function: 'create_profile',
    args: [
      { type: 'pure', value: Array.from(new TextEncoder().encode(username)), valueType: 'vector<u8>' }
    ]
  });
}
