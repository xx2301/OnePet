module OnePet::cooldown_system {
    
    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::clock::Clock;
    
    const COOLDOWN_FEED: u64 = 3600000; //1hr
    const COOLDOWN_PLAY: u64 = 1800000; //30mins
    const COOLDOWN_TRAIN: u64 = 720000; //2hr
    const COOLDOWN_DRINK: u64 = 1800000; //30mins
    const COOLDOWN_SLEEP: u64 = 0;

    public struct ActionCooldown has key {
        id: object::UID,
        last_feed_time: u64,
        last_play_time: u64,
        last_train_time: u64,
        last_sleep_time: u64,
        last_drink_time: u64,
    }
        
    public entry fun init_cooldown(ctx: &mut tx_context::TxContext) {
        let cooldown = ActionCooldown {
            id: object::new(ctx),
            last_feed_time: 0,
            last_play_time: 0,
            last_train_time: 0,
            last_sleep_time: 0,
            last_drink_time: 0,
        };
        transfer::transfer(cooldown, tx_context::sender(ctx));
    }
    
    public fun can_feed(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_feed_time + COOLDOWN_FEED
    }
    
    public fun can_play(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_play_time + COOLDOWN_PLAY
    }

    public fun can_drink(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_drink_time + COOLDOWN_DRINK
    }
    
    public fun update_feed(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_feed_time = current_time;
    }
    
    public fun update_play(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_play_time = current_time;
    }

    public fun update_drink(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_drink_time = current_time;
    }
    
    /*public fun can_sleep(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_sleep_time + COOLDOWN_SLEEP
    }*/

    /*
    public fun update_sleep(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_sleep_time = current_time;
    }*/

    #[test_only]
    public fun create_test_cooldown(owner: address, ctx: &mut tx_context::TxContext): ActionCooldown {
        ActionCooldown {
            id: object::new(ctx),
            last_feed_time: 0,
            last_play_time: 0,
            last_train_time: 0,
            last_sleep_time: 0,
            last_drink_time: 0,
        }
    }
}