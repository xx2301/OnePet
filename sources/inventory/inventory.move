#[allow(unused_const)]
module OnePet::inventory {
    use std::vector;
    
    use one::object;
    use one::transfer;
    use one::tx_context;

    const EITEM_NOT_IN_INVENTORY: u64 = 405;

    public struct PlayerInventory has key {
        id: object::UID,
        owner: address,
        items: vector<u64>,
        created_at: u64
    }
    
    public fun init_inventory(ctx: &mut tx_context::TxContext) {
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
    
    public fun get_inventory_items(inventory: &PlayerInventory): &vector<u64> {
        &inventory.items
    }

    public entry fun remove_item(inventory: &mut PlayerInventory, item_id: u64) {
        let index = find_item_index(&inventory.items, item_id);
        let length = vector::length(&inventory.items);
        assert!(index < length, EITEM_NOT_IN_INVENTORY);
        vector::remove(&mut inventory.items, index);
    }

    public fun has_item(inventory: &PlayerInventory, item_id: u64): bool {
        let index = find_item_index(&inventory.items, item_id);
        let length = vector::length(&inventory.items);
        index < length
    }

    fun find_item_index(items: &vector<u64>, target_id: u64): u64 {
        let mut i = 0;
        let length = vector::length(items);
        while (i < length) {
            if (*vector::borrow(items, i) == target_id) {
                return i
            };
            i = i + 1;
        };
        length
    }

    //PlayerInventory can only be created at own module (inventory) and can only transfer at the declaration of its own module
    //for testing call and create inventory
    #[test_only]
    public fun create_test_inventory(owner: address, ctx: &mut TxContext): PlayerInventory {
        PlayerInventory {
            id: object::new(ctx),
            owner: owner,
            items: vector::empty(),
            created_at: 0
        }
    }

    //for testing to transfer inventory to a person
    #[test_only]
    public fun transfer_test_inventory(inventory: PlayerInventory, recipient: address) {
        transfer::transfer(inventory, recipient);
    }

    #[test]
    fun test_add_and_get_items() {
        let mut ctx = tx_context::dummy();
        
        let mut inventory = create_test_inventory(@0x1, &mut ctx);
        
        add_item(&mut inventory, 1);
        add_item(&mut inventory, 2);
        add_item(&mut inventory, 3);
        
        //check quantity of inventory correct or not
        let items = get_inventory_items(&inventory);
        assert!(vector::length(items) == 3, 1);
        
        //check which item is at which index place
        assert!(*vector::borrow(items, 0) == 1, 2);
        assert!(*vector::borrow(items, 1) == 2, 3);
        assert!(*vector::borrow(items, 2) == 3, 4);
        
        transfer_test_inventory(inventory, @0x0);
    }

    #[test]
    fun test_remove_item() {
        let mut ctx = tx_context::dummy();
        
        let mut inventory = create_test_inventory(@0x1, &mut ctx);
        
        add_item(&mut inventory, 5);
        add_item(&mut inventory, 10);
        add_item(&mut inventory, 15);
        
        remove_item(&mut inventory, 10);
        
        let items = get_inventory_items(&inventory);
        assert!(vector::length(items) == 2, 1);
        assert!(*vector::borrow(items, 0) == 5, 2);
        assert!(*vector::borrow(items, 1) == 15, 3);
        
        transfer_test_inventory(inventory, @0x0);
    }

    #[test]
    fun test_has_item_check() {
        let mut ctx = tx_context::dummy();
        
        let mut inventory = create_test_inventory(@0x1, &mut ctx);
        
        add_item(&mut inventory, 7);
        add_item(&mut inventory, 8);
        
        //test item is/isn't in inventory
        assert!(has_item(&inventory, 7) == true, 1);
        assert!(has_item(&inventory, 8) == true, 2);
        assert!(has_item(&inventory, 99) == false, 3); //test item that is not in inventory
        
        transfer::transfer(inventory, @0x0);
    }

    #[test]
    #[expected_failure(abort_code = EITEM_NOT_IN_INVENTORY)]
    fun test_remove_nonexistent_item_fails() {
        let mut ctx = tx_context::dummy();
        
        let mut inventory = create_test_inventory(@0x1, &mut ctx);
        
        add_item(&mut inventory, 1);
        
        //try to remove the item that not found
        remove_item(&mut inventory, 999);
        
        transfer::transfer(inventory, @0x0);
    }
}