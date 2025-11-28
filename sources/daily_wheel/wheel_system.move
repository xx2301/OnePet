module OnePet::wheel_system {
    use one::tx_context;
    use one::object;
    use one::transfer;
    use one::clock::Clock;

    use OnePet::inventory;
    use OnePet::daily_limits;
    use OnePet::random_system;
    use OnePet::pet_token;
    use OnePet::pet_stats;

    const REWARD_TOKENS: u64 = 0;
    const REWARD_EXP: u64 = 1;
    const REWARD_ITEM: u64 = 2;
    const REWARD_RARE: u64 = 3;

    const EDAILY_LIMIT_EXCEEDED: u64 = 413;
    
    public struct WheelReward has copy, drop {
        reward_type: u64,
        amount: u64,
        description: vector<u8>
    }
    
    #[allow(unused_field)]
    public struct WheelSpun has copy, drop {
        player: address,
        reward_type: u64,
        amount: u64
    }
    
    public entry fun spin_wheel(daily_tracker: &mut daily_limits::DailyTracker, player_inventory: &mut inventory::PlayerInventory, pet: &mut pet_stats::PetNFT, clock: &Clock, ctx: &mut tx_context::TxContext): WheelReward {
        assert!(daily_limits::can_spin(daily_tracker, clock), EDAILY_LIMIT_EXCEEDED);
        daily_limits::record_spin(daily_tracker, clock);

        let seed = random_system::random_between(0, 100, ctx);

        let reward = if (seed < 40) {
            let token_amount = random_system::random_between(10, 30, ctx);
            pet_token::mint_test_tokens(tx_context::sender(ctx), token_amount, ctx);
            WheelReward {
                reward_type: REWARD_TOKENS,
                amount: token_amount,
                description: b"Token Reward"
            }
        } else if (seed < 70) {
            let exp_amount = random_system::random_between(50, 100, ctx);
            pet_stats::level_up(pet, exp_amount);
            WheelReward {
                reward_type: REWARD_EXP,
                amount: exp_amount,
                description: b"Experience Reward"
            }
        } else if (seed < 95) {
            let item_id = random_system::random_between(1, 4, ctx);
            inventory::add_item(player_inventory, item_id);
            WheelReward {
                reward_type: REWARD_ITEM,
                amount: 1,
                description: b"Special Item"
            }
        } else {
            let rare_amount = random_system::random_between(50, 100, ctx);
            pet_token::mint_test_tokens(tx_context::sender(ctx), rare_amount, ctx);
            WheelReward {
                reward_type: REWARD_RARE,
                amount: rare_amount,
                description: b"Rare Reward!"
            }
        };
        reward
    }
    
    #[test]
    fun test_spin_wheel_multiple_times() {
        let mut ctx = tx_context::dummy();
        
        let mut daily_tracker = daily_limits::create_test_daily_tracker(@0x1, &mut ctx);
        let mut inventory = inventory::create_test_inventory(@0x1, &mut ctx);
        let mut pet = pet_stats::create_test_pet(@0x1, 1, 100, 50, &mut ctx);
        
        let clock = one::clock::create_for_testing(&mut ctx);
        
        let reward1 = spin_wheel(&mut daily_tracker, &mut inventory, &mut pet, &clock, &mut ctx);
        
        assert!(reward1.amount > 0, 1);
        assert!(reward1.reward_type >= 0 && reward1.reward_type <= 3, 2);
        
        daily_limits::transfer_test_daily_tracker(daily_tracker, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        pet_stats::transfer_test_pet(pet, @0x0);
        one::clock::destroy_for_testing(clock);
    }

    #[test]
    #[expected_failure(abort_code = EDAILY_LIMIT_EXCEEDED)]
    fun test_daily_limit() {
        let mut ctx = tx_context::dummy();
        
        let mut daily_tracker = daily_limits::create_test_daily_tracker(@0x1, &mut ctx);
        let mut inventory = inventory::create_test_inventory(@0x1, &mut ctx);
        let mut pet = pet_stats::create_test_pet(@0x1, 1, 100, 50, &mut ctx); 
        
        let clock = one::clock::create_for_testing(&mut ctx);
        
        let _ = spin_wheel(&mut daily_tracker, &mut inventory, &mut pet, &clock, &mut ctx); 
        let _ = spin_wheel(&mut daily_tracker, &mut inventory, &mut pet, &clock, &mut ctx);
        
        daily_limits::transfer_test_daily_tracker(daily_tracker, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        pet_stats::transfer_test_pet(pet, @0x0);
        one::clock::destroy_for_testing(clock);
    }
}