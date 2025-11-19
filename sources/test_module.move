module OnePet::test_module {
    public fun hello(): u64 {
        42
    }
    
    #[test]
    fun test_hello() {
        assert!(hello() == 42, 1);
    }
}
