module OnePet::inventory {
    use one::object::{Self, UID};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use std::vector;
    use OnePet::shop_system;

    public struct PlayerInventory has key {
        id: UID,
        owner: address,
        items: vector<u64>, //store item id
        created_at: u64
    }
    
    public fun init_inventory(ctx: &mut TxContext) {
        let inventory = PlayerInventory {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            items: vector::empty(),
            created_at: tx_context::epoch(ctx)
        };
        transfer::transfer(inventory, tx_context::sender(ctx));
    }
    
    public entry fun add_item(inventory: &mut PlayerInventory, item_id: u64) {
        vector::push_back(&mut inventory.items, item_id);
    }
    
    public fun get_inventory_items(inventory: &PlayerInventory): &vector<shop_system::ShopItem> {
        &inventory.items
    }

    public entry fun remove_item(inventory: &mut PlayerInventory, item_id: u64) {
        let index = find_item_index(&inventory.items, item_id);
        if (index != -1) {
            vector::remove(&mut inventory.items, (index as u64));
        }
    }

    public fun has_item(inventory: &PlayerInventory, item_id: u64): bool{
        find_item_index(&inventory.items, item_id) != -1
    }

    fun find_item_index(items: &vector<u64>, target_id: u64): i64 {
        let i = 0;
        let length = vector::length(items);
        while (i < length) {
            if (*vector::borrow(items, i) == target_id) {
                return (i as i64);
            };
            i = i + 1;
        };
        -1
    }
}
