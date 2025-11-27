module OnePet::random_system {

    use one::tx_context;
        
    public fun random_between(min: u64, max: u64, ctx: &mut tx_context::TxContext): u64 {
        if (min == max) {
            return min
        };
        
        let epoch = tx_context::epoch(ctx);
        let range = max - min + 1;
        
        let a: u128 = 6364136223846793005;
        let c: u128 = 1442695040888963407;
        let m: u128 = 2^64;
        
        let seed: u128 = (epoch as u128) * a + c;
        let random_num = (seed % m) as u64;
        let result = min + (random_num % range);
        
        result
    }
    
    public fun random_chance(percent: u64, ctx: &mut tx_context::TxContext): bool {
        let roll = random_between(0, 99, ctx);
        roll < percent
    }
}