module OnePet::random_system {

    use one::tx_context;

    public fun random_between(min: u64, max: u64, ctx: &mut tx_context::TxContext): u64 {
        if (min == max) {
            return min
        };
        
        let epoch = tx_context::epoch(ctx);
        let range = max - min + 1;
        
        let seed1 = epoch * 1664525 + 1013904223;
        let seed2 = epoch * 22695477 + 1;
        
        let combined_seed = (seed1 + seed2) % 1000000;
        let random_value = combined_seed % range;
        
        min + random_value
    }
    
    public fun random_chance(percent: u64, ctx: &mut tx_context::TxContext): bool {
        let roll = random_between(0, 99, ctx);
        roll < percent
    }
}