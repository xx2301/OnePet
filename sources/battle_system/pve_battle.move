module OnePet::pve_battle {
    use std::string;
    use one::object;
    use one::transfer;
    use one::tx_context;
    
    use OnePet::pet_stats;
    use OnePet::stat_system;
    use OnePet::random_system;

    public struct BattleResult has copy, drop {
        winner: address,
        exp_gained: u64,
        tokens_earned: u64
    }
    
    public struct Monster has key {
        id: object::UID,
        level: u64,
        health: u64,
        attack: u64,
        name: string::String
    }
    
    public entry fun create_monster_based_on_pet_level(pet_level: u64, name: vector<u8>, ctx: &mut tx_context::TxContext) {
        let min_level = if (pet_level > 3) pet_level - 2 else 1;
        let max_level = pet_level + 2;
        create_monster(min_level, max_level, name, ctx);
    }

    public entry fun create_monster(min_level: u64, max_level: u64, name: vector<u8>, ctx: &mut tx_context::TxContext) {
        let level = random_system::random_between(min_level, max_level, ctx);
        let health = level * 20;
        let attack = level * 5;
        
        let monster = Monster {
            id: object::new(ctx),
            level: level,
            health: health,
            attack: attack,
            name: string::utf8(name)
        };
        
        transfer::transfer(monster, tx_context::sender(ctx));
    }
    
    public entry fun start_pve_battle(player: address, pet: &mut pet_stats::PetNFT, monster: &mut Monster, stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext): BattleResult {
        let pet_level = pet_stats::get_level(pet);
        let pet_health = pet_stats::get_health(pet);
        
        let is_victory = pet_level >= monster.level && pet_health > 0;
        
        let result = if (is_victory) {
            let exp_gain = monster.level * 10;
            let tokens = monster.level * 5;
            
            pet_stats::level_up(pet, exp_gain);
            
            stat_system::record_battle(stats, tokens);
            
            BattleResult {
                winner: player,
                exp_gained: exp_gain,
                tokens_earned: tokens
            }
        } else {
            BattleResult {
                winner: @0x0,
                exp_gained: monster.level * 2,
                tokens_earned: 0
            }
        };
        
        result
    }
    
    #[test_only]
    public fun create_test_monster(
        level: u64,
        name: vector<u8>,
        ctx: &mut tx_context::TxContext
    ): Monster {
        let health = level * 20;
        let attack = level * 5;
        
        Monster {
            id: object::new(ctx),
            level: level,
            health: health,
            attack: attack,
            name: string::utf8(name)
        }
    }
    
    #[test_only]
    public fun transfer_test_monster(monster: Monster, recipient: address) {
        transfer::transfer(monster, recipient);
    }
        
    #[test]
    fun test_create_monster() {
        let mut ctx = tx_context::dummy();
        
        //create monster
        let monster = create_test_monster(5, b"Test Monster", &mut ctx);
        
        assert!(monster.level == 5, 1);
        assert!(monster.health == 100, 2); // 5 * 20 = 100
        assert!(monster.attack == 25, 3);  // 5 * 5 = 25
        
        transfer_test_monster(monster, @0x0);
    }
    
    #[test]
    fun test_battle_victory() {
        let mut ctx = tx_context::dummy();
        
        let mut pet = pet_stats::create_test_pet(@0x1, 10, 100, 50, &mut ctx);
       
        let mut monster = create_test_monster(5, b"Goblin", &mut ctx);
        let mut stats = stat_system::create_test_global_stats(@0x1, &mut ctx);
        
        let initial_pet_level = pet_stats::get_level(&pet);
        
        let result = start_pve_battle(@0x1, &mut pet, &mut monster, &mut stats, &mut ctx);
        
        assert!(result.winner == @0x1, 1);
        assert!(result.exp_gained == 50, 2);  // 5 * 10 = 50
        assert!(result.tokens_earned == 25, 3); // 5 * 5 = 25
        
        let new_pet_level = pet_stats::get_level(&pet);
        assert!(new_pet_level >= initial_pet_level, 4);
        
        pet_stats::transfer_test_pet(pet, @0x0);
        transfer_test_monster(monster, @0x0);
        stat_system::transfer_test_global_stats(stats, @0x0);
    }
    
    #[test]
    fun test_battle_defeat() {
        let mut ctx = tx_context::dummy();
        
        //level 3 pet
        let mut pet = pet_stats::create_test_pet(@0x1, 3, 60, 30, &mut ctx);
        //level 8 pet
        let mut monster = create_test_monster(8, b"Dragon", &mut ctx);
        let mut stats = stat_system::create_test_global_stats(@0x1, &mut ctx);
        
        let initial_pet_level = pet_stats::get_level(&pet);
        
        //pet might loss
        let result = start_pve_battle(@0x1, &mut pet, &mut monster, &mut stats, &mut ctx);
        
        assert!(result.winner == @0x0, 1);  //loss
        assert!(result.exp_gained == 16, 2); //8*2 = 16
        assert!(result.tokens_earned == 0, 3); //no token because loss
        
        let new_pet_level = pet_stats::get_level(&pet);
        assert!(new_pet_level == initial_pet_level, 4);
        
        pet_stats::transfer_test_pet(pet, @0x0);
        transfer_test_monster(monster, @0x0);
        stat_system::transfer_test_global_stats(stats, @0x0);
    }
    
    #[test]
    fun test_battle_equal_level() {
        let mut ctx = tx_context::dummy();
        
        let mut pet = pet_stats::create_test_pet(@0x1, 7, 100, 40, &mut ctx);
        let mut monster = create_test_monster(7, b"Orc", &mut ctx);
        let mut stats = stat_system::create_test_global_stats(@0x1, &mut ctx);
        
        let result = start_pve_battle(@0x1, &mut pet, &mut monster, &mut stats, &mut ctx);
        
        assert!(result.winner == @0x1, 1);  //pet won
        assert!(result.exp_gained == 70, 2); //7*10 = 70
        assert!(result.tokens_earned == 35, 3); //7*5 = 35
        
        pet_stats::transfer_test_pet(pet, @0x0);
        transfer_test_monster(monster, @0x0);
        stat_system::transfer_test_global_stats(stats, @0x0);
    }
    
    #[test]
    fun test_multiple_battles() {
        let mut ctx = tx_context::dummy();
        
        //create pet and multiple monster
        let mut pet = pet_stats::create_test_pet(@0x1, 6, 80, 35, &mut ctx);
        let mut stats = stat_system::create_test_global_stats(@0x1, &mut ctx);
        
        let mut monster1 = create_test_monster(4, b"Slime", &mut ctx);
        let result1 = start_pve_battle(@0x1, &mut pet, &mut monster1, &mut stats, &mut ctx);
        assert!(result1.winner == @0x1, 1);
        
        let mut monster2 = create_test_monster(6, b"Wolf", &mut ctx);
        let result2 = start_pve_battle(@0x1, &mut pet, &mut monster2, &mut stats, &mut ctx);
        assert!(result2.winner == @0x1, 2);
        
        //third battle might loss
        let mut monster3 = create_test_monster(9, b"Giant", &mut ctx);
        let result3 = start_pve_battle(@0x1, &mut pet, &mut monster3, &mut stats, &mut ctx);
        assert!(result3.winner == @0x0, 3);
        
        pet_stats::transfer_test_pet(pet, @0x0);
        transfer_test_monster(monster1, @0x0);
        transfer_test_monster(monster2, @0x0);
        transfer_test_monster(monster3, @0x0);
        stat_system::transfer_test_global_stats(stats, @0x0);
    }
    
    #[test]
    fun test_monster_stats_calculation() {
        let mut ctx = tx_context::dummy();
        
        let monster1 = create_test_monster(1, b"Baby Monster", &mut ctx);
        assert!(monster1.health == 20, 1);  // 1 * 20
        assert!(monster1.attack == 5, 2);   // 1 * 5
        
        let monster5 = create_test_monster(5, b"Medium Monster", &mut ctx);
        assert!(monster5.health == 100, 3); // 5 * 20
        assert!(monster5.attack == 25, 4);  // 5 * 5
        
        let monster10 = create_test_monster(10, b"Boss Monster", &mut ctx);
        assert!(monster10.health == 200, 5); // 10 * 20
        assert!(monster10.attack == 50, 6);  // 10 * 5
        
        transfer_test_monster(monster1, @0x0);
        transfer_test_monster(monster5, @0x0);
        transfer_test_monster(monster10, @0x0);
    }
}