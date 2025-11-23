# 🐾 OnePet - Complete integration documentation

## Network Setting
 - **Network**: One Chain Testnet
 - **RPC URL**: https://rpc-testnet.onelabs.cc:443
 - **PACKAGE_ID**=0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095

## Contract info:
 - **SHOPSYSTEM_ID**=0xbc1302b65047141af9ec74a4c49e0cf9d464d0941c388078da7e98d7ffe01791
 - **GlobalStats_ID**=0x577f12f06523ab302ed8a9e61f024d07f3bf8ab3cea9669662905b6b5921d4ac
 - **UPGRADE_CAP**=0xf3c25560b48d22b32a9e79f035a6f8aa10c61854d4b7e4a4af60c4b84259f0ea
 - **MY_ADDRESS**=0x142fea65962ec5ca8cc86e94d3b799b12090f3bf4946815728322387435af893
 - **CLOCK**=0x6

## Object ID (Latest Version)
- **UserState_ID**: 0xcfda65e846df727d22debf30bb6734a57aa83397c5e413c21d954917f6b0484e
- **PlayerInventory_ID**: 0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680
- **DailyTracker_ID**: 0x96d2b0b5077fec7d2fca1111a076d5b35191d53568828129dbacfbaa10b0bf1c
- **ActionCooldown_ID**: 0xa66b803b42bcc100f7e17d1b64ffa8e82f7e896e2929c2fab39670f90392d39a
- **DailyReward_ID**: 0x5fa19f49e1830d8284fab8ef35c014e61f3a807dd39fa181723094037ead3c33
- **ProfileBadge_ID**: 0xb2c58d7d69209f770335d51970380863b7d770102ea1367f9327aa14f7655d4d
- **OCT_COIN_ID**: 0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12 **OR** 0x7f8c6325165138fe02ba9b1d166821c05144f077d619e308cfeaa23c191e6e19
- **PET_NFT_ID**: 0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac
- **Monster_ID**: 0x91e67e245cf9e52b6871b9b44904109d846e3475609153bb3658c941b376ef6d
- **Achievement_ID**: 0x7deb8e75b1b060effd2a5032caaf417f8e7869aa32742b798829707d532e226b (for pet) **OR** 0x106027c2938fb00c68a00f0ef3edb26ef8b2a1aa6244fd9c6dfb00122836a388 (for battle)

## Main functional modules
- User Initialize: `user_initializer::initialize`
- Shop System: `shop_system::buy_item`
- Pet Statistics: `pet_stats::*`
- PVE Battle System: `pve_battle::*`
- Reward System: `reward_system::*`

## Commands for functions:
### 1. User Initialization
- ```one client ptb --move-call $PACKAGE_ID::user_initializer::initialize_user_account \"Username\" --gas-budget 20000000```
- Example: ``one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::user_initializer::initialize_user_account \"FinalTest\" --gas-budget 20000000``

```javascript
// Initialize all user objects at once
const initTx = {
  target: `${PACKAGE_ID}::user_initializer::initialize_user_account`,
  arguments: ["username"],
  typeArguments: []
}
```

### Create First Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::create_first_pet @$UserState_ID \"PetName\" 0 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pet_stats::create_first_pet @0xcfda65e846df727d22debf30bb6734a57aa83397c5e413c21d954917f6b0484e \"TestPet\" 0 --gas-budget 20000000```

```javascript
// Create first free pet
const createPetTx = {
  target: `${PACKAGE_ID}::pet_stats::create_first_pet`,
  arguments: [userStateId, "PetName", petType],
  typeArguments: []
}
// Pet Types: 0=Dog, 1=Cat, 2=Rabbit, 3=Hamster
```

### Buy Item
- ```one client ptb --move-call $PACKAGE_ID::shop_system::buy_item @$SHOPSYSTEM_ID @$PlayerInventory_ID 1 1 @$OCT_COIN_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::shop_system::buy_item @0xbc1302b65047141af9ec74a4c49e0cf9d464d0941c388078da7e98d7ffe01791 @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 1 1 @0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12 --gas-budget 20000000```

```javascript
// Buy items from shop
const buyTx = {
  target: `${PACKAGE_ID}::shop_system::buy_item`,
  arguments: [shopId, inventoryId, itemId, quantity, coinId],
  typeArguments: []
}
// Item IDs: 1=Food, 2=Toy, 3=Drink, 4=Medicine
```

### Feed Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::feed_pet @$PET_NFT_ID @$ActionCooldown_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pet_stats::feed_pet @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac @0xa66b803b42bcc100f7e17d1b64ffa8e82f7e896e2929c2fab39670f90392d39a @0x6 --gas-budget 20000000```

### Play Pet
- ``` one client ptb --move-call $PACKAGE_ID::pet_stats::play_pet @$PET_NFT_ID @$ActionCooldown_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pet_stats::play_pet @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac @0xa66b803b42bcc100f7e17d1b64ffa8e82f7e896e2929c2fab39670f90392d39a @0x6 --gas-budget 20000000```

### Drink Pet
- ```one client ptb --move-call $PACKAGE_ID::pet_stats::drink_pet @$PET_NFT_ID @$ActionCooldown_ID @$PlayerInventory_ID @$GlobalStats_ID @0x6 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pet_stats::drink_pet @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac @0xa66b803b42bcc100f7e17d1b64ffa8e82f7e896e2929c2fab39670f90392d39a @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 @0x577f12f06523ab302ed8a9e61f024d07f3bf8ab3cea9669662905b6b5921d4ac @0x6 --gas-budget 20000000```

### Sleep Pet
- ``` one client ptb --move-call $PACKAGE_ID::pet_stats::sleep_pet @$PET_NFT_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pet_stats::sleep_pet @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac --gas-budget 20000000```

### Spin Wheel
- ```one client ptb --move-call $PACKAGE_ID::wheel_system::spin_wheel @$DailyTracker_ID @$PlayerInventory_ID @$PET_NFT_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::wheel_system::spin_wheel @0x96d2b0b5077fec7d2fca1111a076d5b35191d53568828129dbacfbaa10b0bf1c @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac --gas-budget 20000000```

### Claim Daily Reward
- ```one client ptb --move-call $PACKAGE_ID::reward_system::claim_daily_reward @$DailyReward_ID @$PlayerInventory_ID @$ProfileBadge_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::reward_system::claim_daily_reward @0x5fa19f49e1830d8284fab8ef35c014e61f3a807dd39fa181723094037ead3c33 @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 @0xb2c58d7d69209f770335d51970380863b7d770102ea1367f9327aa14f7655d4d --gas-budget 20000000```

### Create Monster
- ```one client ptb --move-call $PACKAGE_ID::pve_battle::create_monster_based_on_pet_level @$PET_NFT_ID "TestMonster" --gas-budget 20000000```
- Example: ```one client ptb --move-call $PACKAGE_ID::pve_battle::create_monster_based_on_pet_level @$PET_NFT_ID "TestMonster" --gas-budget 20000000```

### Start battle (PVE)
- ```one client ptb --move-call $PACKAGE_ID::pve_battle::start_pve_battle @$MY_ADDRESS @$PET_NFT_ID @$Monster_ID @$GlobalStats_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::pve_battle::start_pve_battle @0x142fea65962ec5ca8cc86e94d3b799b12090f3bf4946815728322387435af893 @0x20d367a48ac658945b6d98a97b7023e3cb97c2a0825ed904ca7fa98c72373fac @0x91e67e245cf9e52b6871b9b44904109d846e3475609153bb3658c941b376ef6d @0x577f12f06523ab302ed8a9e61f024d07f3bf8ab3cea9669662905b6b5921d4ac --gas-budget 20000000```

### Create Archievement (Creation of Pet)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::create_achievement 0 --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::reward_system::create_achievement 0 --gas-budget 20000000```

### Create Archievement (Battle)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::create_achievement 1 --gas-budget 20000000```
-  Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::reward_system::create_achievement 1 --gas-budget 20000000```

### Claim Reward for Archievement (Creation of Pet)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::check_achievement @$Achievement_ID @$PlayerInventory_ID @$ProfileBadge_ID --gas-budget 20000000```
- ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::reward_system::check_achievement @0x7deb8e75b1b060effd2a5032caaf417f8e7869aa32742b798829707d532e226b @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 @0xb2c58d7d69209f770335d51970380863b7d770102ea1367f9327aa14f7655d4d --gas-budget 20000000```

### Claim Reward for Archievement (Battle)
- ```one client ptb --move-call $PACKAGE_ID::reward_system::check_achievement @$Achievement_ID @$PlayerInventory_ID @$ProfileBadge_ID --gas-budget 20000000```
- Example: ```one client ptb --move-call 0x054cfec097e40187a3d342069bc3a547f10aa48472055b27262a52d4b58b7095::reward_system::check_achievement @0x106027c2938fb00c68a00f0ef3edb26ef8b2a1aa6244fd9c6dfb00122836a388 @0xfa37b26ef34d3c79adba1bcff9989d0fd54ae408a885b72ece1a431cf9672680 @0xb2c58d7d69209f770335d51970380863b7d770102ea1367f9327aa14f7655d4d --gas-budget 20000000```

## 📝 Parameter Rules
- Object References: Prefix with @ (e.g., @0x123...)
- Strings: Wrap in quotes (e.g., \"Name\")
- Numbers: Use directly (e.g., 1, 0, 100)
- Gas Budget: Use ``--gas-budget 20000000``


### Initialize module by module (Not important first)
- Pet Stats Initialize: ``one client ptb --move-call <Package_ID>::pet_stats::init_user_state --gas-budget 20000000``
- Inventory Initialiaze: ``one client ptb --move-call <Package_ID>::inventory::init_inventory --gas-budget 20000000``