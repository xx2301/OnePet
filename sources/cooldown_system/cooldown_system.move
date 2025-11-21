module OnePet::cooldown_system {
    
    use one::object;
    use one::transfer;
    use one::tx_context;
    
    public struct ActionCooldown has key {
        id: object::UID,
        last_feed_time: u64,
        last_play_time: u64,
        last_train_time: u64,
        last_sleep_time: u64,
    }
    
    const COOLDOWN_FEED: u64 = 3600; //1hr
    const COOLDOWN_PLAY: u64 = 1800; //30mins
    const COOLDOWN_TRAIN: u64 = 7200; //2hrs
    const COOLDOWN_SLEEP: u64 = 14400; //4hrs
    
    public entry fun init_cooldown(ctx: &mut tx_context::TxContext) {
        let cooldown = ActionCooldown {
            id: object::new(ctx),
            last_feed_time: 0,
            last_play_time: 0,
            last_train_time: 0,
            last_sleep_time: 0,
        };
        transfer::transfer(cooldown, tx_context::sender(ctx));
    }
    
    public fun can_feed(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_feed_time + COOLDOWN_FEED
    }
    
    public fun can_play(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_play_time + COOLDOWN_PLAY
    }
    
    /*public fun can_sleep(cooldown: &ActionCooldown, current_time: u64): bool {
        current_time >= cooldown.last_sleep_time + COOLDOWN_SLEEP
    }*/
    
    public fun update_feed(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_feed_time = current_time;
    }
    
    public fun update_play(cooldown: &mut ActionCooldown, current_time: u64) {
        cooldown.last_play_time = current_time;
    }
    
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
        }
    }
}