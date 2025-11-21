Move Contract API Reference

## 🚀 First Time Setup
### initialize_user_account(username: vector<u8>, ctx: &mut TxContext)
- Description: One-time setup for new users (creates all required objects)
- Creates: UserState, PlayerInventory, DailyTracker, ActionCooldown, DailyReward, ProfileBadge
- Note: Call this once per user before any other operations
- Parameters: username (1-10 characters)

## 🏠 Pet Stats
### init_user_state(ctx: &mut TxContext)
- Initialize user, for creating first pet

### create_first_pet(user_state: &mut UserState, name: vector<u8>, pet_type: u8, ctx: &mut tx_context::TxContext)
- Creates a new pet NFT
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster)

### create_additional_pet(name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, ctx: &mut tx_context::TxContext)
- Creates others pet NFT by paying token
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster)
- Need to pay 50 OCT for buying another pet

### feed_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown,ctx: &mut tx_context::TxContext)
- To feed pet
- Increases hunger by 30, energy by 10
- Caps at maximum 100
- Cooling time 1 hr

### play_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown, ctx: &mut tx_context::TxContext)
- To play with pet
- Increases happiness by 25, decreases enegry by 10
- Cooling time 30 mins

### sleep_pet(pet: &mut PetNFT)
- Let pet to sleep
- Increases energy to 100, decreases happiness by 10

## ⚔️ Battle System
### create_monster_based_on_pet_level(pet_level: u64, name: vector<u8>, ctx: &mut TxContext)
- Recommended: Automatically create monsters of appropriate levels based on pet level
- Monster level range: Pet level ±2 (minimum level 1)

### start_pve_battle(player: address, pet: &mut pet_stats::PetNFT, monster: &mut Monster, stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) -> BattleResult
- Player vs Environment (Computer)
- Return BattleResult of "winner", "exp_gain" and "token"...
- Win condition: Pet level >= Monster

## 🎯 Wheel System
### spin_wheel(daily_tracker: &mut daily_limits::DailyTracker, player_inventory: &mut inventory::PlayerInventory, pet: &mut pet_stats::PetNFT, ctx: &mut tx_context::TxContext) -> WheelReward
- Daily wheel spin for entry user
- Reward Percentage: 
  - 40%: Pet Token (10-30 Pet Token)
  - 30%: Experience (50-100 Exp)
  - 25%: Item Reward (randomly)
  - 5%: Rare Price (50-100 Pet Token)

## 🏆 Reward System
### init_daily_reward(ctx: &mut tx_context::TxContext)
- Initialize dailey reward for player
- Extra reward for check in streak daily

### create_achievement(achievement_type: u64,ctx: &mut tx_context::TxContext)
- Achievement Board like:
  - 0: Got the first pet
  - 1: Complete first battle
  - 2: Pet level has reached level 5

### mark_achievement_complete(achievement: &mut Achievement)
- Set the task has completed in system

### check_achievement(achievement: &mut Achievement, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, ctx: &mut tx_context::TxContext)
- Check completed task and get rewards

## 🛒 Shop System
### init(ctx: &mut TxContext)
- Initialize shop to create shared store object

### buy_item(shop: &mut ShopInventory, player_inventory: &mut PlayerInventory, item_id: u64, quantity: u64, payment: &mut coin::Coin<oct::OCT>, ctx: &mut tx_context::TxContext)
- Let user to buy items
- Parameters: 
  - item_id 
    - 1=ITEM_FOOD (-10 hunger)
    - 2=ITEM_TOY (+10 happiness)
    - 3=ITEM_DRINK (+20 energy)
    - 4=ITEM MEDICINE (+30 health)
  - quantity (u64)

## 🎒 Inventory
### init_inventory(ctx: &mut tx_context::TxContext)
- Initialize their inventory for user

### add_item(inventory: &mut PlayerInventory, item_id: u64)
- Add new item to inventory

### remove_item(inventory: &mut PlayerInventory, item_id: u64)
- Remove item from inventory

### get_inventory_items(inventory: &PlayerInventory) -> &vector<u64>
- Get inventory items

### has_item(inventory: &PlayerInventory, item_id: u64) -> bool
- Check the user whether has the item

## 👤 Profile Badge
### create_profile(username: vector<u8>, ctx: &mut tx_context::TxContext)
- Create profile for new user
- Username limit with 10 characters

### update_reputation(badge: &mut ProfileBadge, reputation_change: u64)
- Update user reputation

### record_battle_win(badge: &mut ProfileBadge)
- Record win result (+10 reputation)

### record_pet_ownership(badge: &mut ProfileBadge)
- Record new pet (+5 reputation)

## 💴 Pet Token
### mint_test_tokens(recipient: address, amount: u64, ctx: &mut tx_context::TxContext)
- Mint test token (for development use)

### transfer_tokens(coin: &mut PetCoin,to: address,amount: u64,ctx: &mut tx_context::TxContext)
- Transfer tokens to new address

## ⏰ Cooldown & Limits
## Daily Limits
### init_daily_tracker(ctx: &mut TxContext)
- Initialize daily tracker for daily spin

### can_spin(tracker: &mut DailyTracker, current_time: u64): bool
- Check whether can spin (Free spin per day)

## Cooldown System
### init_cooldown(ctx: &mut tx_context::TxContext)
- Initialize cooldown time

## 📊 Stat System
### init(ctx: &mut TxContext)
- Initialize all system data

### record_pet_creation(stats: &mut GlobalStats)
- Record the number of created pets in system

### record_battle(stats: &mut GlobalStats,tokens_earned: u64)
- Record the number of battle in system

## Error Codes
- 400: Incorrect balance calculation after payment (shop system)
- 402: Insuficient balance (shop system)
- 403: Invalid cost/quantity (shop system)
- 404: Item not found (shop system)
- 405: Item not in user inventory (inventory)
- 406: Invalid Pet Type (pet stats)
- 407: Length of Pet Name too long (pet stats)
- 408: Insufficient balance (pet stats)
- 409: User already has pet (pet stats)
- 410: Cooldown time not end yet (pet stats)
- 411: Daily Limit of wheel spin (wheel system)