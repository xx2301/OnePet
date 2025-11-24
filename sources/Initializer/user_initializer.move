module OnePet::user_initializer {
    use one::tx_context;
    use one::transfer;
    
    use OnePet::pet_stats;
    use OnePet::inventory;
    use OnePet::daily_limits;
    use OnePet::cooldown_system;
    use OnePet::reward_system;
    use OnePet::profile_badge;
    use OnePet::stat_system;

    public entry fun initialize_user_account(username: vector<u8>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        pet_stats::init_user_state(ctx);
        inventory::init_inventory(ctx);
        daily_limits::init_daily_tracker(ctx);
        cooldown_system::init_cooldown(ctx);
        reward_system::init_daily_reward(ctx);
        profile_badge::create_profile(username, ctx);
        stat_system::record_user_registration(global_stats);
    }
}