module OnePet::pet_token {
    use std::option;
    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::coin;
    
    public struct PET has drop {

    }  
    
    public struct PetCoin has key {
        id: object::UID,
        balance: u64
    }
    
    fun init(_ctx: &mut tx_context::TxContext) {
        
    }
    
    public entry fun mint_test_tokens(recipient: address, amount: u64, ctx: &mut tx_context::TxContext) {
        let coin = PetCoin {
            id: object::new(ctx),
            balance: amount
        };
        transfer::transfer(coin, recipient);
    }

    #[test_only]
    public fun mint_test_tokens_for_test(amount: u64, ctx: &mut tx_context::TxContext): PetCoin {
        PetCoin {
            id: object::new(ctx),
            balance: amount
        }
    }
    
    public entry fun transfer_tokens(coin: &mut PetCoin,to: address,amount: u64,ctx: &mut tx_context::TxContext) {
        assert!(coin.balance >= amount, 100);
        coin.balance = coin.balance - amount;
        
        let new_coin = PetCoin {
            id: object::new(ctx),
            balance: amount
        };
        transfer::transfer(new_coin, to);
    }
    
    public fun get_balance(coin: &PetCoin): u64 {
        coin.balance
    }
    
    #[test_only]
    public fun transfer_test_pet_coin(coin: PetCoin, recipient: address) {
        transfer::transfer(coin, recipient);
    }

    #[test]
    fun test_token_creation() {
        let mut ctx = tx_context::dummy();
        
        let coin = mint_test_tokens_for_test(1000, &mut ctx);
        let balance = get_balance(&coin);
        
        assert!(balance == 1000, 1);
        assert!(coin.balance == 1000, 2);
        
        transfer_test_pet_coin(coin, @0x0);
    }
    
    #[test]
    fun test_balance_query() {
        let mut ctx = tx_context::dummy();
        
        let coin1 = mint_test_tokens_for_test(500, &mut ctx);
        let coin2 = mint_test_tokens_for_test(1500, &mut ctx);
        
        assert!(get_balance(&coin1) == 500, 1);
        assert!(get_balance(&coin2) == 1500, 2);
        
        transfer_test_pet_coin(coin1, @0x0);
        transfer_test_pet_coin(coin2, @0x0);
    }
    
    #[test]
    fun test_token_transfer() {
        let mut ctx = tx_context::dummy();
        let recipient = @0x123;
        
        let mut coin = mint_test_tokens_for_test(1000, &mut ctx);
        assert!(get_balance(&coin) == 1000, 1);
        
        transfer_tokens(&mut coin, recipient, 300, &mut ctx);
        assert!(get_balance(&coin) == 700, 2);
        
        transfer_tokens(&mut coin, recipient, 200, &mut ctx);
        assert!(get_balance(&coin) == 500, 3);
        
        transfer_test_pet_coin(coin, @0x0);
    }
    
    #[test]
    #[expected_failure(abort_code = 100)]
    fun test_transfer_insufficient_balance() {
        let mut ctx = tx_context::dummy();
        let recipient = @0x123;
        
        let mut coin = mint_test_tokens_for_test(500, &mut ctx);
        
        transfer_tokens(&mut coin, recipient, 600, &mut ctx);
        
        transfer_test_pet_coin(coin, @0x0);
    }
    
    #[test]
    fun test_transfer_exact_balance() {
        let mut ctx = tx_context::dummy();
        let recipient = @0x123;
        
        let mut coin = mint_test_tokens_for_test(1000, &mut ctx);
        transfer_tokens(&mut coin, recipient, 1000, &mut ctx);
        
        assert!(get_balance(&coin) == 0, 1);
        
        transfer_test_pet_coin(coin, @0x0);
    }
    
    #[test]
    fun test_multiple_transfers() {
        let mut ctx = tx_context::dummy();
        let recipient1 = @0x123;
        let recipient2 = @0x456;
        
        let mut coin = mint_test_tokens_for_test(2000, &mut ctx);
        
        transfer_tokens(&mut coin, recipient1, 500, &mut ctx);
        assert!(get_balance(&coin) == 1500, 1);
        
        transfer_tokens(&mut coin, recipient2, 750, &mut ctx);
        assert!(get_balance(&coin) == 750, 2);
        
        transfer_tokens(&mut coin, recipient1, 250, &mut ctx);
        assert!(get_balance(&coin) == 500, 3);
        
        transfer_test_pet_coin(coin, @0x0);
    }
    
    #[test]
    fun test_mint_entry_function() {
        let mut ctx = tx_context::dummy();
        let recipient = @0x789;
        
        mint_test_tokens(recipient, 2500, &mut ctx);
    }
}