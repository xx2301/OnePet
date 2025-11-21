module OnePet::stat_system {
    
    public struct PetStats has copy, drop, store { 
        total_pets_created: u64,
        total_battles_fought: u64,
        total_tokens_earned: u64
    }
    
    public struct GlobalStats has key {
        id: UID,
        stats: PetStats
    }
    
    fun init(ctx: &mut TxContext) {
        let global_stats = GlobalStats {
            id: object::new(ctx),
            stats: PetStats {
                total_pets_created: 0,
                total_battles_fought: 0,
                total_tokens_earned: 0
            }
        };
        transfer::transfer(global_stats, tx_context::sender(ctx));
    }
    
    public entry fun record_pet_creation(stats: &mut GlobalStats) {
        stats.stats.total_pets_created = stats.stats.total_pets_created + 1;
    }
    
    public entry fun record_battle(stats: &mut GlobalStats,tokens_earned: u64) {
        stats.stats.total_battles_fought = stats.stats.total_battles_fought + 1;
        stats.stats.total_tokens_earned = stats.stats.total_tokens_earned + tokens_earned;
    }
    
    public fun get_stats(stats: &GlobalStats): PetStats {
        stats.stats
    }

    #[test_only]
    public fun create_test_global_stats(owner: address, ctx: &mut tx_context::TxContext): GlobalStats {
        GlobalStats {
            id: object::new(ctx),
            stats: PetStats {
                total_pets_created: 0,
                total_battles_fought: 0,
                total_tokens_earned: 0
            }
        }
    }

    #[test_only] 
    public fun transfer_test_global_stats(stats: GlobalStats, recipient: address) {
        transfer::transfer(stats, recipient);
    }
}