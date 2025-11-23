module OnePet::stat_system {
    use std::string;
    use one::object;
    use one::transfer;
    use one::tx_context;
    
    public struct PetStats has copy, drop, store { 
        total_users: u64,
        total_pets_created: u64,
        total_battles_fought: u64,
        total_tokens_earned: u64,
        total_items_purchased: u64,
        total_feed_actions: u64,
        total_play_actions: u64,
        total_drink_actions: u64,
        total_sleep_actions: u64
    }
    
    public struct GlobalStats has key {
        id: object::UID,
        stats: PetStats
    }
    
    public entry fun init(ctx: &mut tx_context::TxContext) {
        let global_stats = GlobalStats {
            id: object::new(ctx),
            stats: PetStats {
                total_users: 0,
                total_pets_created: 0,
                total_battles_fought: 0,
                total_tokens_earned: 0,
                total_items_purchased: 0,
                total_feed_actions: 0,
                total_play_actions: 0,
                total_drink_actions: 0,
                total_sleep_actions: 0
            }
        };
        transfer::transfer(global_stats, tx_context::sender(ctx));
    }
    
    public entry fun record_user_registration(stats: &mut GlobalStats) {
        stats.stats.total_users = stats.stats.total_users + 1;
    }
    
    public entry fun record_pet_creation(stats: &mut GlobalStats) {
        stats.stats.total_pets_created = stats.stats.total_pets_created + 1;
    }
    
    public entry fun record_battle(stats: &mut GlobalStats, tokens_earned: u64) {
        stats.stats.total_battles_fought = stats.stats.total_battles_fought + 1;
        stats.stats.total_tokens_earned = stats.stats.total_tokens_earned + tokens_earned;
    }
    
    public entry fun record_item_purchase(stats: &mut GlobalStats, quantity: u64) {
        stats.stats.total_items_purchased = stats.stats.total_items_purchased + quantity;
    }
    
    public entry fun record_feed_action(stats: &mut GlobalStats) {
        stats.stats.total_feed_actions = stats.stats.total_feed_actions + 1;
    }
    
    public entry fun record_play_action(stats: &mut GlobalStats) {
        stats.stats.total_play_actions = stats.stats.total_play_actions + 1;
    }
    
    public entry fun record_drink_action(stats: &mut GlobalStats) {
        stats.stats.total_drink_actions = stats.stats.total_drink_actions + 1;
    }
    
    public entry fun record_sleep_action(stats: &mut GlobalStats) {
        stats.stats.total_sleep_actions = stats.stats.total_sleep_actions + 1;
    }
    
    public fun get_stats(stats: &GlobalStats): PetStats {
        stats.stats
    }
    
    public fun get_total_users(stats: &GlobalStats): u64 {
        stats.stats.total_users
    }
    
    public fun get_total_pets(stats: &GlobalStats): u64 {
        stats.stats.total_pets_created
    }
    
    public fun get_total_battles(stats: &GlobalStats): u64 {
        stats.stats.total_battles_fought
    }

    #[test_only]
    public fun create_test_global_stats(owner: address, ctx: &mut tx_context::TxContext): GlobalStats {
        GlobalStats {
            id: object::new(ctx),
            stats: PetStats {
                total_users: 0,
                total_pets_created: 0,
                total_battles_fought: 0,
                total_tokens_earned: 0,
                total_items_purchased: 0,
                total_feed_actions: 0,
                total_play_actions: 0,
                total_drink_actions: 0,
                total_sleep_actions: 0
            }
        }
    }

    #[test_only] 
    public fun transfer_test_global_stats(stats: GlobalStats, recipient: address) {
        transfer::transfer(stats, recipient);
    }
}