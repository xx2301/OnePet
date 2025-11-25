# Battle System Issues & Fixes

## ✅ Fixed Issues

### 1. Monster Level Display
**Problem**: Monster level was hardcoded to pet level instead of using actual randomized level (pet level ±2)
**Fix**: Now fetches the actual monster object after creation to get the real level
**Code**: Updated `handleFindOpponent()` in Battle.jsx to parse monster.level from blockchain data

### 2. Battle Result Parsing  
**Problem**: Looking for events that don't exist (contract doesn't emit BattleResult events)
**Fix**: Calculate rewards based on contract logic (monster.level * 10 for XP, monster.level * 5 for tokens)
**Code**: Updated `handleStartBattle()` to calculate rewards instead of parsing events

## ❌ Critical Contract Issues (Require Smart Contract Update)

### 1. **No Token Minting in Battles**
**Problem**: The `start_pve_battle` function calculates token rewards but NEVER actually mints/transfers them
**Current Contract Code**:
```move
public entry fun start_pve_battle(...) {
    if (is_victory) {
        let tokens = monster.level * 5;
        pet_stats::level_up(pet, exp_gain);
        stat_system::record_battle(stats, tokens);  // Only records stats, doesn't mint!
        BattleResult { tokens_earned: tokens }      // Returns value but it's ignored
    }
}
```

**What Actually Happens**:
- ✅ XP is awarded to pet via `pet_stats::level_up()`
- ✅ Battle stats are recorded via `stat_system::record_battle()`
- ❌ Tokens are NEVER minted or transferred to the player

**Required Fix** (Need to update smart contract):
```move
use OnePet::pet_token;

public entry fun start_pve_battle(...) {
    if (is_victory) {
        let tokens = monster.level * 5;
        pet_stats::level_up(pet, exp_gain);
        stat_system::record_battle(stats, tokens);
        
        // ADD THIS LINE to actually mint tokens:
        pet_token::mint_test_tokens(player, tokens, ctx);
    }
}
```

### 2. **No Events Emitted**
**Problem**: Contract returns BattleResult but doesn't emit any events
**Impact**: Frontend can't get battle results from transaction (had to calculate manually)

**Required Fix** (Need to update smart contract):
```move
use one::event;

public struct BattleResultEvent has copy, drop {
    winner: address,
    exp_gained: u64,
    tokens_earned: u64,
    pet_level: u64,
    monster_level: u64
}

public entry fun start_pve_battle(...) {
    let result = if (is_victory) { ... };
    
    // ADD THIS to emit event:
    event::emit(BattleResultEvent {
        winner: result.winner,
        exp_gained: result.exp_gained,
        tokens_earned: result.tokens_earned,
        pet_level: pet_level,
        monster_level: monster.level
    });
    
    result
}
```

### 3. **No Getter Functions for Monster**
**Problem**: No public functions to read Monster fields (level, health, attack, name)
**Impact**: Frontend has to parse raw blockchain data instead of using clean API

**Required Fix** (Need to add to smart contract):
```move
public fun get_monster_level(monster: &Monster): u64 {
    monster.level
}

public fun get_monster_health(monster: &Monster): u64 {
    monster.health
}

public fun get_monster_attack(monster: &Monster): u64 {
    monster.attack
}

public fun get_monster_name(monster: &Monster): string::String {
    monster.name
}
```

## 📝 Documentation Issues

### API_Reference.md - Incorrect Function Signatures
**Line 56-57**: Wrong signature for `create_monster_based_on_pet_level`

**Current (Wrong)**:
```markdown
### create_monster_based_on_pet_level(pet_level: u64, name: vector<u8>, ctx: &mut TxContext)
```

**Should Be**:
```markdown
### create_monster_based_on_pet_level(pet: &pet_stats::PetNFT, name: vector<u8>, ctx: &mut TxContext)
```

**Actual Contract**:
```move
public entry fun create_monster_based_on_pet_level(
    pet: &pet_stats::PetNFT,  // Takes pet reference, NOT u64!
    name: vector<u8>, 
    ctx: &mut tx_context::TxContext
)
```

## 🎯 Current Workarounds in Frontend

1. **Token Rewards**: UI shows "Token rewards require contract update" message
2. **Battle Results**: Calculate rewards manually based on contract formula instead of parsing events
3. **Monster Level**: Fetch full object after creation to get actual level
4. **XP Rewards**: Working correctly (contract updates pet XP properly)

## 🚀 Recommendations

### Immediate (Frontend):
- ✅ Display actual monster level after creation
- ✅ Show honest message about token rewards
- ✅ Calculate battle results client-side

### Future (Smart Contract Update Required):
1. Add `pet_token::mint_test_tokens()` call in `start_pve_battle()`
2. Emit `BattleResultEvent` with complete battle details
3. Add getter functions for Monster struct
4. Update API_Reference.md with correct signatures

### Testing Priority:
1. Test XP gain after battle (should work ✅)
2. Verify monster level randomization (now displays correctly ✅)
3. Confirm token balance doesn't increase (expected ❌ - contract issue)
4. Check battle statistics recording (should work ✅)
