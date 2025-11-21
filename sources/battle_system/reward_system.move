module OnePet::reward_system {
    use std::string;
    use one::object;
    use one::transfer;
    use one::tx_context;
    
    use OnePet::inventory;
    use OnePet::profile_badge;

    const ACHIEVEMENT_FIRST_PET: u64 = 0;
    const ACHIEVEMENT_FIRST_BATTLE: u64 = 1;
    const ACHIEVEMENT_PET_LEVEL_10: u64 = 2;

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
    
    public entry fun claim_daily_reward(
        daily_reward: &mut DailyReward,
        player_inventory: &mut inventory::PlayerInventory,
        badge: &mut profile_badge::ProfileBadge,
        ctx: &mut tx_context::TxContext
    ) {
        let current_time = tx_context::epoch(ctx);
        let time_since_last_claim = current_time - daily_reward.last_claim_time;
        
        //claim daily check in streak_bonus
        if (time_since_last_claim >= 86400 || daily_reward.last_claim_time == 0) {
            if (time_since_last_claim < 172800) {
                daily_reward.streak_count = daily_reward.streak_count + 1;
            } else {
                daily_reward.streak_count = 1;
            };
            
            daily_reward.last_claim_time = current_time;
            
            let base_reward = 50;
            let streak_bonus = daily_reward.streak_count * 10;
            let total_items = base_reward + streak_bonus;
            
            let mut i = 0;
            while (i < total_items / 10) {
                inventory::add_item(player_inventory, 1);
                i = i + 1;
            };
            
            profile_badge::update_reputation(badge, 5);
        };
    }
    
    public entry fun check_achievement(achievement: &mut Achievement, player_inventory: &mut inventory::PlayerInventory, badge: &mut profile_badge::ProfileBadge, ctx: &mut tx_context::TxContext) {
        if (achievement.completed && !achievement.reward_claimed) {
            achievement.reward_claimed = true;
            
            if (achievement.achievement_type == ACHIEVEMENT_FIRST_PET) {
                inventory::add_item(player_inventory, 2);
                inventory::add_item(player_inventory, 3);
                profile_badge::update_reputation(badge, 20);
            } else if (achievement.achievement_type == ACHIEVEMENT_FIRST_BATTLE) {
                inventory::add_item(player_inventory, 4);
                profile_badge::update_reputation(badge, 15);
            } else if (achievement.achievement_type == ACHIEVEMENT_PET_LEVEL_10) {
                inventory::add_item(player_inventory, 1);
                inventory::add_item(player_inventory, 1);
                inventory::add_item(player_inventory, 1);
                inventory::add_item(player_inventory, 1);
                inventory::add_item(player_inventory, 1);
                profile_badge::update_reputation(badge, 30);
            };
        };
    }
    
    public entry fun create_achievement(achievement_type: u64,ctx: &mut tx_context::TxContext) {
        let achievement = Achievement {
            id: object::new(ctx),
            achievement_type: achievement_type,
            completed: false,
            reward_claimed: false
        };
        transfer::transfer(achievement, tx_context::sender(ctx));
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
        
        //should be correct as the last_claim_time = 0
        claim_daily_reward(&mut daily_reward, &mut inventory, &mut badge, &mut ctx);
        assert!(daily_reward.streak_count == 1, 1);
        
        //clear
        transfer_test_daily_reward(daily_reward, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        profile_badge::transfer_test_badge(badge, @0x0);
    }

    #[test]
    fun test_achievement_reward() {
        let mut ctx = tx_context::dummy();
        
        let mut achievement = create_test_achievement(ACHIEVEMENT_FIRST_PET, &mut ctx);
        let mut inventory = inventory::create_test_inventory(@0x1, &mut ctx);
        let mut badge = profile_badge::create_test_profile(b"test", &mut ctx);
        
        mark_achievement_complete(&mut achievement);
        
        //collect reward
        check_achievement(&mut achievement, &mut inventory, &mut badge, &mut ctx);
        assert!(achievement.reward_claimed, 1);
        
        //clear
        transfer_test_achievement(achievement, @0x0);
        inventory::transfer_test_inventory(inventory, @0x0);
        profile_badge::transfer_test_badge(badge, @0x0);
    }
}