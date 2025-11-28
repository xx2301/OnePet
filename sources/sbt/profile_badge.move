module OnePet::profile_badge {
    use std::string;
    use one::object;
    use one::transfer;
    use one::tx_context;

    const EUSERNAME_TOO_LONG: u64 = 1;
    const EUSERNAME_EMPTY: u64 = 2;

    public struct ProfileBadge has key {
        id: object::UID,
        username: string::String,
        join_date: u64,
        reputation: u64,
        battles_won: u64,
        pets_owned: u64
    }
    
    public entry fun create_profile(username: vector<u8>, ctx: &mut tx_context::TxContext) {
        assert!(string::length(&string::utf8(username)) > 0, EUSERNAME_EMPTY);
        assert!(string::length(&string::utf8(username)) <= 10, EUSERNAME_TOO_LONG);

        let badge = ProfileBadge {
            id: object::new(ctx),
            username: string::utf8(username),
            join_date: tx_context::epoch(ctx),
            reputation: 0,
            battles_won: 0,
            pets_owned: 0
        };
        
        transfer::transfer(badge, tx_context::sender(ctx));
    }
    
    public entry fun update_reputation(badge: &mut ProfileBadge, reputation_change: u64) {
        badge.reputation = badge.reputation + reputation_change;
    }

    public fun get_username(badge: &ProfileBadge): &string::String {
        &badge.username
    }

    public fun get_reputation(badge: &ProfileBadge): u64{
        badge.reputation
    }
    
    public entry fun record_battle_win(badge: &mut ProfileBadge) {
        badge.battles_won = badge.battles_won + 1;
        badge.reputation = badge.reputation + 10;
    }

    public fun get_battles_won(badge: &ProfileBadge): u64 {
        badge.battles_won
    }
    
    public entry fun record_pet_ownership(badge: &mut ProfileBadge) {
        badge.pets_owned = badge.pets_owned + 1;
        badge.reputation = badge.reputation + 5;
    }
    
    public fun get_pets_owned(badge: &ProfileBadge): u64 {
        badge.pets_owned
    }

    public fun get_join_date(badge: &ProfileBadge): u64 {
        badge.join_date
    }

    #[test_only]
    public fun create_test_profile(username: vector<u8>, ctx: &mut tx_context::TxContext): ProfileBadge{
        ProfileBadge{
            id: object::new(ctx),
            username: string::utf8(username),
            join_date: tx_context::epoch(ctx),
            reputation: 0,
            battles_won: 0,
            pets_owned: 0
        }
    }

    #[test_only]
    public fun transfer_test_badge(badge: ProfileBadge, recipient: address) {
        transfer::transfer(badge, recipient);
    }

    #[test]
    fun test_create_profile() {
        let mut ctx = tx_context::dummy();
        
        let badge = create_test_profile(b"test_user", &mut ctx);
        
        assert!(get_reputation(&badge) == 0, 1);
        assert!(get_battles_won(&badge) == 0, 2);
        assert!(get_pets_owned(&badge) == 0, 3);
        assert!(get_join_date(&badge) >= 0, 4);
        
        transfer_test_badge(badge, @0x0);
    }

    #[test]
    #[expected_failure(abort_code = EUSERNAME_EMPTY)]
    fun test_create_profile_empty_username() {
        let mut ctx = tx_context::dummy();
        create_profile(b"", &mut ctx);
    }

    #[test]
    fun test_update_reputation() {
        let mut ctx = tx_context::dummy();
        
        let mut badge = create_test_profile(b"reputation_test", &mut ctx);
        
        update_reputation(&mut badge, 25);
        assert!(get_reputation(&badge) == 25, 1);
        
        update_reputation(&mut badge, 15);
        assert!(get_reputation(&badge) == 40, 2);
        
        update_reputation(&mut badge, 100);
        assert!(get_reputation(&badge) == 140, 3);
        
        transfer_test_badge(badge, @0x0);
    }

    #[test]
    fun test_record_battle_win() {
        let mut ctx = tx_context::dummy();
        
        let mut badge = create_test_profile(b"battle_test", &mut ctx);
        
        assert!(get_battles_won(&badge) == 0, 1);
        assert!(get_reputation(&badge) == 0, 2);
        
        record_battle_win(&mut badge);
        assert!(get_battles_won(&badge) == 1, 3);
        assert!(get_reputation(&badge) == 10, 4);
        
        record_battle_win(&mut badge);
        assert!(get_battles_won(&badge) == 2, 5);
        assert!(get_reputation(&badge) == 20, 6);
        
        record_battle_win(&mut badge);
        record_battle_win(&mut badge);
        record_battle_win(&mut badge);
        assert!(get_battles_won(&badge) == 5, 7);
        assert!(get_reputation(&badge) == 50, 8);
        
        transfer_test_badge(badge, @0x0);
    }

    #[test]
    fun test_record_pet_ownership() {
        let mut ctx = tx_context::dummy();
        
        let mut badge = create_test_profile(b"pet_owner", &mut ctx);
        
        assert!(get_pets_owned(&badge) == 0, 1);
        assert!(get_reputation(&badge) == 0, 2);
        
        record_pet_ownership(&mut badge);
        assert!(get_pets_owned(&badge) == 1, 3);
        assert!(get_reputation(&badge) == 5, 4);
        
        record_pet_ownership(&mut badge);
        assert!(get_pets_owned(&badge) == 2, 5);
        assert!(get_reputation(&badge) == 10, 6);
        
        record_pet_ownership(&mut badge);
        record_pet_ownership(&mut badge);
        record_pet_ownership(&mut badge);
        assert!(get_pets_owned(&badge) == 5, 7);
        assert!(get_reputation(&badge) == 25, 8);
        
        transfer_test_badge(badge, @0x0);
    }

    #[test]
    fun test_combined_operations() {
        let mut ctx = tx_context::dummy();
        
        let mut badge = create_test_profile(b"active_player", &mut ctx);
        
        record_battle_win(&mut badge);
        record_pet_ownership(&mut badge);
        record_battle_win(&mut badge);
        update_reputation(&mut badge, 30);
        record_pet_ownership(&mut badge);
        record_battle_win(&mut badge);
        
        assert!(get_battles_won(&badge) == 3, 1);
        assert!(get_pets_owned(&badge) == 2, 2);
        assert!(get_reputation(&badge) == 70, 3); //10+5+10+30+5+10=70
        
        transfer_test_badge(badge, @0x0);
    }

    #[test]
    fun test_entry_function() {
        let mut ctx = tx_context::dummy();
        
        create_profile(b"entry_test", &mut ctx);
        
        assert!(true, 1);
    }
}
