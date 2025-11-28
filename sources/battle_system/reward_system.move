module OnePet::reward_system {
    use std::string;
    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::clock::Clock;
    
    use OnePet::inventory;
    use OnePet::profile_badge;

    const ACHIEVEMENT_FIRST_PET: u64 = 0;
    const ACHIEVEMENT_FIRST_BATTLE: u64 = 1;
    const ACHIEVEMENT_PET_LEVEL_10: u64 = 2;
    
    const DAILY_REWARD_COOLDOWN: u64 = 86400000; //24hrs = 86400000

    public struct DailyReward has key {
        id: object::UID,
        last_claim_time: u64,
        streak_count: u64
    }
    
    public struct Achievement has key {
        id: object::UID,
        achievement_type: u64,
        completed: bool,
        reward_claimed: bool
    }

    public entry fun init_daily_reward(ctx: &mut tx_context::TxContext) {
        let reward = DailyReward {
            id: object::new(ctx),
            last_claim_time: 0,
            streak_count: 0
        };
        transfer::transfer(reward, tx_context::sender(ctx));
    }
    
    public entry fun create_achievement(achievement_type: u64, ctx: &mut tx_context::TxContext) {
        let achievement = Achievement {
            id: object::new(ctx),
            achievement_type: achievement_type,
            completed: false,
            reward_claimed: false
        };
        transfer::transfer(achievement, tx_context::sender(ctx));
    }
    
    public fun can_claim_daily(daily_reward: &DailyReward, current_time: u64): bool {
        current_time >= daily_reward.last_claim_time + DAILY_REWARD_COOLDOWN || daily_reward.last_claim_time == 0
    }
    
    public fun get_remaining_cooldown(daily_reward: &DailyReward, current_time: u64): u64 {
        if (daily_reward.last_claim_time == 0) {
            return 0
        };
        
        let elapsed = current_time - daily_reward.last_claim_time;
        if (elapsed >= DAILY_REWARD_COOLDOWN) {
            0
        } else {
            DAILY_REWARD_COOLDOWN - elapsed
        }
    }
    
    public fun update_daily_claim(daily_reward: &mut DailyReward, current_time: u64) {
        let time_since_last_claim = if (daily_reward.last_claim_time == 0) {
            DAILY_REWARD_COOLDOWN + 1 // Force streak count to start
        } else {
            current_time - daily_reward.last_claim_time
        };
        
        if (time_since_last_claim < DAILY_REWARD_COOLDOWN * 2) {
            daily_reward.streak_count = daily_reward.streak_count + 1;
        } else {
            daily_reward.streak_count = 1;
        };
        
        daily_reward.last_claim_time = current_time;
    }
    
    public fun calculate_daily_reward(daily_reward: &DailyReward): u64 {
        let base_reward = 50;
        let streak_bonus = daily_reward.streak_count * 10;
        base_reward + streak_bonus
    }
    
    public fun can_claim_achievement(achievement: &Achievement): bool {
        achievement.completed && !achievement.reward_claimed
    }
    
    public fun update_achievement_claim(achievement: &mut Achievement) {
        achievement.reward_claimed = true;
    }
    
    public fun get_achievement_reward(achievement_type: u64): (u64, u64) {
        if (achievement_type == ACHIEVEMENT_FIRST_PET) {
            (2, 20) //(item_count, reputation)
        } else if (achievement_type == ACHIEVEMENT_FIRST_BATTLE) {
            (1, 15)
        } else if (achievement_type == ACHIEVEMENT_PET_LEVEL_10) {
            (5, 30)
        } else {
            (0, 0)
        }
    }
    
    public entry fun claim_daily_reward(daily_reward: &mut DailyReward, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, clock: &Clock, ctx: &mut tx_context::TxContext) {
        let current_time = one::clock::timestamp_ms(clock);
        assert!(can_claim_daily(daily_reward, current_time), 1);
        
        update_daily_claim(daily_reward, current_time);
        
        let total_items = calculate_daily_reward(daily_reward);
        let mut i = 0;
        while (i < total_items / 10) {
            inventory::add_item(player_inventory, 1);
            i = i + 1;
        };
        profile_badge::update_reputation(badge, 5);
    }
    
    public entry fun claim_achievement_reward(achievement: &mut Achievement, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, ctx: &mut tx_context::TxContext) {
        assert!(can_claim_achievement(achievement), 1);
        update_achievement_claim(achievement);
        
        let (item_count, reputation) = get_achievement_reward(achievement.achievement_type);
        
        if (achievement.achievement_type == ACHIEVEMENT_FIRST_PET) {
            inventory::add_item(player_inventory, 2);
            inventory::add_item(player_inventory, 3);
        } else if (achievement.achievement_type == ACHIEVEMENT_FIRST_BATTLE) {
            inventory::add_item(player_inventory, 4);
        } else if (achievement.achievement_type == ACHIEVEMENT_PET_LEVEL_10) {
            let mut i = 0;
            while (i < item_count) {
                inventory::add_item(player_inventory, 1);
                i = i + 1;
            };
        };
        profile_badge::update_reputation(badge, reputation);
    }
    
    public entry fun mark_achievement_complete(achievement: &mut Achievement) {
        achievement.completed = true;
    }
    
    #[test_only]
    public fun create_test_daily_reward(owner: address, ctx: &mut tx_context::TxContext): DailyReward {
        DailyReward {
            id: object::new(ctx),
            last_claim_time: 0,
            streak_count: 0
        }
    }

    #[test_only]
    public fun transfer_test_daily_reward(daily_reward: DailyReward, recipient: address) {
        transfer::transfer(daily_reward, recipient);
    }

    #[test_only]
    public fun create_test_achievement(achievement_type: u64, ctx: &mut tx_context::TxContext): Achievement {
        Achievement {
            id: object::new(ctx),
            achievement_type: achievement_type,
            completed: false,
            reward_claimed: false
        }
    }

    #[test_only]
    public fun transfer_test_achievement(achievement: Achievement, recipient: address) {
        transfer::transfer(achievement, recipient);
    }

    #[test]
    fun test_daily_reward_claim() {
        let mut ctx = tx_context::dummy();
        
        let mut daily_reward = create_test_daily_reward(@0x1, &mut ctx);
        let mut inventory = inventory::create_test_inventory(@0x1, &mut ctx);
        let mut badge = profile_badge::create_test_profile(b"test", &mut ctx);
        
        let clock = one::clock::create_for_testing(&mut ctx);
        
        claim_daily_reward(&mut daily_reward, &mut inventory, &mut badge, &clock, &mut ctx);
        assert!(daily_reward.streak_count == 1, 1);
        
        transfer_test_daily_reward(daily_reward, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        profile_badge::transfer_test_badge(badge, @0x0);
        one::clock::destroy_for_testing(clock);
    }

    #[test]
    fun test_achievement_reward() {
        let mut ctx = tx_context::dummy();
        
        let mut achievement = create_test_achievement(ACHIEVEMENT_FIRST_PET, &mut ctx);
        let mut inventory = inventory::create_test_inventory(@0x1, &mut ctx);
        let mut badge = profile_badge::create_test_profile(b"test", &mut ctx);
        
        mark_achievement_complete(&mut achievement);
        
        claim_achievement_reward(&mut achievement, &mut inventory, &mut badge, &mut ctx);
        assert!(achievement.reward_claimed, 1);
        
        transfer_test_achievement(achievement, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        profile_badge::transfer_test_badge(badge, @0x0);
    }
}