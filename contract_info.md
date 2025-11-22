# 🐾 OnePet - Complete integration documentation

## Network Setting
 - **Network**: One Chain Testnet
 - **RPC URL**: https://rpc-testnet.onelabs.cc:443
 - **PACKAGE_ID**=0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523

## Contract info:
 - **SHOPSYSTEM_ID**=0x7170768eb15af96449def2b7f031bf354a3d7bad22c4fb600b561eda321ec7f0
 - **GlobalStats_ID**=0x4847461568fb22ff68f2da936ac0f532cc0096df7d59b72df6e2fe9aca4f6b2e
 - **UPGRADE_CAP**=0xba519357d162fb5668514955079691275f15fcfe6173e279a42187aee12dad43
 - **MY_ADDRESS**=0x142fea65962ec5ca8cc86e94d3b799b12090f3bf4946815728322387435af893

## Object ID (Latest Version)
- **UserState_ID**: 0x0acc790df7e58b3033b1a4b7efb025ee243ad59b9cf987c9564afd22b30e1083
- **PlayerInventory_ID**: 0xf0839e0975983e13251592c3b7af76167b3f43243fbc14e34b81bd6091f94302
- **DailyTracker_ID**: 0x76ea67fa005d8822739cd02716ecefc9654f0593515271c66cf1685fcbf92c12
- **ActionCooldown_ID**: 0x2565295ee1ab1cb4592a1e9b1bafee5dee9a093f834c0c947c7c5d8c4c8645e7
- **DailyReward_ID**: 0xf8e7ab7cf8b8fcff51d93945476b76649e639752986167fb2daa00054c8edddb
- **ProfileBadge_ID**: 0xbb863544d7d82880089e4b195e4c72c2015ca169ac479d1570bab00213017365
- **OCT_COIN_ID**: 0x7f8c6325165138fe02ba9b1d166821c05144f077d619e308cfeaa23c191e6e19 **OR** 0x0e1bd9861f3a4c2a8cd0a6373c4b7b4ea1281c67251abeb1868e23f48c6f4b12
- **PET_NFT_ID**: 0xc260d51291c74de1e10fdb1719ba0da2dba61cd04b64dfb00b6b50fd08f5e31c
- **Monster_ID**: 0xa98f84312876513beb8274dc36d5eae1211ff25313e6f3b34a7537353b824ad5

## Main functional modules
- User Initialize: `user_initializer::initialize`
- Shop System: `shop_system::buy_item`
- Pet Statistics: `pet_stats::*`
- PVE Battle System: `pve_battle::*`
- Reward System: `reward_system::*`

## Commands for functions:
### 1. User Initialization
- ```one client ptb --move-call $PACKAGE_ID::user_initializer::initialize_user_account \"Username\" --gas-budget 20000000```
- Example: ``one client ptb --move-call 0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523::user_initializer::initialize_user_account \"MyPetUser\" --gas-budget 20000000``

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
- Example: ```one client ptb --move-call 0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523::pet_stats::create_first_pet @0x0acc790df7e58b3033b1a4b7efb025ee243ad59b9cf987c9564afd22b30e1083 \"MyFirstPet\" 0 --gas-budget 20000000```

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
- Example: ```one client ptb --move-call 0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523::shop_system::buy_item @0x7170768eb15af96449def2b7f031bf354a3d7bad22c4fb600b561eda321ec7f0 @0xf0839e0975983e13251592c3b7af76167b3f43243fbc14e34b81bd6091f94302 1 1 @0x7f8c6325165138fe02ba9b1d166821c05144f077d619e308cfeaa23c191e6e19 --gas-budget 20000000```

```javascript
// Buy items from shop
const buyTx = {
  target: `${PACKAGE_ID}::shop_system::buy_item`,
  arguments: [shopId, inventoryId, itemId, quantity, coinId],
  typeArguments: []
}
// Item IDs: 1=Food, 2=Toy, 3=Drink, 4=Medicine
```

## 📝 Parameter Rules
- Object References: Prefix with @ (e.g., @0x123...)
- Strings: Wrap in quotes (e.g., \"Name\")
- Numbers: Use directly (e.g., 1, 0, 100)
- Gas Budget: Use ``--gas-budget 20000000``


### Initialize module by module (Not important first)
- Pet Stats Initialize: ``one client ptb --move-call 0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523::pet_stats::init_user_state --gas-budget 10000000``
- Inventory Initialiaze: ``one client ptb --move-call 0x4b7d455d9dbff4a14ad93545f30c513d23b365e6b493d9ca06adc811f87b0523::inventory::init_inventory --gas-budget 10000000``