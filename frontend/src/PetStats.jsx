import { Link, useNavigate } from "react-router";
import React, { useState, useEffect } from "react";
import Header from "./Header";
import styles from "./PetStats.module.css";
import { PACKAGE_ID, GLOBAL_STATS_ID, CLOCK_ID } from "./constants";
import { getUserObjects, feedPet, playPet, sleepPet, claimDailyReward } from "./services/onePetApi";

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
  const [dailyRewardMessage, setDailyRewardMessage] = useState('');
  const [dailyRewardLoading, setDailyRewardLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [userResources, setUserResources] = useState({ pets: [], cooldowns: [], inventories: [], dailyRewards: [], badges: [] });
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [allPetsData, setAllPetsData] = useState([]);
  const [cooldownData, setCooldownData] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [dailyRewardData, setDailyRewardData] = useState(null);
  const [canClaim, setCanClaim] = useState(false);

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
      const resources = { pets: [], cooldowns: [], inventories: [], dailyRewards: [], badges: [] };
      
      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;
        
        if (type.includes('pet_stats::PetNFT')) {
          resources.pets.push(id);
        } else if (type.includes('cooldown_system::ActionCooldown')) {
          resources.cooldowns.push(id);
        } else if (type.includes('inventory::PlayerInventory')) {
          resources.inventories.push(id);
        } else if (type.includes('reward_system::DailyReward')) {
          resources.dailyRewards.push(id);
        } else if (type.includes('profile_badge::ProfileBadge')) {
          resources.badges.push(id);
        }
      }

      setUserResources(resources);

      // Get detailed pet data for ALL pets
      if (resources.pets.length > 0) {
        const petsData = [];
        
        for (const petId of resources.pets) {
          const petDetails = await getPetDetails(petId);
          
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
            petsData.push(parsedData);
          }
        }
        
        setAllPetsData(petsData);
        
        // Set current pet to the one at currentPetIndex
        if (petsData.length > 0) {
          const indexToUse = Math.min(currentPetIndex, petsData.length - 1);
          setPetData(petsData[indexToUse]);
          setCurrentPetIndex(indexToUse);
          
          // Save selected pet ID to localStorage
          localStorage.setItem('selectedPetId', petsData[indexToUse].id);
        }
      }

      // Fetch cooldown data
      if (resources.cooldowns.length > 0) {
        const cooldownDetails = await getPetDetails(resources.cooldowns[0]);
        if (cooldownDetails?.content?.fields) {
          const fields = cooldownDetails.content.fields;
          setCooldownData({
            last_feed_time: parseInt(fields.last_feed_time || '0', 10),
            last_play_time: parseInt(fields.last_play_time || '0', 10),
            last_drink_time: parseInt(fields.last_drink_time || '0', 10)
          });
        }
      }

      // Fetch daily reward data
      if (resources.dailyRewards.length > 0) {
        const rewardDetails = await getPetDetails(resources.dailyRewards[0]);
        if (rewardDetails?.content?.fields) {
          const fields = rewardDetails.content.fields;
          const lastClaimEpoch = parseInt(fields.last_claim_time || '0', 10);
          const streakCount = parseInt(fields.streak_count || '0', 10);
          
          // Get current Sui epoch from RPC
          const epochRes = await fetch(SUI_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "suix_getLatestSuiSystemState",
              params: []
            }),
          });
          const epochData = await epochRes.json();
          const currentEpoch = parseInt(epochData?.result?.epoch || '0', 10);
          
          const epochsSinceLastClaim = currentEpoch - lastClaimEpoch;
          
          // Contract bug: uses epoch numbers but compares against 86400
          // After first claim, can only claim again after 86400 epochs (~237 years)
          // So practically: can only claim if never claimed before
          const canClaimNow = lastClaimEpoch === 0;
          
          setDailyRewardData({
            lastClaimEpoch,
            currentEpoch,
            streakCount,
            epochsSinceLastClaim
          });
          setCanClaim(canClaimNow);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current time every second for cooldown countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cooldown durations in milliseconds
  const COOLDOWN_TIMES = {
    feed: 3600000,  // 1 hour
    play: 1800000,  // 30 minutes
    drink: 1800000, // 30 minutes
    sleep: 0        // no cooldown
  };

  // Calculate remaining cooldown time
  const getCooldownRemaining = (action) => {
    if (!cooldownData) return 0;
    if (action === 'sleep') return 0; // No cooldown for sleep
    
    const lastActionTime = cooldownData[`last_${action}_time`] || 0;
    const cooldownDuration = COOLDOWN_TIMES[action] || 0;
    const nextAvailableTime = lastActionTime + cooldownDuration;
    const remaining = Math.max(0, nextAvailableTime - currentTime);
    
    return remaining;
  };

  // Format cooldown time as "1h 30m" or "45m 30s"
  const formatCooldown = (ms) => {
    if (ms <= 0) return '';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Switch to next or previous pet
  const switchPet = (direction) => {
    if (allPetsData.length <= 1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentPetIndex + 1) % allPetsData.length;
    } else {
      newIndex = (currentPetIndex - 1 + allPetsData.length) % allPetsData.length;
    }
    
    setCurrentPetIndex(newIndex);
    setPetData(allPetsData[newIndex]);
    
    // Save selected pet ID to localStorage for other pages to use
    localStorage.setItem('selectedPetId', allPetsData[newIndex].id);
    console.log('🎯 Selected pet:', allPetsData[newIndex].name, allPetsData[newIndex].id);
  };

  // Claim daily check-in reward
  const handleClaimDailyReward = async () => {
    const dailyRewardId = userResources.dailyRewards[0];
    const inventoryId = userResources.inventories[0];
    const badgeId = userResources.badges[0];

    if (!dailyRewardId || !inventoryId || !badgeId) {
      setDailyRewardMessage('❌ Missing required resources. Please refresh the page.');
      return;
    }

    try {
      setDailyRewardLoading(true);
      setDailyRewardMessage('⏳ Claiming daily reward...');
      
      await claimDailyReward(dailyRewardId, inventoryId, badgeId);
      
      setDailyRewardMessage('✅ Daily reward claimed! Check your inventory for items!');
      setCanClaim(false);
      
      // Refresh data after claim
      setTimeout(() => {
        fetchPetData();
        setDailyRewardMessage('');
      }, 3000);
    } catch (error) {
      console.error('Claim daily reward error:', error);
      setDailyRewardMessage(`❌ Failed to claim reward: ${error.message || 'Unknown error'}`);
    } finally {
      setDailyRewardLoading(false);
    }
  };

  //demo logic only
  // On-chain aware actions: prepare CLI or attempt wallet call
  const runOnChainAction = async (action) => {
    const petId = petData?.id; // Use current pet's ID
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
          {/* Hamburger Menu - Top Left Corner */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
            <button 
              style={{ 
                backgroundColor: "transparent", 
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                position: "relative"
              }} 
              onClick={() => setOpen(!open)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
              className={open ? styles.hamburgerOpen : ""}
            >
              <img 
                src="/img/Hamburger_icon.png" 
                width="24px" 
                height="24px"
                style={{ 
                  filter: darkMode ? "brightness(0) invert(1)" : "none",
                  transition: "transform 0.3s ease"
                }}
              />
            </button>
            <div className={`${styles.content} ${open ? styles.show : styles.hide}`}>
              <Link to="/Profile">👤 Profile</Link>
              <Link to="/Achievements">🏆 Achievements</Link>
              <Link to="/Shop">🛒 Shop</Link>
              <Link to="/Spin">🎰 Daily Spin</Link>
              <Link to="/Battle">⚔️ Battle</Link>
            </div>
          </div>

          <div className={styles.petHeader}>
            <div>
              {/* Hamburger menu moved to top left */}
            </div>

            <h2>{petData.name}</h2>
            <span className={styles.level}>Lv.{petData.level}</span>
          </div>

          {/* Pet Navigation - Show only if user has multiple pets */}
          {allPetsData.length > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1rem', 
              margin: '1rem 0',
              padding: '0.5rem',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: '8px'
            }}>
              <button 
                onClick={() => switchPet('prev')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: darkMode ? '#444' : '#ddd',
                  color: darkMode ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                Pet {currentPetIndex + 1} / {allPetsData.length}
              </span>
              <button 
                onClick={() => switchPet('next')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: darkMode ? '#444' : '#ddd',
                  color: darkMode ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                →
              </button>
            </div>
          )}

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

          {/* Daily Check-In Section */}
          {userResources.dailyRewards.length > 0 && (
            <div className={styles.section} style={{ marginTop: '1.5rem' }}>
              <h3>📅 Daily Check-In</h3>
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: canClaim ? '#d4edda' : '#f8d7da',
                border: `2px solid ${canClaim ? '#c3e6cb' : '#f5c6cb'}`,
                marginBottom: '1rem'
              }}>
                {dailyRewardData && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      🔥 Current Streak: {dailyRewardData.streakCount} {dailyRewardData.streakCount === 1 ? 'day' : 'days'}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      💎 Rewards: {Math.floor((50 + (dailyRewardData.streakCount * 10)) / 10)} items + 5 Reputation
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#856404' }}>
                      (Contract bug: Only {Math.floor((50 + (dailyRewardData.streakCount * 10)) / 10)} items awarded instead of {50 + (dailyRewardData.streakCount * 10)})
                    </div>
                    {!canClaim && dailyRewardData.lastClaimEpoch > 0 && (
                      <div style={{ fontSize: '0.9rem', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '6px', fontWeight: 'bold' }}>
                        ⚠️ Already claimed at epoch {dailyRewardData.lastClaimEpoch}
                        <br />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>
                          Contract bug: Rewards locked - requires 86400 epochs (~237 years) between claims
                        </span>
                      </div>
                    )}
                    {canClaim && (
                      <div style={{ fontSize: '0.9rem', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#d1ecf1', borderRadius: '6px', fontWeight: 'bold', color: '#0c5460' }}>
                        ✨ Ready to claim your daily reward!
                      </div>
                    )}
                  </div>
                )}
                
                {dailyRewardMessage && (
                  <div style={{
                    padding: '0.75rem',
                    marginTop: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: dailyRewardMessage.includes('✅') 
                      ? (darkMode ? '#064e3b' : '#d4edda') 
                      : dailyRewardMessage.includes('❌') 
                        ? (darkMode ? '#7f1d1d' : '#f8d7da') 
                        : (darkMode ? '#78350f' : '#fff3cd'),
                    color: darkMode ? '#fff' : (dailyRewardMessage.includes('✅') ? '#155724' : dailyRewardMessage.includes('❌') ? '#721c24' : '#856404'),
                    textAlign: 'center',
                    fontWeight: 'bold',
                    border: `1px solid ${dailyRewardMessage.includes('✅') 
                      ? (darkMode ? '#10b981' : '#c3e6cb') 
                      : dailyRewardMessage.includes('❌') 
                        ? (darkMode ? '#ef4444' : '#f5c6cb') 
                        : (darkMode ? '#f59e0b' : '#ffeeba')}`
                  }}>
                    {dailyRewardMessage}
                  </div>
                )}
                
                <button
                  onClick={handleClaimDailyReward}
                  disabled={!canClaim || dailyRewardLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: canClaim && !dailyRewardLoading ? '#28a745' : '#ccc',
                    color: 'white',
                    cursor: canClaim && !dailyRewardLoading ? 'pointer' : 'not-allowed',
                    marginTop: '0.5rem'
                  }}
                >
                  {dailyRewardLoading ? '⏳ Claiming...' : canClaim ? '🎁 Claim Daily Reward' : '✅ Already Claimed'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3>Care for Your Pet</h3>
            
            {actionMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                backgroundColor: actionMessage.includes('✅') 
                  ? (darkMode ? '#064e3b' : '#d4edda') 
                  : actionMessage.includes('❌') 
                    ? (darkMode ? '#7f1d1d' : '#f8d7da') 
                    : (darkMode ? '#78350f' : '#fff3cd'),
                color: darkMode ? '#fff' : (actionMessage.includes('✅') ? '#155724' : actionMessage.includes('❌') ? '#721c24' : '#856404'),
                textAlign: 'center',
                fontWeight: 'bold',
                border: `1px solid ${actionMessage.includes('✅') 
                  ? (darkMode ? '#10b981' : '#c3e6cb') 
                  : actionMessage.includes('❌') 
                    ? (darkMode ? '#ef4444' : '#f5c6cb') 
                    : (darkMode ? '#f59e0b' : '#ffeeba')}`
              }}>
                {actionMessage}
              </div>
            )}
            
            <div className={styles.actions}>
              <button 
                className={styles.feed} 
                onClick={() => runOnChainAction("feed")} 
                disabled={actionLoading || getCooldownRemaining('feed') > 0}
              >
                🍖 Feed
                {getCooldownRemaining('feed') > 0 ? (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    ⏰ {formatCooldown(getCooldownRemaining('feed'))}
                  </div>
                ) : (
                  <br />
                )}
                {actionLoading ? '⏳' : getCooldownRemaining('feed') > 0 ? '' : '(on-chain)'}
              </button>
              <button 
                className={styles.play} 
                onClick={() => runOnChainAction("play")} 
                disabled={actionLoading || getCooldownRemaining('play') > 0}
              >
                🎮 Play
                {getCooldownRemaining('play') > 0 ? (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    ⏰ {formatCooldown(getCooldownRemaining('play'))}
                  </div>
                ) : (
                  <br />
                )}
                {actionLoading ? '⏳' : getCooldownRemaining('play') > 0 ? '' : '(on-chain)'}
              </button>
              <button 
                className={styles.sleep} 
                onClick={() => runOnChainAction("sleep")} 
                disabled={actionLoading}
              >
                🌙 Sleep <br /> {actionLoading ? '⏳' : '(on-chain)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
