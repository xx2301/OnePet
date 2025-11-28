Move Contract API Reference

## 🚀 First Time Setup
### initialize_user_account(username: vector<u8>, global_stats: &mut stat_system::GlobalStats, ctx: &mut TxContext)
- Description: One-time setup for new users (creates all required objects)
- Creates: UserState, PlayerInventory, DailyTracker, ActionCooldown, DailyReward, ProfileBadge
- Note: Call this once per user before any other operations
- Parameters: username (1-10 characters), global_stats (for recording user registration)

## 🏠 Pet Stats
### init_user_state(ctx: &mut TxContext)
- Initialize user, for creating first pet

### create_pet(user_state: &mut UserState, name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext)
- Creates a pet NFT (free for first pet, paid for additional pets)
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster), payment (OCT coins), global_stats (for recording pet creation)

### create_first_pet(user_state: &mut UserState, name: vector<u8>, pet_type: u8, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext)
- Creates a new pet NFT
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster), global_stats (for recording pet creation)

### create_additional_pet(name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext)
- Creates others pet NFT by paying token
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster), payment (OCT coins), global_stats (for recording pet creation)
- Need to pay 50 OCT for buying another pet

### feed_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown,ctx: &mut tx_context::TxContext)
- To feed pet
- Increases hunger by 30, energy by 10
- Caps at maximum 100
- Cooling time 1 hr
- Records feed action in global stats

### play_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown, ctx: &mut tx_context::TxContext)
- To play with pet
- Increases happiness by 25, decreases enegry by 10
- Cooling time 30 mins
- Records drink action in global stats

### sleep_pet(pet: &mut PetNFT)
- Let pet to sleep
- Increases energy to 100, decreases happiness by 10
- Records sleep action in global stats

### level_up(pet: &mut PetNFT, exp_gained: u64)
- Level up pet based on experience gained
- Parameters: exp_gained (experience points to add)

### get_level(pet: &PetNFT): u64
- Get pet's current level

### get_health(pet: &PetNFT): u64
- Get pet's current health

## ⚔️ Battle System
### create_monster_based_on_pet_level(pet: &pet_stats::PetNFT, name: vector<u8>, ctx: &mut tx_context::TxContext)
- Recommended: Automatically create monsters of appropriate levels based on pet level
- Monster level range: Pet level ±2 (minimum level 1)
- Parameters: pet (reference to PetNFT to calculate level from), name (monster name as UTF-8 bytes)

### create_monster(min_level: u64, max_level: u64, name: vector<u8>, ctx: &mut tx_context::TxContext)
- Create monster with specified level range
- Monster stats: health = level * 20, attack = level * 5

### start_pve_battle(player: address, pet: &mut pet_stats::PetNFT, monster: &mut Monster, stats: &mut stat_system::GlobalStats, badge: &mut profile_badge::ProfileBadge, ctx: &mut tx_context::TxContext) -> BattleResult
- Player vs Environment (Computer)
- Returns BattleResult with "winner", "exp_gained" and "tokens_earned" (Note: return value is ignored in entry functions)
- Win condition: Pet level >= Monster level and pet health > 0
- Victory rewards: exp = monster.level * 10, tokens = monster.level * 5
- Defeat consolation: exp = monster.level * 2, tokens = 0
- **WARNING**: Tokens are calculated but NOT actually minted/transferred (contract issue)
- Records battle in global stats

## 🎯 Wheel System
### spin_wheel(daily_tracker: &mut daily_limits::DailyTracker, player_inventory: &mut inventory::PlayerInventory, pet: &mut pet_stats::PetNFT, clock: &Clock, ctx: &mut tx_context::TxContext) -> WheelReward
- Daily wheel spin for entry user
- Reward Percentage: 
  - 40%: Pet Token (10-30 Pet Token)
  - 30%: Experience (50-100 Exp)
  - 25%: Item Reward (randomly)
  - 5%: Rare Price (50-100 Pet Token)

### get_time_until_next_spin(daily_tracker: &daily_limits::DailyTracker, clock: &Clock)
- Get the next spin time

## 🏆 Reward System
### init_daily_reward(ctx: &mut tx_context::TxContext)
- Initialize dailey reward for player
- Extra reward for check in streak daily

### claim_daily_reward(daily_reward: &mut DailyReward, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, clock: &Clock, ctx: &mut tx_context::TxContext)
- Claim daily check-in reward with streak bonus

### create_achievement(achievement_type: u64, ctx: &mut tx_context::TxContext)
- Achievement Board like:
  - 0: Got the first pet
  - 1: Complete first battle
  - 2: Pet level has reached level 5

### mark_achievement_complete(achievement: &mut Achievement)
- Mark achievement as completed

### claim_achievement_reward(achievement: &mut Achievement, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, ctx: &mut tx_context::TxContext)
- Check completed task and get rewards

## 🛒 Shop System
### init(ctx: &mut TxContext)
- Initialize shop to create shared store object

### buy_item(shop: &mut ShopInventory, player_inventory: &mut PlayerInventory, item_id: u64, quantity: u64, payment: &mut coin::Coinoct::OCT, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext)
- Let user to buy items
- Parameters: 
  - item_id 
    - 1=ITEM_FOOD (-10 hunger)
    - 2=ITEM_TOY (+10 happiness)
    - 3=ITEM_DRINK (+20 energy)
    - 4=ITEM MEDICINE (+30 health)
  - quantity (u64)
- Records item purchase in global stats

### get_shop_items(inventory: &ShopInventory): &vector<ShopItem>
- Get available shop items

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
- Check if user has the item

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

### get_username(badge: &ProfileBadge): &string::String
Get username

### get_reputation(badge: &ProfileBadge): u64
Get reputation score

### get_battles_won(badge: &ProfileBadge): u64
Get battles won count

### get_pets_owned(badge: &ProfileBadge): u64
Get pets owned count

## 💴 Pet Token
### mint_test_tokens(recipient: address, amount: u64, ctx: &mut tx_context::TxContext)
- Mint test token (for development use)

### transfer_tokens(coin: &mut PetCoin,to: address,amount: u64,ctx: &mut tx_context::TxContext)
- Transfer tokens to new address

### get_balance(coin: &PetCoin): u64
- Get token balance

## ⏰ Cooldown & Limits
## Daily Limits
### init_daily_tracker(ctx: &mut TxContext)
- Initialize daily tracker for daily spin

### can_spin(tracker: &mut DailyTracker, clock: &Clock): bool
- Check whether can spin (Free spin per day)

### record_spin(tracker: &mut DailyTracker, clock: &Clock)
- Record wheel spin usage

## Cooldown System
### init_cooldown(ctx: &mut tx_context::TxContext)
- Initialize cooldown time

### can_feed(cooldown: &ActionCooldown, current_time: u64): bool
- Check if can feed pet (1hr cooldown)

### can_play(cooldown: &ActionCooldown, current_time: u64): bool
- Check if can play with pet (30min cooldown)

### can_drink(cooldown: &ActionCooldown, current_time: u64): bool
- Check if can give drink to pet (30min cooldown)

### update_feed(cooldown: &mut ActionCooldown, current_time: u64)
- Update feed cooldown time

### update_play(cooldown: &mut ActionCooldown, current_time: u64)
- Update play cooldown time

### update_drink(cooldown: &mut ActionCooldown, current_time: u64)
- Update drink cooldown time

## 📊 Stat System
### init(ctx: &mut TxContext)
- Initialize global stats object

### record_user_registration(stats: &mut GlobalStats)
- Record new user registration

### record_pet_creation(stats: &mut GlobalStats)
- Record the number of created pets in system

### record_battle(stats: &mut GlobalStats,tokens_earned: u64)
- Record the number of battles and tokens earned

### record_item_purchase(stats: &mut GlobalStats, quantity: u64)
- Record item purchases in system

### record_feed_action(stats: &mut GlobalStats)
- Record feed actions

### record_play_action(stats: &mut GlobalStats)
- Record play actions

### record_drink_action(stats: &mut GlobalStats)
- Record drink actions

### record_sleep_action(stats: &mut GlobalStats)
- Record sleep actions

### get_stats(stats: &GlobalStats): PetStats
- Get current global statistics

### get_total_users(stats: &GlobalStats): u64
- Get total user count

### get_total_pets(stats: &GlobalStats): u64
- Get total pet count

### get_total_battles(stats: &GlobalStats): u64
- Get total battle count


## 🎲 Random System
### random_between(min: u64, max: u64, ctx: &tx_context::TxContext): u64
- Generate random number between min and max

### random_chance(percent: u64, ctx: &mut tx_context::TxContext): bool
- Random chance based on percentage

## Error Codes
- 1: Username too long (profile badge)
- 2: Username empty (profile badge)
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
- 411: Insufficient Drink (pet stats)
- 412: Insufficient Food (pet stats)
- 413: Daily Limit of wheel spin (wheel system)