# 🐾 OnePet - Complete integration documentation

## Network Setting
 - **Network**: One Chain Testnet
 - **RPC URL**: https://rpc-testnet.onelabs.cc:443
 - **PACKAGE_ID**=0xc28ae5613b99c0f81c24f8f7f21f1be620456f438522d026f95edac8b3a547f0

## Contract info:
 - **SHOPSYSTEM_ID**=0xc8fb05b1f800e67209ba9981c3f02b7625de51152ed6ce4da22801f08b657536
 - **GlobalStats_ID**=0xcacb112af62966994bec03cb3b4abedaac5922eb366dea2de37ecba895655fe5
 - **UPGRADE_CAP**=0xb2e9244c8b703839bde84c7ffdfcca5522ab138978ab7cfa66b0130cef2ce62e
 - **MY_ADDRESS**=0x142fea65962ec5ca8cc86e94d3b799b12090f3bf4946815728322387435af893
 - **CLOCK**=0x6

## Object ID (Old Version)
- **UserState_ID**: 0x20c1c351ad8c00f58ba4a31ac967f63ea8c5e86103fb25145a55eae11479438b
- **PlayerInventory_ID**: 0x8442fb51a7b6b6d218ba83bb610b5febbfdedd24d00eaf3e94dba3ec1ea6a221
- **DailyTracker_ID**: 0xfa12f06010b8d4330b6b6d0f03c69fe22bdfaaf4be4148d45a5a5090317ac999
- **ActionCooldown_ID**: 0xf62d282b45f3f333972d89551096cf24b3f97295c7e705db3a577395625e7af3
- **DailyReward_ID**: 0xdf4bf062a6748980feb42762d8b6e28efd473c4331b3f67534639c37b9973b96
- **ProfileBadge_ID**: 0x69e897fa1efacbb2beea3026761e349acdb4b4f95d969ef61305f159f083714a
- **OCT_COIN_ID**: 0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12 
- **PET_NFT_ID**: 0xd6a9865d165daf7a163107ad38d99c846c5edabbef44da0312ea72e18705af04
- **Monster_ID**: 0xa5d975dd3f8afef71a6f89027703c2e48c6155fc30b7440c16dea882707421d5
- **Achievement_ID**: 0x360585d76d53be55146484cdcce480efe0d8db6b6619e2e502ab9f8d4aaf77fd

## Main functional modules
- User Initialize: `user_initializer::initialize`
- Shop System: `shop_system::buy_item`
- Pet Statistics: `pet_stats::*`
- PVE Battle System: `pve_battle::*`
- Reward System: `reward_system::*`

## Commands for functions:
### 1. User Initialization
- ```one client ptb --move-call $PACKAGE_ID::user_initializer::initialize_user_account \"Username\" @$GlobalStats_ID --gas-budget 20000000```
- Example: ``one client ptb --move-call 0xc28ae5613b99c0f81c24f8f7f21f1be620456f438522d026f95edac8b3a547f0::user_initializer::initialize_user_account \"FinalTest\" @0xcacb112af62966994bec03cb3b4abedaac5922eb366dea2de37ecba895655fe5 --gas-budget 20000000``

### Create First Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::create_first_pet @$UserState_ID \"PetName\" 0 @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0xc28ae5613b99c0f81c24f8f7f21f1be620456f438522d026f95edac8b3a547f0::pet_stats::create_first_pet @0x20c1c351ad8c00f58ba4a31ac967f63ea8c5e86103fb25145a55eae11479438b \"Bobby3\" 0 @0xcacb112af62966994bec03cb3b4abedaac5922eb366dea2de37ecba895655fe5 --gas-budget 20000000```

### Create Additional Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::create_additional_pet @$UserState_ID \"PetName\" 0 @$OCT_COIN_ID @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::create_additional_pet \"Bunny\" 2 @0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12 @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 --gas-budget 20000000```

### Buy Item
- ```one client ptb --move-call $PACKAGE_ID::shop_system::buy_item @$SHOPSYSTEM_ID @$PlayerInventory_ID 1 1 @$OCT_COIN_ID @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::shop_system::buy_item @0x2651ddd9613f800d52e1290c4884c0c312dfcf67077acdbe81701ef663b2a705 @0x633d7caa8608af03d9ea0b7f96552213b314d1c1a49a0d5dd99039bf7ea882fa 1 1 @0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12 @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 --gas-budget 20000000```

### Feed Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::feed_pet @$PET_NFT_ID @$ActionCooldown_ID @$PlayerInventory_ID @$GlobalStats_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::feed_pet @0x52262408f0372d14b4506716e65859ea54e105db7ab2076bc68b014ecafaa08e @0xc323b4f5bc536e0c82a7f774d0effa84d1785da2ee909fc48a9f226a5c20e2e5 @0x633d7caa8608af03d9ea0b7f96552213b314d1c1a49a0d5dd99039bf7ea882fa @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 @0x6 --gas-budget 20000000```

### Play Pet
- ``` one client ptb --move-call $PACKAGE_ID::pet_stats::play_pet @$PET_NFT_ID @$ActionCooldown_ID @$GlobalStats_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::play_pet @0x17ac4f42015b8f0cd247f5f8cb66cd1f5ce903903f04bfccbed9d226942f070a @0xc323b4f5bc536e0c82a7f774d0effa84d1785da2ee909fc48a9f226a5c20e2e5 @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 @0x6 --gas-budget 20000000```

### Drink Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::drink_pet @$PET_NFT_ID @$ActionCooldown_ID @$PlayerInventory_ID @$GlobalStats_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::drink_pet @0x17ac4f42015b8f0cd247f5f8cb66cd1f5ce903903f04bfccbed9d226942f070a @0xc323b4f5bc536e0c82a7f774d0effa84d1785da2ee909fc48a9f226a5c20e2e5 @0x633d7caa8608af03d9ea0b7f96552213b314d1c1a49a0d5dd99039bf7ea882fa @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 @0x6 --gas-budget 20000000```

### Sleep Pet
- ``` one client ptb --move-call $PACKAGE_ID::pet_stats::sleep_pet @$PET_NFT_ID @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::sleep_pet @0x52262408f0372d14b4506716e65859ea54e105db7ab2076bc68b014ecafaa08e @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 --gas-budget 20000000```

### Spin Wheel
- ```one client ptb --move-call $PACKAGE_ID::wheel_system::spin_wheel @$DailyTracker_ID @$PlayerInventory_ID @$PET_NFT_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x2ced6cfc13da95fae282142783617b958c3b98f63da4cf8ff9a21fb1f9683801::wheel_system::spin_wheel @0x3c32b8133d074e12d9eae18fb7ffd5139463c6af6ebeeef4b14a0f1a753f8a04 @0xd0c686ff993adb22f105bbc4ef5b9c62f9789337347e1be9e439e0325d7fb827 @0x5075a3b47d2a76aafba67c085b7cc2e0690e8941c13e4a1d8670b10505ad453f @0x6 --gas-budget 20000000```

### Claim Daily Reward
- ```one client ptb --move-call $PACKAGE_ID::reward_system::claim_daily_reward @$DailyReward_ID @$PlayerInventory_ID @$ProfileBadge_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x2ced6cfc13da95fae282142783617b958c3b98f63da4cf8ff9a21fb1f9683801::reward_system::claim_daily_reward @0x23112adc34b3f7e340ac10cc6a24ae5a9e270b04ef1164d44a6547b5a7124ed6 @0xd0c686ff993adb22f105bbc4ef5b9c62f9789337347e1be9e439e0325d7fb827 @0x8fd57e6f44c2c1f03f826f3198662433a7f4209862c703a98142f3ad9fe85f8c @0x6 --gas-budget 20000000```

### Create Monster
- ```one client ptb --move-call $PACKAGE_ID::pve_battle::create_monster_based_on_pet_level @$PET_NFT_ID \"MonsterName\" --gas-budget 20000000```
- Example: ```one client ptb --move-call 0xc28ae5613b99c0f81c24f8f7f21f1be620456f438522d026f95edac8b3a547f0::pve_battle::create_monster_based_on_pet_level @0xd6a9865d165daf7a163107ad38d99c846c5edabbef44da0312ea72e18705af04 \"Goblin\" --gas-budget 20000000```

### Start battle (PVE)
- ```one client ptb --move-call $PACKAGE_ID::pve_battle::start_pve_battle @$MY_ADDRESS @$PET_NFT_ID @$Monster_ID @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pve_battle::start_pve_battle @0x142fea65962ec5ca8cc86e94d3b799b12090f3bf4946815728322387435af893 @0x52262408f0372d14b4506716e65859ea54e105db7ab2076bc68b014ecafaa08e @0x9f1c95eb1585cfc6a1a0a8ccfcfb69fb70f71092aec7f0747a2d8b8c0f9b0d90 @0x92c142475a05d031d2993b251ba61e9d92a2196039d72b116ee2635e5985e439 --gas-budget 20000000```

### Create Achievement (Creation of Pet)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::create_achievement 0 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::reward_system::create_achievement 0 --gas-budget 20000000```

### Create Achievement (Battle)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::create_achievement 1 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::reward_system::create_achievement 1 --gas-budget 20000000```

### Claim Reward for Archievement (Creation of Pet)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::claim_achievement_reward @$Achievement_ID @$PlayerInventory_ID @$ProfileBadge_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::reward_system::check_achievement @0x360585d76d53be55146484cdcce480efe0d8db6b6619e2e502ab9f8d4aaf77fd @0x633d7caa8608af03d9ea0b7f96552213b314d1c1a49a0d5dd99039bf7ea882fa @0x79fbced01e8867a8e0be5253c2c81f12c5a29e8708b9651e65ce5bee0044f824 --gas-budget 20000000```

### Mark Achievement Complete
- ```one client ptb --move-call $PACKAGE_ID::reward_system::mark_achievement_complete @$Achievement_ID --gas-budget 20000000```

### Level Up Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::level_up @$PET_NFT_ID 100 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pet_stats::level_up @0x52262408f0372d14b4506716e65859ea54e105db7ab2076bc68b014ecafaa08e 100 --gas-budget 20000000```

### Create Monster with Custom Level
- ```one client ptb --move-call $PACKAGE_ID::pve_battle::create_monster 1 10 \"CustomMonster\" --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x6041bd28661097a56c5f044a6030e142e78c7a85107120914b152fa1d52a15e8::pve_battle::create_monster 1 10 \"Dragon\" --gas-budget 20000000```

## 📝 Parameter Rules
- Object References: Prefix with @ (e.g., @0x123...)
- Strings: Wrap in quotes (e.g., \"Name\")
- Numbers: Use directly (e.g., 1, 0, 100)
- Gas Budget: Use ``--gas-budget 20000000``
- Global Stats: Most functions now require @$GlobalStats_ID parameter

### Initialize module by module (Not important first)
- Pet Stats Initialize: ``one client ptb --move-call <Package_ID>::pet_stats::init_user_state --gas-budget 20000000``
- Inventory Initialiaze: ``one client ptb --move-call <Package_ID>::inventory::init_inventory --gas-budget 20000000``