module OnePet::daily_limits {
    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::clock::Clock;
    
    const MILLISECONDS_PER_DAY: u64 = 86400000;
    
    public struct DailyTracker has key {
        id: object::UID,
        last_reset_time: u64,
        spins_used_today: u64,
        max_daily_spins: u64,
    }
    
    public entry fun init_daily_tracker(ctx: &mut tx_context::TxContext) {
        let tracker = DailyTracker {
            id: object::new(ctx),
            last_reset_time: 0,
            spins_used_today: 0,
            max_daily_spins: 1,
        };
        transfer::transfer(tracker, tx_context::sender(ctx));
    }
    
    public fun can_spin(tracker: &mut DailyTracker, clock: &Clock): bool {
        check_and_reset_daily(tracker, clock);
        tracker.spins_used_today < tracker.max_daily_spins
    }
    
    public fun get_remaining_spins(tracker: &mut DailyTracker, clock: &Clock): u64 {
        check_and_reset_daily(tracker, clock);
        if (tracker.max_daily_spins > tracker.spins_used_today) {
            tracker.max_daily_spins - tracker.spins_used_today
        } else {
            0
        }
    }
    
    public fun get_next_reset_time(tracker: &DailyTracker, clock: &Clock): u64 {
        let current_time = one::clock::timestamp_ms(clock);
        let next_reset = tracker.last_reset_time + MILLISECONDS_PER_DAY;
        if (current_time >= next_reset) {
            current_time
        } else {
            next_reset
        }
    }
    
    public fun get_time_until_next_spin(tracker: &DailyTracker, clock: &Clock): u64 {
        let current_time = one::clock::timestamp_ms(clock);
        let next_reset = get_next_reset_time(tracker, clock);
        if (next_reset > current_time) {
            next_reset - current_time
        } else {
            0
        }
    }

    public fun record_spin(tracker: &mut DailyTracker, clock: &Clock) {
        check_and_reset_daily(tracker, clock);
        tracker.spins_used_today = tracker.spins_used_today + 1;
    }
    
    fun check_and_reset_daily(tracker: &mut DailyTracker, clock: &Clock) {
        let current_time = one::clock::timestamp_ms(clock);
        
        if (current_time >= tracker.last_reset_time + MILLISECONDS_PER_DAY) {
            tracker.spins_used_today = 0;
            tracker.last_reset_time = current_time;
        };
    }
    
    #[test_only]
    public fun create_test_daily_tracker(owner: address, ctx: &mut tx_context::TxContext): DailyTracker {
        DailyTracker {
            id: object::new(ctx),
            last_reset_time: 0,
            spins_used_today: 0,
            max_daily_spins: 1,
        }
    }

    #[test_only]
    public fun transfer_test_daily_tracker(daily_tracker: DailyTracker, recipient: address) {
        transfer::transfer(daily_tracker, recipient);
    }

    #[test_only]
    public fun set_test_time(tracker: &mut DailyTracker, reset_time: u64, spins_used: u64) {
        tracker.last_reset_time = reset_time;
        tracker.spins_used_today = spins_used;
    }
}