#[allow(unused_const)]
module OnePet::pet_stats {
    use std::string;
    
    #[allow(unused_const)]
    const DOG: u8 = 0;
    #[allow(unused_const)]
    const CAT: u8 = 1;
    const RABBIT: u8 = 2;
    const HAMSTER: u8 = 3;

    public struct PetNFT has key, store {
        id: UID,
        name: string::String,
        pet_type: u8,
        level: u64,
        experience: u64,
        health: u64,
        hunger: u64,
        happiness: u64,
        energy: u64,
        owner: address,
        created_at: u64
    }
    
    #[allow(unused_field)]
    public struct PetCreated has copy, drop {
        pet_id: ID,
        owner: address,
        name: string::String,
        pet_type: u8
    }

    const EInvalidPetType: u64 = 1;
    const ENameTooLong: u64 = 2;

    public entry fun create_pet(name: vector<u8>, pet_type: u8, ctx: &mut TxContext) {
        assert!(pet_type <= HAMSTER, EInvalidPetType);
        assert!(vector::length(&name) <= 20, ENameTooLong);

        let sender = tx_context::sender(ctx);
        let pet_name = string::utf8(name);
        
        let pet = PetNFT {
            id: object::new(ctx),
            name: pet_name,
            pet_type: pet_type,
            level: 1,
            experience: 0,
            health: 100,
            hunger: 50,
            happiness: 50,
            energy: 100,
            owner: sender,
            created_at: tx_context::epoch(ctx)
        };

        transfer::transfer(pet, sender);
    }

    public fun get_level(pet: &PetNFT): u64 {
        pet.level
    }
    
    public fun get_experience(pet: &PetNFT): u64 {
        pet.experience
    }
    
    public fun get_health(pet: &PetNFT): u64 {
        pet.health
    }

    public entry fun level_up(pet: &mut PetNFT, exp_gained: u64) {
        pet.experience = pet.experience + exp_gained;
        
        while (pet.experience >= pet.level * 100 && pet.level < 100) { //level 1 to level 2 need 100 exp
            pet.experience = pet.experience - (pet.level * 100);
            pet.level = pet.level + 1;
            pet.health = 100;
        };
    }

    public entry fun feed_pet(pet: &mut PetNFT){
        pet.hunger = pet.hunger + 30;
        pet.energy = pet.energy + 10;
        if (pet.hunger > 100){
            pet.hunger = 100;
        };
        if (pet.energy > 100){
            pet.energy = 100;
        };
    }

    public entry fun play_pet(pet: &mut PetNFT){
        pet.happiness = pet.happiness + 25;
        pet.energy = pet.energy - 10;
        if (pet.happiness > 100){
            pet.happiness = 100;
        };
        if (pet.energy < 0){
            pet.energy = 0;
        };
    }

    public entry fun sleep_pet(pet: &mut PetNFT){
        pet.happiness = pet.happiness - 10;
        pet.energy = 100;
        if (pet.happiness < 0){
            pet.happiness = 0;
        };
    }

    #[test]
    fun test_create_pet() {
        let mut ctx = tx_context::dummy();
        create_pet(b"Fluffy", CAT, &mut ctx);
        create_pet(b"Buddy", DOG, &mut ctx);
        create_pet(b"Sparky", RABBIT, &mut ctx);
        create_pet(b"Poppy", HAMSTER, &mut ctx);
    }
}