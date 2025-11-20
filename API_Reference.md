Move Contract API Reference

## Pet Factory
### create_pet(name: vector<u8>, pet_type: u8, ctx: &mut TxContext)
- Creates a new pet NFT
- Parameters: name (UTF-8 bytes), pet_type (0=Dog, 1=Cat, 2=Rabbit, 3=Hamster)

### feed_pet(pet: &mut PetNFT)
- Increases hunger by 30, energy by 10
- Caps at maximum 100

## Shop System
### buy_item(inventory: &mut ShopInventory, item_id: u64, quantity: u64, ctx: &mut TxContext)
- Let user to buy items
- Parameters: item_id (1=ITEM_FOOD, 2=ITEM_TOY, 3=ITEM_DRINK, 4=ITEM MEDICINE), quantity (u64)

## Error Codes
- 404: Item not found (shop system)
- 403: Invalid cost (shop system)
