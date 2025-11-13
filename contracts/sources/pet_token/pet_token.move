module OnePet::pet_token {
    
    public struct PET has drop {}  
    
    fun init(_ctx: &mut TxContext) {
        
    }
    
    
    public entry fun mint_test_tokens(
        _recipient: address,
        _amount: u64,
        _ctx: &mut TxContext
    ) {
        
    }
    
    #[test]
    fun test_token_functions() {
        
    }
}