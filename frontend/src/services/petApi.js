// services/petApi.js
import { submitMoveCall } from "./walletTx";
import { 
  PACKAGE_ID, 
  GLOBAL_STATS_ID, 
  CLOCK_ID 
} from "../constants";

// 🚀 First Time Setup
export async function initializeUserAccount(username) {
  // Convert username to bytes array for vector<u8>
  const encoder = new TextEncoder();
  const usernameBytes = Array.from(encoder.encode(username));
  
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "user_initializer",
    func: "initialize_user_account",
    args: [usernameBytes, '@' + GLOBAL_STATS_ID],
    gasBudget: 50_000_000
  });
}

// 🏠 Pet Stats
export async function initUserState() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "init_user_state",
    args: [],
    gasBudget: 30_000_000
  });
}

export async function createFirstPet(userStateId, name, petType) {
  // Convert name to bytes for vector<u8>
  const encoder = new TextEncoder();
  const nameBytes = Array.from(encoder.encode(name));
  
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "create_pet",
    args: ['@' + userStateId, nameBytes, petType, '@' + GLOBAL_STATS_ID],
    gasBudget: 50_000_000
  });
}

export async function createAdditionalPet(name, petType, coinId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "create_additional_pet",
    args: [name, petType, coinId, GLOBAL_STATS_ID],
    gasBudget: 50_000_000
  });
}

export async function feedPet(petId, cooldownId, inventoryId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "feed_pet",
    args: ['@' + petId, '@' + cooldownId, '@' + inventoryId, '@' + GLOBAL_STATS_ID, '@' + CLOCK_ID],
    gasBudget: 40_000_000
  });
}

export async function playPet(petId, cooldownId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "play_pet",
    args: ['@' + petId, '@' + cooldownId, '@' + GLOBAL_STATS_ID, '@' + CLOCK_ID],
    gasBudget: 40_000_000
  });
}

export async function drinkPet(petId, cooldownId, inventoryId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "drink_pet",
    args: [petId, cooldownId, inventoryId, GLOBAL_STATS_ID, CLOCK_ID],
    gasBudget: 40_000_000
  });
}

export async function sleepPet(petId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "sleep_pet",
    args: ['@' + petId, '@' + GLOBAL_STATS_ID],
    gasBudget: 30_000_000
  });
}

export async function levelUpPet(petId, expGained) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_stats",
    func: "level_up",
    args: [petId, expGained],
    gasBudget: 30_000_000
  });
}

// ⚔️ Battle System
export async function createMonsterBasedOnPetLevel(petId, monsterName) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pve_battle",
    func: "create_monster_based_on_pet_level",
    args: [petId, monsterName],
    gasBudget: 40_000_000
  });
}

export async function createMonster(minLevel, maxLevel, monsterName) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pve_battle",
    func: "create_monster",
    args: [minLevel, maxLevel, monsterName],
    gasBudget: 40_000_000
  });
}

export async function startPveBattle(playerAddress, petId, monsterId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pve_battle",
    func: "start_pve_battle",
    args: [playerAddress, petId, monsterId, GLOBAL_STATS_ID],
    gasBudget: 50_000_000
  });
}

// 🎯 Wheel System
export async function spinWheel(dailyTrackerId, inventoryId, petId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "wheel_system",
    func: "spin_wheel",
    args: ['@' + dailyTrackerId, '@' + inventoryId, '@' + petId],
    gasBudget: 40_000_000
  });
}

// 🏆 Reward System
export async function initDailyReward() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "reward_system",
    func: "init_daily_reward",
    args: [],
    gasBudget: 30_000_000
  });
}

export async function claimDailyReward(dailyRewardId, inventoryId, badgeId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "reward_system",
    func: "claim_daily_reward",
    args: [dailyRewardId, inventoryId, badgeId],
    gasBudget: 40_000_000
  });
}

export async function createAchievement(achievementType) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "reward_system",
    func: "create_achievement",
    args: [achievementType],
    gasBudget: 30_000_000
  });
}

export async function markAchievementComplete(achievementId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "reward_system",
    func: "mark_achievement_complete",
    args: [achievementId],
    gasBudget: 30_000_000
  });
}

export async function checkAchievement(achievementId, inventoryId, badgeId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "reward_system",
    func: "check_achievement",
    args: [achievementId, inventoryId, badgeId],
    gasBudget: 40_000_000
  });
}

// 🛒 Shop System
export async function initShop() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "shop_system",
    func: "init",
    args: [],
    gasBudget: 30_000_000
  });
}

export async function buyItem(shopId, inventoryId, itemId, quantity, coinId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "shop_system",
    func: "buy_item",
    args: [shopId, inventoryId, itemId, quantity, coinId, GLOBAL_STATS_ID],
    gasBudget: 50_000_000
  });
}

// 🎒 Inventory
export async function initInventory() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "inventory",
    func: "init_inventory",
    args: [],
    gasBudget: 30_000_000
  });
}

export async function addItem(inventoryId, itemId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "inventory",
    func: "add_item",
    args: [inventoryId, itemId],
    gasBudget: 30_000_000
  });
}

export async function removeItem(inventoryId, itemId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "inventory",
    func: "remove_item",
    args: [inventoryId, itemId],
    gasBudget: 30_000_000
  });
}

// 👤 Profile Badge
export async function createProfile(username) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "profile_badge",
    func: "create_profile",
    args: [username],
    gasBudget: 30_000_000
  });
}

export async function updateReputation(badgeId, reputationChange) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "profile_badge",
    func: "update_reputation",
    args: [badgeId, reputationChange],
    gasBudget: 30_000_000
  });
}

export async function recordBattleWin(badgeId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "profile_badge",
    func: "record_battle_win",
    args: [badgeId],
    gasBudget: 30_000_000
  });
}

export async function recordPetOwnership(badgeId) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "profile_badge",
    func: "record_pet_ownership",
    args: [badgeId],
    gasBudget: 30_000_000
  });
}

// 💴 Pet Token
export async function mintTestTokens(recipient, amount) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_token",
    func: "mint_test_tokens",
    args: [recipient, amount],
    gasBudget: 30_000_000
  });
}

export async function transferTokens(coinId, toAddress, amount) {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "pet_token",
    func: "transfer_tokens",
    args: [coinId, toAddress, amount],
    gasBudget: 40_000_000
  });
}

// ⏰ Cooldown & Limits
export async function initDailyTracker() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "daily_limits",
    func: "init_daily_tracker",
    args: [],
    gasBudget: 30_000_000
  });
}

export async function initCooldown() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "cooldown_system",
    func: "init_cooldown",
    args: [],
    gasBudget: 30_000_000
  });
}

// 📊 Stat System
export async function initGlobalStats() {
  return await submitMoveCall({
    pkg: PACKAGE_ID,
    module: "stat_system",
    func: "init",
    args: [],
    gasBudget: 30_000_000
  });
}

// Constants for easier usage
export const PET_TYPES = {
  DOG: 0,
  CAT: 1,
  RABBIT: 2,
  HAMSTER: 3
};

export const ITEM_IDS = {
  FOOD: 1,        // -10 hunger
  TOY: 2,         // +10 happiness
  DRINK: 3,       // +20 energy
  MEDICINE: 4     // +30 health
};

export const ACHIEVEMENT_TYPES = {
  FIRST_PET: 0,
  FIRST_BATTLE: 1,
  LEVEL_5: 2
};

// Helper function to get user objects
export async function getUserObjects(address) {
  try {
    const res = await fetch("https://rpc-testnet.onelabs.cc:443", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObjectsOwnedByAddress",
        params: [address],
      }),
    });
    const data = await res.json();
    return data?.result || [];
  } catch (err) {
    console.warn("Failed to fetch user objects", err);
    return [];
  }
}