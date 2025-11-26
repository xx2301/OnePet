import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import Header from "./Header";
import styles from "./Battle.module.css";
import { getUserObjects, createMonsterBasedOnPetLevel, startPvEBattle } from "./services/onePetApi";

export default function Battle({darkMode, setDarkMode}) {
  const navigate = useNavigate();
  const [userPet, setUserPet] = useState(null);
  const [monster, setMonster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [battleResult, setBattleResult] = useState(null);
  const [inBattle, setInBattle] = useState(false);

  // Redirect if wallet is disconnected
  useEffect(() => {
    const checkWallet = async () => {
      const addr = localStorage.getItem("suiAddress");
      if (!addr) {
        navigate('/');
        return;
      }
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
      if (wallet) {
        try {
          const accounts = await wallet.getAccounts();
          if (!accounts || accounts.length === 0) {
            localStorage.removeItem("suiAddress");
            navigate('/');
          }
        } catch {
          localStorage.removeItem("suiAddress");
          navigate('/');
        }
      }
    };
    checkWallet();
    const interval = setInterval(checkWallet, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Load user's pet on mount
  useEffect(() => {
    loadUserPet();
  }, []);

  const loadUserPet = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) return;

    try {
      const objs = await getUserObjects(addr);
      const petObj = objs.find(obj => obj?.data?.type?.includes('pet_stats::PetNFT'));
      
      if (petObj) {
        const fields = petObj?.data?.content?.fields;
        const pet = {
          id: petObj.data.objectId,
          name: fields?.name,
          petType: parseInt(fields?.pet_type || '0', 10),
          level: parseInt(fields?.level || '1', 10),
          experience: parseInt(fields?.experience || '0', 10),
          health: parseInt(fields?.health || '100', 10),
          happiness: parseInt(fields?.happiness || '100', 10),
          energy: parseInt(fields?.energy || '100', 10),
          hunger: parseInt(fields?.hunger || '0', 10)
        };
        setUserPet(pet);
      }
    } catch (err) {
      console.error('Failed to load pet:', err);
      setMessage("❌ Failed to load your pet");
    }
  };

  const handleFindOpponent = async () => {
    if (!userPet) {
      setMessage("❌ No pet found. Please adopt a pet first.");
      return;
    }

    setLoading(true);
    setMessage("🔍 Creating monster...");

    try {
      const monsterNames = ["Wild Wolf", "Forest Dragon", "Cave Troll", "Dark Knight"];
      const randomName = monsterNames[Math.floor(Math.random() * monsterNames.length)];
      
      const result = await createMonsterBasedOnPetLevel(userPet.id, randomName);
      
      console.log('Monster creation result:', result);
      
      // The wallet returns base64 encoded effects, we need to fetch the actual transaction
      if (result?.digest) {
        // Wait a bit for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const SUI_RPC = 'https://rpc-testnet.onelabs.cc:443';
        const txResponse = await fetch(SUI_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getTransactionBlock',
            params: [
              result.digest,
              {
                showInput: false,
                showRawInput: false,
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
                showBalanceChanges: false
              }
            ]
          })
        });
        
        const txData = await txResponse.json();
        console.log('Transaction details:', txData);
        
        if (txData.error) {
          console.error('RPC error:', txData.error);
          // Fallback: use getUserObjects to find the newly created monster
          const addr = localStorage.getItem("suiAddress");
          const objs = await getUserObjects(addr);
          const monsterObj = objs.find(obj => obj?.data?.type?.includes('Monster'));
          
          if (monsterObj) {
            console.log('Found monster via getUserObjects:', monsterObj.data.objectId);
            setMonster({
              id: monsterObj.data.objectId,
              name: randomName,
              level: userPet.level
            });
            setMessage(`✅ Found opponent: ${randomName}!`);
          } else {
            setMessage("❌ Failed to find monster - please try again");
          }
          return;
        }
        
        const objectChanges = txData?.result?.objectChanges || [];
        console.log('Object changes:', objectChanges);
        
        // Find the created Monster object
        const monsterChange = objectChanges.find(change => 
          change.type === 'created' && 
          change.objectType?.includes('Monster')
        );
        
        if (monsterChange?.objectId) {
          console.log('Found monster ID:', monsterChange.objectId);
          
          // Fetch the actual monster object to get its real level
          const addr = localStorage.getItem("suiAddress");
          const objs = await getUserObjects(addr);
          const monsterObj = objs.find(obj => obj.data.objectId === monsterChange.objectId);
          
          const monsterLevel = monsterObj?.data?.content?.fields?.level 
            ? parseInt(monsterObj.data.content.fields.level, 10) 
            : userPet.level;
          
          console.log('Monster actual level:', monsterLevel);
          
          setMonster({
            id: monsterChange.objectId,
            name: randomName,
            level: monsterLevel
          });
          setMessage(`✅ Found opponent: ${randomName} (Level ${monsterLevel})!`);
        } else {
          console.error('No Monster object found in objectChanges');
          setMessage("❌ Failed to create monster - no Monster object found");
        }
      } else {
        console.error('No transaction digest returned');
        setMessage("❌ Failed to create monster - no transaction digest");
      }
    } catch (err) {
      console.error('Failed to create monster:', err);
      setMessage(`❌ Failed to find opponent: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = async () => {
    if (!userPet || !monster) {
      setMessage("❌ Need both pet and opponent");
      return;
    }

    setLoading(true);
    setInBattle(true);
    setMessage("⚔️ Battle in progress...");
    setBattleResult(null);

    try {
      const addr = localStorage.getItem("suiAddress");
      const result = await startPvEBattle(addr, userPet.id, monster.id);
      
      console.log('Battle result:', result);
      
      // Fetch full transaction details to get events
      if (result?.digest) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const SUI_RPC = 'https://rpc-testnet.onelabs.cc:443';
        const txResponse = await fetch(SUI_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getTransactionBlock',
            params: [
              result.digest,
              {
                showInput: false,
                showRawInput: false,
                showEffects: true,
                showEvents: true,
                showObjectChanges: false,
                showBalanceChanges: false
              }
            ]
          })
        });
        
        const txData = await txResponse.json();
        console.log('Battle transaction details:', txData);
        
        if (txData.result) {
          // Since the contract doesn't emit events, calculate rewards based on monster level
          // Victory formula: exp = monster.level * 10, tokens = monster.level * 5
          // The battle succeeds if pet.level >= monster.level
          
          const monsterLevel = monster.level || userPet.level;
          const petWon = userPet.level >= monsterLevel && userPet.health > 0;
          
          const expGain = petWon ? monsterLevel * 10 : monsterLevel * 2;
          const tokensEarned = petWon ? monsterLevel * 5 : 0;
          
          console.log('Calculated battle result:', { 
            petLevel: userPet.level, 
            monsterLevel, 
            petWon, 
            expGain, 
            tokensEarned 
          });
          
          setBattleResult({
            winner: petWon ? addr : '0x0',
            expGain: expGain,
            tokensEarned: tokensEarned,
            victory: petWon
          });
          
          if (petWon) {
            setMessage(`🎉 Victory! Gained ${expGain} EXP! (Note: Token rewards require contract update)`);
          } else {
            setMessage("😔 Defeat. Train harder and try again!");
          }
          
          // Refresh pet data to show updated stats
          setTimeout(() => {
            loadUserPet();
            window.dispatchEvent(new Event('balanceUpdate'));
          }, 2000);
        } else {
          console.error('RPC error fetching battle transaction:', txData.error);
          setMessage("✅ Battle completed, but couldn't fetch details!");
        }
      } else {
        console.error('No transaction digest returned from battle');
        setMessage("✅ Battle completed!");
      }
    } catch (err) {
      console.error('Battle failed:', err);
      setMessage(`❌ Battle failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setInBattle(false);
    }
  };

  const handleReset = () => {
    setMonster(null);
    setBattleResult(null);
    setMessage("");
    setInBattle(false);
  };

  const getPetEmoji = (petType) => {
    const emojis = { 0: "🐶", 1: "🐱", 2: "🐰", 3: "🐹" };
    return emojis[petType] || "🐾";
  };

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1.5rem'
        }}>⚔️ Battle Arena</h2>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            backgroundColor: message.includes('❌') 
              ? (darkMode ? '#7f1d1d' : '#fee2e2')
              : message.includes('🎉') 
                ? (darkMode ? '#064e3b' : '#d1fae5')
                : (darkMode ? '#78350f' : '#fef3c7'),
            border: `2px solid ${message.includes('❌') ? '#ef4444' : message.includes('🎉') ? '#10b981' : '#f59e0b'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '1.05rem',
            color: darkMode ? '#fff' : '#000'
          }}>
            {message}
          </div>
        )}

        <div className={styles.topRow}>
          <div className={styles.card} style={{
            background: darkMode 
              ? 'linear-gradient(135deg, #667eea25 0%, #764ba225 100%)'
              : 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            border: '2px solid #667eea40',
            padding: '1.5rem',
            backgroundColor: darkMode ? '#1e1e30' : '#fff'
          }}>
            <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.3rem' }}>🛡️ Your Pet</h3>
            {userPet ? (
              <div className={styles.petRow}>
                <div className={styles.emoji} style={{ fontSize: '64px' }}>{getPetEmoji(userPet.petType)}</div>
                <div style={{ flex: 1 }}>
                  <div className={styles.name} style={{ 
                    fontSize: '1.4rem', 
                    marginBottom: '0.5rem',
                    color: darkMode ? '#fff' : '#000'
                  }}>{userPet.name}</div>
                  <div className={styles.stat} style={{ 
                    fontSize: '0.95rem', 
                    marginBottom: '0.3rem',
                    color: darkMode ? '#d1d5db' : '#444'
                  }}>⭐ Level: {userPet.level}</div>
                  <div className={styles.stat} style={{ 
                    fontSize: '0.95rem', 
                    marginBottom: '0.3rem',
                    color: darkMode ? '#d1d5db' : '#444'
                  }}>❤️ HP: {userPet.health}/100</div>
                  <div className={styles.stat} style={{ 
                    fontSize: '0.95rem', 
                    marginBottom: '0.5rem',
                    color: darkMode ? '#d1d5db' : '#444'
                  }}>✨ EXP: {userPet.experience}</div>
                  <div style={{
                    width: '100%',
                    height: '14px',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${userPet.health}%`,
                      height: '100%',
                      background: userPet.health > 50 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                    }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder} style={{ 
                color: darkMode ? '#9ca3af' : '#777' 
              }}>No pet found. Adopt one first!</div>
            )}
          </div>

          <div className={styles.card} style={{
            background: darkMode 
              ? 'linear-gradient(135deg, #ef444425 0%, #dc262625 100%)'
              : 'linear-gradient(135deg, #ef444415 0%, #dc262615 100%)',
            border: '2px solid #ef444440',
            padding: '1.5rem',
            backgroundColor: darkMode ? '#1e1e30' : '#fff'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.3rem' }}>👾 Opponent</h3>
            {monster ? (
              <div className={styles.petRow}>
                <div className={styles.emoji} style={{ fontSize: '64px' }}>👾</div>
                <div style={{ flex: 1 }}>
                  <div className={styles.name} style={{ 
                    fontSize: '1.4rem', 
                    marginBottom: '0.5rem',
                    color: darkMode ? '#fff' : '#000'
                  }}>{monster.name}</div>
                  <div className={styles.stat} style={{ 
                    fontSize: '0.95rem',
                    color: darkMode ? '#d1d5db' : '#444'
                  }}>⭐ Level: {monster.level}</div>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder} style={{ 
                padding: '2rem 0', 
                textAlign: 'center', 
                color: darkMode ? '#6b7280' : '#999' 
              }}>🔍 No opponent selected</div>
            )}
            <div className={styles.controls} style={{ marginTop: '1.5rem', gap: '0.8rem' }}>
              <button 
                onClick={handleFindOpponent} 
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  cursor: loading || !userPet || inBattle ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  opacity: loading || !userPet || inBattle ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                disabled={loading || !userPet || inBattle}
              >
                🔍 Find Opponent
              </button>
              <button 
                onClick={handleStartBattle} 
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  borderRadius: '10px',
                  background: loading || !monster || inBattle ? '#94a3b8' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  cursor: loading || !monster || inBattle ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                disabled={loading || !monster || inBattle}
              >
                {inBattle ? "⚔️ Battling..." : "⚔️ Start Battle"}
              </button>
            </div>
          </div>
        </div>

        {battleResult && (
          <div style={{
            padding: '2rem',
            marginTop: '2rem',
            borderRadius: '16px',
            background: battleResult.victory 
              ? (darkMode 
                  ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)')
              : (darkMode
                  ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
                  : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'),
            border: `3px solid ${battleResult.victory ? '#10b981' : '#ef4444'}`,
            boxShadow: battleResult.victory 
              ? '0 8px 24px rgba(16, 185, 129, 0.3)'
              : '0 8px 24px rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              color: battleResult.victory 
                ? (darkMode ? '#6ee7b7' : '#059669')
                : (darkMode ? '#fca5a5' : '#dc2626')
            }}>{battleResult.victory ? "🎉 Victory!" : "😔 Defeat"}</h3>
            {battleResult.victory && (
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: '500',
                color: darkMode ? '#e5e7eb' : '#000'
              }}>
                <p style={{ marginBottom: '0.5rem' }}>✨ Experience Gained: <strong>{battleResult.expGain}</strong></p>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: darkMode ? '#9ca3af' : '#666', 
                  fontStyle: 'italic' 
                }}>
                  (Token rewards: {battleResult.tokensEarned} - require contract update to claim)
                </p>
              </div>
            )}
          </div>
        )}

        <div className={styles.footerRow} style={{ marginTop: '2rem' }}>
          <Link to="/PetStats" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1rem',
            padding: '0.8rem 1.5rem',
            borderRadius: '10px',
            border: '2px solid #667eea',
            transition: 'all 0.3s ease',
            backgroundColor: darkMode ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
          }}>← Back to Pet</Link>
          <button 
            onClick={handleReset} 
            disabled={loading}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: darkMode ? '#374151' : '#64748b',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
}
