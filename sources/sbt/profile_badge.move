module OnePet::profile_badge {
    use std::string;

    public struct ProfileBadge has key {
        id: UID,
        username: string::String,
        join_date: u64,
        reputation: u64
    }
    
    public entry fun create_profile(
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let badge = ProfileBadge {
            id: object::new(ctx),
            username: string::utf8(username),
            join_date: tx_context::epoch(ctx),
            reputation: 0
        };
        
        transfer::transfer(badge, tx_context::sender(ctx));
    }
    
    #[test]
    fun test_create_profile() {
        let mut ctx = tx_context::dummy();
        create_profile(b"test_user", &mut ctx);
    }
}
