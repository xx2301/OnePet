module OnePet::random_system {

    use one::tx_context;
    
    public fun random_between(min: u64, max: u64, ctx: &tx_context::TxContext): u64 {
        let seed = tx_context::epoch(ctx) % (max - min + 1);
        min + seed
    }
    
    public fun random_chance(percent: u64, ctx: &tx_context::TxContext): bool {
        let roll = tx_context::epoch(ctx) % 100;
        roll < percent
    }
}