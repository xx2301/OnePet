#[allow(unused_const)]
module OnePet::pet_stats {
    use std::string;
    use std::vector;
    
    use one::object;
    use one::transfer;
    use one::tx_context;
    use one::coin;
    use one::oct;
    use one::clock::Clock;

    use OnePet::cooldown_system;
    use OnePet::stat_system;
    use OnePet::inventory;

    const DOG: u8 = 0;
    const CAT: u8 = 1;
    const RABBIT: u8 = 2;
    const HAMSTER: u8 = 3;

    const EInvalidPetType: u64 = 406;
    const ENameTooLong: u64 = 407;
    const EINSUFFICIENT_BALANCE: u64 = 408;
    const EALREADY_HAS_PET: u64 = 409;
    const ECOOLDOWN_NOT_READY: u64 = 410;
    const ENOUGH_DRINK: u64 = 411;
    const ENOUGH_FOOD: u64 = 412;

    const PET_PRICE: u64 = 50_000_000;

    public struct PetNFT has key, store {
        id: object::UID,
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
    
    public struct UserState has key {
        id: object::UID,
        has_created_first_pet: bool
    }
        
    #[allow(unused_field)]
    public struct PetCreated has copy, drop {
        pet_id: object::ID,
        owner: address,
        name: string::String,
        pet_type: u8
    }

    public entry fun init_user_state(ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);
        let user_state = UserState {
            id: object::new(ctx),
            has_created_first_pet: false
        };
        transfer::transfer(user_state, sender);
    }

    public entry fun create_pet(user_state: &mut UserState,name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);
        
        if (user_state.has_created_first_pet) {
            create_paid_pet(name, pet_type, payment, global_stats, ctx);
        } else {
            create_free_pet(user_state, name, pet_type, global_stats, ctx);
        }
    }

    fun create_free_pet(user_state: &mut UserState, name: vector<u8>, pet_type: u8, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);
        
        assert!(pet_type <= HAMSTER, EInvalidPetType);
        assert!(vector::length(&name) <= 20, ENameTooLong);

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

        user_state.has_created_first_pet = true;
        stat_system::record_pet_creation(global_stats);
        transfer::transfer(pet, sender);
    }

    fun create_paid_pet(name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);
        
        assert!(pet_type <= HAMSTER, EInvalidPetType);
        assert!(vector::length(&name) <= 20, ENameTooLong);
        assert!(coin::value(payment) >= PET_PRICE, EINSUFFICIENT_BALANCE);
        
        let payment_amount = coin::split(payment, PET_PRICE, ctx);
        transfer::public_freeze_object(payment_amount);
        
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

        stat_system::record_pet_creation(global_stats);
        transfer::transfer(pet, sender);
    }

    // for frontend
    public entry fun create_first_pet(user_state: &mut UserState, name: vector<u8>, pet_type: u8, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        assert!(!user_state.has_created_first_pet, EALREADY_HAS_PET); 
        create_free_pet(user_state, name, pet_type, global_stats, ctx);
    }

    // for frontend
    public entry fun create_additional_pet(name: vector<u8>, pet_type: u8, payment: &mut coin::Coin<oct::OCT>, global_stats: &mut stat_system::GlobalStats, ctx: &mut tx_context::TxContext) {
        create_paid_pet(name, pet_type, payment, global_stats, ctx);
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
        
        while (pet.experience >= pet.level * 100 && pet.level < 100) {
            pet.experience = pet.experience - (pet.level * 100);
            pet.level = pet.level + 1;
            pet.health = 100;
        };
    }

    public entry fun feed_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown, inventory: &mut inventory::PlayerInventory, global_stats: &mut stat_system::GlobalStats, clock: &Clock, ctx: &mut tx_context::TxContext) {
        let current_time = one::clock::timestamp_ms(clock);
        assert!(cooldown_system::can_feed(cooldown, current_time), ECOOLDOWN_NOT_READY);
        
        assert!(inventory::has_item(inventory, 1), ENOUGH_FOOD);
        inventory::remove_item(inventory, 1);

        cooldown_system::update_feed(cooldown, current_time);
        
        pet.hunger = pet.hunger + 30;
        pet.energy = pet.energy + 10;
        if (pet.hunger > 100) {
            pet.hunger = 100;
        };
        if (pet.energy > 100) {
            pet.energy = 100;
        };
        stat_system::record_feed_action(global_stats);
    }

    public entry fun play_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown, global_stats: &mut stat_system::GlobalStats, clock: &Clock, ctx: &mut tx_context::TxContext) {
        let current_time = one::clock::timestamp_ms(clock);
        assert!(cooldown_system::can_play(cooldown, current_time), 410);
        
        cooldown_system::update_play(cooldown, current_time);

        pet.happiness = pet.happiness + 25;
        pet.energy = pet.energy - 10;
        if (pet.happiness > 100) {
            pet.happiness = 100;
        };
        if (pet.energy < 0) {
            pet.energy = 0;
        };
        stat_system::record_play_action(global_stats);
    }

    public entry fun drink_pet(pet: &mut PetNFT, cooldown: &mut cooldown_system::ActionCooldown, inventory: &mut inventory::PlayerInventory, global_stats: &mut stat_system::GlobalStats, clock: &Clock, ctx: &mut tx_context::TxContext) {
        let current_time = one::clock::timestamp_ms(clock);
        assert!(cooldown_system::can_drink(cooldown, current_time), ECOOLDOWN_NOT_READY);
        
        assert!(inventory::has_item(inventory, 3), ENOUGH_DRINK);
        inventory::remove_item(inventory, 3);
        
        cooldown_system::update_drink(cooldown, current_time);
        
        pet.happiness = pet.happiness + 20;
        pet.energy = pet.energy + 15;
        pet.health = pet.health + 5;
        
        if (pet.happiness > 100) {
            pet.happiness = 100;
        };
        if (pet.energy > 100) {
            pet.energy = 100;
        };
        if (pet.health > 100) {
            pet.health = 100;
        };
        stat_system::record_drink_action(global_stats);
    }

    public entry fun sleep_pet(pet: &mut PetNFT, global_stats: &mut stat_system::GlobalStats,) {
        pet.happiness = pet.happiness - 10;
        pet.energy = 100;
        if (pet.happiness < 0) {
            pet.happiness = 0;
        };
        stat_system::record_sleep_action(global_stats);
    }

    #[test_only]
    public fun create_test_user_state(owner: address, ctx: &mut tx_context::TxContext): UserState {
        UserState {
            id: object::new(ctx),
            has_created_first_pet: false
        }
    }

    #[test_only]
    public fun create_test_pet(
        owner: address,
        level: u64,
        health: u64,
        _attack: u64,
        ctx: &mut tx_context::TxContext
    ): PetNFT {
        PetNFT {
            id: object::new(ctx),
            name: string::utf8(b"TestPet"),
            pet_type: CAT,
            level: level,
            experience: 0,
            health: health,
            hunger: 50,
            happiness: 50,
            energy: 100,
            owner: owner,
            created_at: 0
        }
    }

    #[test_only]
    public fun transfer_test_pet(pet: PetNFT, recipient: address) {
        transfer::transfer(pet, recipient);
    }

    #[test_only]
    public fun set_pet_level(pet: &mut PetNFT, level: u64) {
        pet.level = level;
    }

    #[test_only] 
    public fun set_pet_health(pet: &mut PetNFT, health: u64) {
        pet.health = health;
    }

    #[test]
    fun test_create_pet_free_first_then_paid() {
        let mut ctx = tx_context::dummy();
        let sender = tx_context::sender(&ctx);
        
        let mut user_state = create_test_user_state(sender, &mut ctx);
        let mut payment = coin::mint_for_testing<oct::OCT>(100_000_000, &mut ctx);
        let mut global_stats = stat_system::create_test_global_stats(sender, &mut ctx);
        
        create_pet(&mut user_state, b"FirstPet", CAT, &mut payment, &mut global_stats, &mut ctx);
        
        assert!(coin::value(&payment) == 100_000_000, 1);
        
        create_pet(&mut user_state, b"SecondPet", DOG, &mut payment, &mut global_stats, &mut ctx);
        
        assert!(coin::value(&payment) == 50_000_000, 2); //100m-50m=50m
        
        stat_system::transfer_test_global_stats(global_stats, sender);
        coin::burn_for_testing(payment);
        transfer::transfer(user_state, @0x0);
    }

    #[test]
    fun test_create_first_pet() {
        let mut ctx = tx_context::dummy();
        let sender = tx_context::sender(&ctx);
        
        let mut user_state = create_test_user_state(sender, &mut ctx);
        let mut global_stats = stat_system::create_test_global_stats(sender, &mut ctx);

        create_first_pet(&mut user_state, b"Fluffy", CAT, &mut global_stats, &mut ctx);

        assert!(user_state.has_created_first_pet, 1);
        stat_system::transfer_test_global_stats(global_stats, @0x0);
        transfer::transfer(user_state, @0x0);
    }

    #[test]
    #[expected_failure(abort_code = EALREADY_HAS_PET)]
    fun test_cannot_create_second_free_pet() {
        let mut ctx = tx_context::dummy();
        let sender = tx_context::sender(&ctx);
        
        let mut user_state = create_test_user_state(sender, &mut ctx);
        let mut global_stats = stat_system::create_test_global_stats(sender, &mut ctx);

        create_first_pet(&mut user_state, b"FirstPet", CAT, &mut global_stats, &mut ctx);
        {
            create_first_pet(&mut user_state, b"SecondPet", DOG, &mut global_stats, &mut ctx); //this will failed as i put in the {}
        };
        stat_system::transfer_test_global_stats(global_stats, @0x0);
        transfer::transfer(user_state, @0x0);
    }

    #[test]
    fun test_create_additional_pet() {
        let mut ctx = tx_context::dummy();
        let owner = @0x0;

        let mut payment = coin::mint_for_testing<oct::OCT>(100_000_000, &mut ctx);
        let mut global_stats = stat_system::create_test_global_stats(owner, &mut ctx);
        
        create_additional_pet(b"PaidPet", DOG, &mut payment, &mut global_stats, &mut ctx);
        
        assert!(coin::value(&payment) == 50_000_000, 1); //100m-50m=50m
        
        stat_system::transfer_test_global_stats(global_stats, @0x0);
        coin::burn_for_testing(payment);
    }
}