module OnePet::daily_limits {

    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::clock::Clock;
    
    public struct DailyTracker has key {
        id: object::UID,
        last_spin_date: u64,
        spins_used_today: u64,
        max_daily_spins: u64,
    }
    
    public entry fun init_daily_tracker(ctx: &mut tx_context::TxContext) {
        let tracker = DailyTracker {
            id: object::new(ctx),
            last_spin_date: 0,
            spins_used_today: 0,
            max_daily_spins: 1,
        };
        transfer::transfer(tracker, tx_context::sender(ctx));
    }
    
    public fun can_spin(tracker: &mut DailyTracker, clock: &Clock): bool {
        let current_time = one::clock::timestamp_ms(clock);
        let current_day = current_time / 86400000;
        
        if (tracker.last_spin_date / 86400000 < current_day) {
            tracker.last_spin_date = current_time;
            tracker.spins_used_today = 0;
        };
        
        tracker.spins_used_today < tracker.max_daily_spins
    }
    
    public fun record_spin(tracker: &mut DailyTracker) {
        tracker.spins_used_today = tracker.spins_used_today + 1;
    }

    public fun transfer_test_daily_tracker(daily_tracker: DailyTracker, recipient: address) {
        transfer::transfer(daily_tracker, recipient);
    }

    #[test_only]
    public fun create_test_daily_tracker(owner: address, ctx: &mut tx_context::TxContext): DailyTracker {
        DailyTracker {
            id: object::new(ctx),
            last_spin_date: 0,
            spins_used_today: 0,
            max_daily_spins: 1,
        }
    }
}