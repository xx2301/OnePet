import { Link, useNavigate } from "react-router";
import React, { useState, useEffect } from "react";
import Header from "./Header";
import styles from "./PetStats.module.css";
import { PACKAGE_ID, GLOBAL_STATS_ID, CLOCK_ID } from "./constants";
import { getUserObjects, feedPet, playPet, sleepPet } from "./services/onePetApi";

const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

// Pet type to emoji mapping
const PET_EMOJIS = {
  0: "🐶", // Dog
  1: "🐱", // Cat
  2: "🐰", // Rabbit
  3: "🐹"  // Hamster
};

const PET_NAMES = {
  0: "Dog",
  1: "Cat",
  2: "Rabbit",
  3: "Hamster"
};

// Fetch detailed pet object data
async function getPetDetails(petId) {
  try {
    const res = await fetch(SUI_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObject",
        params: [petId, { showContent: true, showType: true }]
      }),
    });
    const data = await res.json();
    return data?.result?.data || null;
  } catch (e) {
    console.warn("getPetDetails failed", e);
    return null;
  }
}

export default function PetStats({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [userResources, setUserResources] = useState({ pets: [], cooldowns: [], inventories: [] });

  // Check if wallet is still connected, redirect if not
  useEffect(() => {
    const checkWalletConnection = async () => {
      const addr = localStorage.getItem("suiAddress");
      if (!addr) {
        navigate('/');
        return;
      }

      // Check if wallet still has access
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
      if (wallet) {
        try {
          const accounts = await wallet.getAccounts();
          if (!accounts || accounts.length === 0) {
            console.log('Wallet disconnected, clearing and redirecting');
            localStorage.removeItem("suiAddress");
            navigate('/');
          }
        } catch {
          // If getAccounts fails, wallet is disconnected
          console.log('Wallet access lost, redirecting');
          localStorage.removeItem("suiAddress");
          navigate('/');
        }
      }
    };

    checkWalletConnection();
    const interval = setInterval(checkWalletConnection, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Fetch user's pet NFT on component mount
  const fetchPetData = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) {
      setLoading(false);
      return;
    }

    try {
      // Get all user objects
      const objs = await getUserObjects(addr);
      console.log('User objects:', objs);

      // Find pet NFT, cooldown, and inventory
      const resources = { pets: [], cooldowns: [], inventories: [] };
      
      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;
        
        if (type.includes('pet_stats::PetNFT')) {
          resources.pets.push(id);
        } else if (type.includes('cooldown_system::ActionCooldown')) {
          resources.cooldowns.push(id);
        } else if (type.includes('inventory::PlayerInventory')) {
          resources.inventories.push(id);
        }
      }

      setUserResources(resources);

      // Get detailed pet data if found
      if (resources.pets.length > 0) {
        const petDetails = await getPetDetails(resources.pets[0]);
        console.log('Pet details:', petDetails);
        
        if (petDetails?.content?.fields) {
          const fields = petDetails.content.fields;
          const parsedData = {
            id: petDetails.objectId,
            name: fields.name,
            pet_type: parseInt(fields.pet_type || '0', 10),
            level: parseInt(fields.level || '1', 10),
            experience: parseInt(fields.experience || '0', 10),
            health: parseInt(fields.health || '100', 10),
            hunger: parseInt(fields.hunger || '50', 10),
            happiness: parseInt(fields.happiness || '50', 10),
            energy: parseInt(fields.energy || '50', 10)
          };
          console.log('Parsed pet data:', parsedData);
          console.log(`Level ${parsedData.level}: ${parsedData.experience} / ${parsedData.level * 100} XP`);
          setPetData(parsedData);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetData();
  }, []);

  //demo logic only
  // On-chain aware actions: prepare CLI or attempt wallet call
  const runOnChainAction = async (action) => {
    const petId = userResources.pets[0];
    const cooldownId = userResources.cooldowns[0];
    const inventoryId = userResources.inventories[0];

    if (!petId) {
      alert('Unable to find your pet. Please refresh the page.');
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(`⏳ ${action === 'feed' ? 'Feeding' : action === 'play' ? 'Playing with' : 'Putting'} your pet${action === 'sleep' ? ' to sleep' : ''}...`);
      
      if (action === 'feed') {
        if (!cooldownId || !inventoryId) {
          setActionMessage('❌ Missing required resources (cooldown or inventory). Please refresh the page.');
          setActionLoading(false);
          return;
        }
        await feedPet(petId, cooldownId, inventoryId);
        setActionMessage('✅ Pet fed successfully! Stats updating...');
      } else if (action === 'play') {
        if (!cooldownId) {
          setActionMessage('❌ Missing cooldown resource. Please refresh the page.');
          setActionLoading(false);
          return;
        }
        await playPet(petId, cooldownId);
        setActionMessage('✅ Played with pet successfully! Stats updating...');
      } else if (action === 'sleep') {
        await sleepPet(petId);
        setActionMessage('✅ Pet is sleeping! Stats updating...');
      }

      // Refresh pet data after action
      setTimeout(() => {
        fetchPetData();
        setActionMessage('');
      }, 2000);
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      setActionMessage(`❌ Failed to ${action}: ${error.message || 'Unknown error'}`);
      
      // Parse error codes
      if (error.message?.includes('410')) {
        setActionMessage('⏰ Cooldown not ready! Please wait before performing this action again.');
      } else if (error.message?.includes('411')) {
        setActionMessage('😴 Your pet is not thirsty right now!');
      } else if (error.message?.includes('412')) {
        setActionMessage('🍖 Not enough food in inventory! Visit the shop to buy more.');
      } else {
        setActionMessage(`❌ Error: ${error.message || 'Unknown error occurred'}`);
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setActionMessage('');
      }, 5000);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className={styles.container}>
          <p>Loading your pet...</p>
        </div>
      </div>
    );
  }

  if (!petData) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className={styles.container}>
          <p>No pet found. Please adopt a pet first!</p>
          <Link to="/">Go to Home</Link>
        </div>
      </div>
    );
  }

  const petEmoji = PET_EMOJIS[petData.pet_type] || "🐾";
  const petTypeName = PET_NAMES[petData.pet_type] || "Pet";

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <div className={styles.petCard}>
          <div className={styles.petHeader}>
            <div>
              <button style={{ backgroundColor: "transparent", border: "none" }} onClick={() => setOpen(!open)}>
                <img src="/img/Hamburger_icon.png" width="30px"></img>
              </button>
              <div className={open ? styles.content : styles.hide}>
                <Link to="/Shop">Shop</Link>
                <Link to="/Spin">Daily Spin</Link>
                <Link to="/Battle">Battle</Link>
              </div>
            </div>

            <h2>{petData.name}</h2>
            <span className={styles.level}>Lv.{petData.level}</span>
          </div>

          <div style={{ fontSize: "100px", textAlign: "center", margin: "1rem 0" }}>
            {petEmoji}
          </div>
          <p className={styles.mood} style={{ margin: "0.5rem 0" }}>{petTypeName}</p>
          
          {/* XP Progress Bar */}
          <div style={{ 
            padding: '1.2rem', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px', 
            margin: '1rem 0.5rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'baseline',
              marginBottom: '0.8rem', 
              color: 'white',
              gap: '0.5rem'
            }}>
              <span style={{ fontWeight: '600', fontSize: '1rem', whiteSpace: 'nowrap' }}>✨ Experience</span>
              <span style={{ fontSize: '0.95rem', opacity: 0.9, textAlign: 'right' }}>
                {petData.experience} / {petData.level * 100} XP
              </span>
            </div>
            <div style={{ 
              position: 'relative',
              width: '100%', 
              height: '20px', 
              backgroundColor: 'rgba(255, 255, 255, 0.25)', 
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: `${Math.min((petData.experience / (petData.level * 100)) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)',
                borderRadius: '10px',
                transition: 'width 0.5s ease',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
              }}></div>
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.85)', 
              marginTop: '0.7rem', 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              🎯 {(petData.level * 100) - petData.experience} XP needed for Level {petData.level + 1}
            </div>
          </div>
          
          <div className={styles.tokenBox}>
            <span>NFT Token ID</span>
            <p style={{ fontSize: "10px", wordBreak: "break-all" }}>
              {typeof petData.id === 'object' ? petData.id.id : petData.id}
            </p>
          </div>
        </div>

        <div className={styles.statsPanel}>
          <div className={styles.section}>
            <h3>Pet Stats</h3>
            <div className={styles.barGroup}>
              <span>Health</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${petData.health}%` }}
                ></div>
              </div>
              <span className={styles.percent}>{petData.health}%</span>
            </div>
            <div className={styles.barGroup}>
              <span>Hunger</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${petData.hunger}%` }}
                ></div>
              </div>
              <span className={styles.percent}>{petData.hunger}%</span>
            </div>
            <div className={styles.barGroup}>
              <span>Happiness</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${petData.happiness}%` }}
                ></div>
              </div>
              <span className={styles.percent}>{petData.happiness}%</span>
            </div>
            <div className={styles.barGroup}>
              <span>Energy</span>
              <div className={styles.bar}>
                <div
                  className={styles.fill}
                  style={{ width: `${petData.energy}%` }}
                ></div>
              </div>
              <span className={styles.percent}>{petData.energy}%</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Care for Your Pet</h3>
            
            {actionMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                backgroundColor: actionMessage.includes('✅') ? '#d4edda' : actionMessage.includes('❌') ? '#f8d7da' : '#fff3cd',
                color: actionMessage.includes('✅') ? '#155724' : actionMessage.includes('❌') ? '#721c24' : '#856404',
                textAlign: 'center',
                fontWeight: 'bold',
                border: `1px solid ${actionMessage.includes('✅') ? '#c3e6cb' : actionMessage.includes('❌') ? '#f5c6cb' : '#ffeeba'}`
              }}>
                {actionMessage}
              </div>
            )}
            
            <div className={styles.actions}>
              <button className={styles.feed} onClick={() => runOnChainAction("feed")} disabled={actionLoading}>
                🍖 Feed <br /> {actionLoading ? '⏳' : '(on-chain)'}
              </button>
              <button className={styles.play} onClick={() => runOnChainAction("play")} disabled={actionLoading}>
                🎮 Play <br /> {actionLoading ? '⏳' : '(on-chain)'}
              </button>
              <button className={styles.sleep} onClick={() => runOnChainAction("sleep")} disabled={actionLoading}>
                🌙 Sleep <br /> {actionLoading ? '⏳' : '(on-chain)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
