module OnePet::random_system {

    use one::tx_context;
    use one::object;

    public fun random_between(min: u64, max: u64, ctx: &mut tx_context::TxContext): u64 {
        if (min == max) {
            return min
        };
        
        let range = max - min + 1;
        
        let temp_obj = object::new(ctx);
        let uid_bytes = object::uid_to_bytes(&temp_obj);
        
        let mut random_num: u64 = 0;
        let mut i = 0;
        while (i < vector::length(&uid_bytes)) {
            random_num = random_num + (*vector::borrow(&uid_bytes, i) as u64);
            i = i + 1;
        };
        
        object::delete(temp_obj);
        min + (random_num % range)
    }
    
    public fun random_chance(percent: u64, ctx: &mut tx_context::TxContext): bool {
        let roll = random_between(0, 99, ctx);
        roll < percent
    }
}