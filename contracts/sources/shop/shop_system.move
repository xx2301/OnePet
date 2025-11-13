module OnePet::shop_system {
    
    const ITEM_FOOD: u64 = 0;
    const ITEM_TOY: u64 = 1;
    const ITEM_MEDICINE: u64 = 2;
    
    public struct ShopItem has copy, drop {
        item_id: u64,
        item_type: u64,
        name: vector<u8>,
        price: u64,
        effect: u64
    }

    #[allow(unused_field)]    
    public struct ItemPurchased has copy, drop {
        buyer: address,
        item_id: u64,
        quantity: u64,
        total_cost: u64
    }
    
    public fun get_shop_items(): vector<ShopItem> {
        let mut items = vector::empty<ShopItem>(); //这里加了mut why？
        
        vector::push_back(&mut items, ShopItem {
            item_id: 1,
            item_type: ITEM_FOOD,
            name: b"Premium Pet Food",
            price: 10,
            effect: 20
        });
        
        vector::push_back(&mut items, ShopItem {
            item_id: 2,
            item_type: ITEM_TOY,
            name: b"Ball Toy",
            price: 15,
            effect: 15
        });
        
        vector::push_back(&mut items, ShopItem {
            item_id: 3,
            item_type: ITEM_MEDICINE,
            name: b"Health Potion",
            price: 25,
            effect: 30
        });
        
        items
    }
    
    public entry fun buy_item(
        item_id: u64,
        quantity: u64,
        ctx: &mut TxContext
    ) {
        let _buyer = tx_context::sender(ctx);
        let items = get_shop_items();
        let mut total_cost: u64 = 0;
        let mut item_found = false;
        
        let mut i = 0;
        while (i < vector::length(&items)) {
            let item = vector::borrow(&items, i);
            if (item.item_id == item_id) {
                total_cost = item.price * quantity;
                item_found = true;
                break;
            };
            i = i + 1;
        };
        
        assert!(item_found, 1); // EItemNotFound
        assert!(total_cost > 0, 2); // EInvalidTotal
        
        // (stop this first)
        // event::emit(ItemPurchased {
        //     buyer: buyer,
        //     item_id: item_id,
        //     quantity: quantity,
        //     total_cost: total_cost
        // });
    }
    
    #[test]
    fun test_shop_items() {
        let items = get_shop_items();
        assert!(vector::length(&items) == 3, 1);
    }
    
    #[test]
    fun test_buy_item() {
        let mut ctx = tx_context::dummy();
        buy_item(1, 2, &mut ctx);
    }
}