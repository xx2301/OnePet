module OnePet::shop_system {
    use one::object;
    use one::transfer;
    use one::tx_context;
    use std::string;
    //use one::event;
    use OnePet::inventory;
    use OnePet::inventory::PlayerInventory;

    const ITEM_FOOD: u64 = 0;
    const ITEM_TOY: u64 = 1;
    const ITEM_DRINK: u64 = 2;
    const ITEM_MEDICINE: u64 = 3;
    const EITEM_NOT_FOUND: u64 = 404;
    const EINVALID_QUAN_COST: u64 = 403; 
    //const EINSUFFICIENT_BALANCE: u64 = 402;
    
    public struct ItemPurchased has copy, drop {
        buyer: address,
        item_id: u64,
        quantity: u64,
        total_cost: u64
    }

    public struct ShopInventory has key { //global storage to share
        id: UID,
        items: vector<ShopItem>
    }
    
    public struct ShopItem has copy, drop, store {
        item_id: u64,
        item_type: u64,
        name: string::String,
        price: u64,
        effect_value: u64,
        effect_description: string::String
    }
    
    fun init(ctx: &mut TxContext){
        let mut inventory = ShopInventory{
            id: object::new(ctx),
            items: vector::empty<ShopItem>()
        };

        vector::push_back(&mut inventory.items, ShopItem {
            item_id: 1,
            item_type: ITEM_FOOD,
            name: string::utf8(b"Pet Food"),
            price: 10,
            effect_value: 10,
            effect_description: string::utf8(b"+10 Hunger")
        });

        vector::push_back(&mut inventory.items, ShopItem {
            item_id: 2,
            item_type: ITEM_TOY,
            name: string::utf8(b"Chew Toy"),
            price: 15,
            effect_value: 10,
            effect_description: string::utf8(b"+10 Happiness")
        });

        vector::push_back(&mut inventory.items, ShopItem{
            item_id: 3,
            item_type: ITEM_DRINK,
            name: string::utf8(b"Energy Drink"),
            price: 20,
            effect_value: 20,
            effect_description: string::utf8(b"+20 Energy")
        });

        vector::push_back(&mut inventory.items, ShopItem {
            item_id: 4,
            item_type: ITEM_MEDICINE,
            name: string::utf8(b"Health Potion"),
            price: 25,
            effect_value: 30,
            effect_description: string::utf8(b"+30 Health")
        });

        transfer::share_object(inventory);
    }
        
    public fun get_shop_items(inventory: &ShopInventory): &vector<ShopItem>{ //to let user see what having in inventory
        &inventory.items
    }
    
    public entry fun buy_item(shop: &mut ShopInventory, player_inventory: &mut PlayerInventory, item_id: u64, quantity: u64, ctx: &mut TxContext) {
        let buyer = tx_context::sender(ctx);
        assert!(quantity > 0, EINVALID_QUAN_COST);

        let items = get_shop_items(shop);
        let mut total_cost: u64 = 0;
        let mut item_found = false;
        
        let mut i = 0;
        while (i < vector::length(items)) {
            let item = vector::borrow(items, i);
            if (item.item_id == item_id) {
                total_cost = item.price * quantity;
                item_found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(item_found, EITEM_NOT_FOUND); //if item not found will abort the transaction
        assert!(total_cost > 0, EINVALID_QUAN_COST); //if item quantity is 0 or total cost less than 0 will abort too

        /*wait to find the way of pet_token 
        assert!(token::balance(buyer) >= total_cost, EINSUFFICIENT_BALANCE); //user balance not enough to buy_item
        pet_token::transfer_from_user_to_shop(buyer, get_shop_owner(shop), total_cost, ctx);*/

        let mut j = 0;
        while (j < quantity) {
            inventory::add_item(player_inventory, item_id);
            j = j + 1;
        };

        //if can't find the actual event library path don't send out this event also can
        /*event::emit(ItemPurchased {
        buyer,
        item_id,
        quantity,
        total_cost
        });
        */
    }
    
    #[test]
    fun test_shop_items() {
        let mut ctx = tx_context::dummy();
        
        let mut shop = ShopInventory {
            id: object::new(&mut ctx),
            items: vector::empty<ShopItem>()
        };
        
        let mut player_inventory = inventory::create_test_inventory(@0x0, &mut ctx);
        
        vector::push_back(&mut shop.items, ShopItem {
            item_id: 1,
            item_type: ITEM_FOOD,
            name: string::utf8(b"Test Food"),
            price: 10,
            effect_value: 10,
            effect_description: string::utf8(b"+10 Hunger")
        });
        
        buy_item(&mut shop, &mut player_inventory, 1, 2, &mut ctx);

        let items = inventory::get_inventory_items(&player_inventory);
        assert!(vector::length(items) == 2, 1);
        assert!(*vector::borrow(items, 0) == 1, 2);
        assert!(*vector::borrow(items, 1) == 1, 3);
        
        transfer::transfer(shop, @0x0);
        inventory::transfer_test_inventory(player_inventory, @0x0);
    }
    
    #[test]
    #[expected_failure(abort_code = EITEM_NOT_FOUND)]
    fun test_buy_nonexistent_item() {
        let mut ctx = tx_context::dummy();
        
        let mut shop = ShopInventory {
            id: object::new(&mut ctx),
            items: vector::empty<ShopItem>()
        };

        let mut player_inventory = inventory::create_test_inventory(@0x0, &mut ctx);

        buy_item(&mut shop, &mut player_inventory, 999, 1, &mut ctx);
        
        transfer::transfer(shop, @0x0);
        inventory::transfer_test_inventory(player_inventory, @0x0);
    }
}