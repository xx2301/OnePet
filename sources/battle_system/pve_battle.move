module OnePet::pve_battle {
    use OnePet::pet_factory;
    
    public struct BattleResult has copy, drop {
        winner: address,
        exp_gained: u64,
        tokens_earned: u64
    }
    
    public entry fun start_pve_battle(
        pet: &mut pet_factory::PetNFT,
        monster_level: u64,
        ctx: &mut TxContext
    ): BattleResult {
        let pet_level = pet_factory::get_level(pet);
        let is_victory = pet_level >= monster_level;
        
        let result = if (is_victory) {
            let exp_gain = monster_level * 10;
            pet_factory::level_up(pet, exp_gain);
            
            BattleResult {
                winner: tx_context::sender(ctx),
                exp_gained: exp_gain,
                tokens_earned: monster_level * 5
            }
        } else {
            BattleResult {
                winner: @0x0,
                exp_gained: monster_level * 2,
                tokens_earned: 0
            }
        };
        
        result
    }
    
    #[test]
    fun test_battle() {
        
    }
}