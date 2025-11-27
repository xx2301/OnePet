import { Link, useNavigate } from "react-router";
import React, { useState, useEffect } from "react";
import Header from "./Header";
import styles from "./Achievements.module.css";
import { getUserObjects, claimAchievement, createAchievement, markAchievementComplete } from "./services/onePetApi";

const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

// Fetch detailed object data
async function getObjectDetails(objectId) {
  try {
    const res = await fetch(SUI_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObject",
        params: [objectId, { showContent: true, showType: true }]
      }),
    });
    const data = await res.json();
    return data?.result?.data || null;
  } catch (e) {
    console.warn("getObjectDetails failed", e);
    return null;
  }
}

export default function Achievements({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [achievementsData, setAchievementsData] = useState([]);
  const [userResources, setUserResources] = useState({ inventories: [], badges: [], achievements: [] });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'inProgress'

  // Check if wallet is still connected
  useEffect(() => {
    const checkWalletConnection = async () => {
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

    checkWalletConnection();
    const interval = setInterval(checkWalletConnection, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Fetch achievements data
  const fetchAchievements = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) {
      setLoading(false);
      return;
    }

    try {
      const objs = await getUserObjects(addr);
      console.log('User objects:', objs);

      const resources = { inventories: [], badges: [], achievements: [] };

      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;

        if (type.includes('inventory::PlayerInventory')) {
          resources.inventories.push(id);
        } else if (type.includes('profile_badge::ProfileBadge')) {
          resources.badges.push(id);
        } else if (type.includes('reward_system::Achievement')) {
          resources.achievements.push(id);
        }
      }

      setUserResources(resources);

      // Count user progress for auto-detection
      let petCount = 0;
      let battleCount = 0;
      let maxPetLevel = 0;

      for (const obj of objs) {
        const type = obj?.data?.type || '';
        
        // Count pets
        if (type.includes('pet_token::PetNFT')) {
          petCount++;
          
          // Check pet level
          const petDetails = await getObjectDetails(obj.data.objectId);
          if (petDetails?.content?.fields) {
            const level = parseInt(petDetails.content.fields.level || '1', 10);
            if (level > maxPetLevel) {
              maxPetLevel = level;
            }
          }
        }
        
        // Count battles (if you have battle records)
        if (type.includes('battle_system::BattleRecord')) {
          battleCount++;
        }
      }

      console.log('🔍 Progress Detection:', { petCount, battleCount, maxPetLevel });

      // Fetch achievements data
      if (resources.achievements.length > 0) {
        const achievements = [];
        for (const achievementId of resources.achievements) {
          const achievementDetails = await getObjectDetails(achievementId);
          if (achievementDetails?.content?.fields) {
            const fields = achievementDetails.content.fields;
            const achievementType = parseInt(fields.achievement_type || '0', 10);
            const isCompleted = fields.completed === true;
            
            achievements.push({
              id: achievementDetails.objectId,
              type: achievementType,
              completed: isCompleted,
              claimed: fields.reward_claimed === true
            });

            // AUTO-DETECT: Mark as complete if requirements met but not yet completed
            if (!isCompleted) {
              let shouldComplete = false;
              
              if (achievementType === 0 && petCount >= 1) {
                // First Pet achievement
                shouldComplete = true;
                console.log('✅ Auto-detected: First Pet achievement complete!');
              } else if (achievementType === 1 && battleCount >= 1) {
                // First Battle achievement
                shouldComplete = true;
                console.log('✅ Auto-detected: First Battle achievement complete!');
              } else if (achievementType === 2 && maxPetLevel >= 10) {
                // Pet Level 10 achievement
                shouldComplete = true;
                console.log('✅ Auto-detected: Pet Level 10 achievement complete!');
              }

              // Automatically mark as complete
              if (shouldComplete) {
                try {
                  console.log(`🔄 Auto-marking achievement ${achievementType} as complete...`);
                  await markAchievementComplete(achievementId);
                  // Update local state
                  achievements[achievements.length - 1].completed = true;
                } catch (err) {
                  console.error('Failed to auto-complete achievement:', err);
                }
              }
            }
          }
        }
        setAchievementsData(achievements);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Claim achievement reward
  const handleClaimAchievement = async (achievementId) => {
    const inventoryId = userResources.inventories[0];
    const badgeId = userResources.badges[0];

    if (!achievementId || !inventoryId || !badgeId) {
      setActionMessage('❌ Missing required resources. Please refresh the page.');
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage('⏳ Claiming achievement reward...');

      await claimAchievement(achievementId, inventoryId, badgeId);

      setActionMessage('✅ Achievement reward claimed! Check your inventory!');

      setTimeout(() => {
        fetchAchievements();
        setActionMessage('');
      }, 3000);
    } catch (error) {
      console.error('Claim achievement error:', error);
      setActionMessage(`❌ Failed to claim achievement: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Create new achievement tracker
  const handleCreateAchievement = async (achievementType) => {
    try {
      setActionLoading(true);
      setActionMessage(`⏳ Creating achievement tracker...`);

      await createAchievement(achievementType);

      setActionMessage('✅ Achievement tracker created!');

      setTimeout(() => {
        fetchAchievements();
        setActionMessage('');
      }, 2000);
    } catch (error) {
      console.error('Create achievement error:', error);
      setActionMessage(`❌ Failed to create achievement: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark achievement as complete
  const handleMarkAchievementComplete = async (achievementId) => {
    try {
      setActionLoading(true);
      setActionMessage('⏳ Marking achievement as complete...');

      await markAchievementComplete(achievementId);

      setActionMessage('✅ Achievement marked as complete! You can now claim rewards.');

      setTimeout(() => {
        fetchAchievements();
        setActionMessage('');
      }, 2000);
    } catch (error) {
      console.error('Mark achievement error:', error);
      setActionMessage(`❌ Failed to mark achievement: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className={styles.container}>
          <div className={styles.loading}>Loading achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <div className={styles.achievementsCard}>
          <div className={styles.header}>
            <h1>🏆 Achievement Board</h1>
            <Link to="/PetStats" className={styles.backLink}>← Back to Pet Stats</Link>
          </div>

          {actionMessage && (
            <div className={styles.message}>
              {actionMessage}
            </div>
          )}

          {/* Achievement Stats */}
          {achievementsData.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: darkMode ? '#2c3e50' : '#f0f0f0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  flex: '1',
                  minWidth: '150px',
                  border: darkMode ? '2px solid #34495e' : '2px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#ecf0f1' : '#000' }}>
                    {achievementsData.length}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: darkMode ? '#bdc3c7' : '#666' }}>Total</div>
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: darkMode ? '#1e4620' : '#d4edda',
                  borderRadius: '8px',
                  textAlign: 'center',
                  flex: '1',
                  minWidth: '150px',
                  border: darkMode ? '2px solid #27ae60' : '2px solid #c3e6cb'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#2ecc71' : '#155724' }}>
                    {achievementsData.filter(a => a.completed).length}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: darkMode ? '#a9dfbf' : '#155724' }}>Completed</div>
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: darkMode ? '#5d4e37' : '#fff3cd',
                  borderRadius: '8px',
                  textAlign: 'center',
                  flex: '1',
                  minWidth: '150px',
                  border: darkMode ? '2px solid #f39c12' : '2px solid #ffc107'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#f1c40f' : '#856404' }}>
                    {achievementsData.filter(a => !a.completed).length}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: darkMode ? '#f9e79f' : '#856404' }}>In Progress</div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: filter === 'all' ? '2px solid #007bff' : `2px solid ${darkMode ? '#555' : '#ccc'}`,
                    backgroundColor: filter === 'all' ? '#007bff' : (darkMode ? '#2c3e50' : '#fff'),
                    color: filter === 'all' ? '#fff' : (darkMode ? '#ecf0f1' : '#000'),
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  All ({achievementsData.length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: filter === 'completed' ? '2px solid #28a745' : `2px solid ${darkMode ? '#555' : '#ccc'}`,
                    backgroundColor: filter === 'completed' ? '#28a745' : (darkMode ? '#2c3e50' : '#fff'),
                    color: filter === 'completed' ? '#fff' : (darkMode ? '#ecf0f1' : '#000'),
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Completed ({achievementsData.filter(a => a.completed).length})
                </button>
                <button
                  onClick={() => setFilter('inProgress')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: filter === 'inProgress' ? '2px solid #ffc107' : `2px solid ${darkMode ? '#555' : '#ccc'}`,
                    backgroundColor: filter === 'inProgress' ? '#ffc107' : (darkMode ? '#2c3e50' : '#fff'),
                    color: filter === 'inProgress' ? '#000' : (darkMode ? '#ecf0f1' : '#000'),
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  In Progress ({achievementsData.filter(a => !a.completed).length})
                </button>
              </div>
            </div>
          )}

          {/* Achievement Board Section */}
          {achievementsData.length > 0 && (
            <div className={styles.achievementsList}>
              {achievementsData
                .filter(achievement => {
                  if (filter === 'completed') return achievement.completed;
                  if (filter === 'inProgress') return !achievement.completed;
                  return true; // 'all'
                })
                .length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                    borderRadius: '12px',
                    border: `2px dashed ${darkMode ? '#555' : '#dee2e6'}`
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                      {filter === 'completed' ? '🎯' : '⏳'}
                    </div>
                    <h3 style={{ marginBottom: '0.5rem', color: darkMode ? '#ecf0f1' : '#000' }}>
                      {filter === 'completed' 
                        ? 'No Completed Achievements' 
                        : 'No Achievements In Progress'}
                    </h3>
                    <p style={{ color: darkMode ? '#bdc3c7' : '#6c757d' }}>
                      {filter === 'completed'
                        ? 'Complete some achievements to see them here!'
                        : 'All achievements are already completed!'}
                    </p>
                  </div>
                ) : (
                  achievementsData
                    .filter(achievement => {
                      if (filter === 'completed') return achievement.completed;
                      if (filter === 'inProgress') return !achievement.completed;
                      return true;
                    })
                    .map((achievement) => {
                const achievementInfo = {
                  0: {
                    icon: '🐾',
                    title: 'First Pet',
                    description: 'Create your first pet companion',
                    rewards: '2 Items (Toy + Drink) + 20 Reputation'
                  },
                  1: {
                    icon: '⚔️',
                    title: 'First Battle',
                    description: 'Complete your first battle',
                    rewards: '1 Item (Medicine) + 15 Reputation'
                  },
                  2: {
                    icon: '⭐',
                    title: 'Pet Level 5+',
                    description: 'Reach level 5 or higher with your pet',
                    rewards: '5 Items (Food x5) + 30 Reputation'
                  }
                };

                const info = achievementInfo[achievement.type] || {
                  icon: '🎯',
                  title: 'Unknown Achievement',
                  description: 'Unknown achievement',
                  rewards: 'Unknown'
                };

                const canClaimAchievement = achievement.completed && !achievement.claimed;

                return (
                  <div 
                    key={achievement.id}
                    className={`${styles.achievementCard} ${
                      achievement.claimed 
                        ? styles.claimed 
                        : achievement.completed 
                          ? styles.completed 
                          : styles.inProgress
                    }`}
                  >
                    <div className={styles.achievementContent}>
                      <div className={styles.achievementHeader}>
                        <span className={styles.icon}>{info.icon}</span>
                        <span className={styles.title}>{info.title}</span>
                        {achievement.completed && (
                          <span className={styles.status}>
                            {achievement.claimed ? '✅ Claimed' : '🎁 Ready!'}
                          </span>
                        )}
                        {!achievement.completed && (
                          <span className={styles.statusProgress}>⏳ In Progress</span>
                        )}
                      </div>
                      <div className={styles.description}>{info.description}</div>
                      <div className={styles.rewards}>🎁 {info.rewards}</div>
                    </div>
                    <div className={styles.actions}>
                      {!achievement.completed && (
                        <button
                          onClick={() => handleMarkAchievementComplete(achievement.id)}
                          disabled={actionLoading}
                          className={styles.markButton}
                        >
                          {actionLoading ? '⏳' : '✓ Mark Complete'}
                        </button>
                      )}
                      {canClaimAchievement && (
                        <button
                          onClick={() => handleClaimAchievement(achievement.id)}
                          disabled={actionLoading}
                          className={styles.claimButton}
                        >
                          {actionLoading ? '⏳' : '🎁 Claim'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          )}

          {/* Available Achievements Section */}
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: darkMode ? '#ecf0f1' : '#000' }}>
              🎯 Available Achievements
            </h2>
            <p style={{ textAlign: 'center', color: darkMode ? '#bdc3c7' : '#6c757d', marginBottom: '2rem' }}>
              Currently 3 achievements available - More coming soon!
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Achievement 0: First Pet */}
              {!achievementsData.some(a => a.type === 0) && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                  borderRadius: '12px',
                  border: `2px dashed ${darkMode ? '#555' : '#dee2e6'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐾</div>
                  <h3 style={{ marginBottom: '0.5rem', color: darkMode ? '#ecf0f1' : '#000' }}>First Pet</h3>
                  <p style={{ fontSize: '0.9rem', color: darkMode ? '#bdc3c7' : '#6c757d', marginBottom: '0.75rem' }}>
                    Create your first pet companion
                  </p>
                  <div style={{ 
                    backgroundColor: darkMode ? '#5d4e37' : '#fff3cd',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: darkMode ? '#f9e79f' : '#856404'
                  }}>
                    🎁 Rewards: 2 Items (Toy + Drink) + 20 Reputation
                  </div>
                  <button
                    onClick={() => handleCreateAchievement(0)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    📌 Start Tracking
                  </button>
                </div>
              )}

              {/* Achievement 1: First Battle */}
              {!achievementsData.some(a => a.type === 1) && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                  borderRadius: '12px',
                  border: `2px dashed ${darkMode ? '#555' : '#dee2e6'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
                  <h3 style={{ marginBottom: '0.5rem', color: darkMode ? '#ecf0f1' : '#000' }}>First Battle</h3>
                  <p style={{ fontSize: '0.9rem', color: darkMode ? '#bdc3c7' : '#6c757d', marginBottom: '0.75rem' }}>
                    Complete your first battle
                  </p>
                  <div style={{ 
                    backgroundColor: darkMode ? '#5d4e37' : '#fff3cd',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: darkMode ? '#f9e79f' : '#856404'
                  }}>
                    🎁 Rewards: 1 Item (Medicine) + 15 Reputation
                  </div>
                  <button
                    onClick={() => handleCreateAchievement(1)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    📌 Start Tracking
                  </button>
                </div>
              )}

              {/* Achievement 2: Pet Level 5+ */}
              {!achievementsData.some(a => a.type === 2) && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                  borderRadius: '12px',
                  border: `2px dashed ${darkMode ? '#555' : '#dee2e6'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⭐</div>
                  <h3 style={{ marginBottom: '0.5rem', color: darkMode ? '#ecf0f1' : '#000' }}>Pet Level 5+</h3>
                  <p style={{ fontSize: '0.9rem', color: darkMode ? '#bdc3c7' : '#6c757d', marginBottom: '0.75rem' }}>
                    Reach level 5 or higher with your pet
                  </p>
                  <div style={{ 
                    backgroundColor: darkMode ? '#5d4e37' : '#fff3cd',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: darkMode ? '#f9e79f' : '#856404'
                  }}>
                    🎁 Rewards: 5 Items (Food x5) + 30 Reputation
                  </div>
                  <button
                    onClick={() => handleCreateAchievement(2)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    📌 Start Tracking
                  </button>
                </div>
              )}
            </div>

            {achievementsData.length === 3 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: darkMode ? '#1e4620' : '#d4edda',
                borderRadius: '12px',
                border: darkMode ? '2px solid #27ae60' : '2px solid #c3e6cb'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                <h3 style={{ color: darkMode ? '#2ecc71' : '#155724', marginBottom: '0.5rem' }}>
                  All Achievements Tracked!
                </h3>
                <p style={{ color: darkMode ? '#a9dfbf' : '#155724' }}>
                  You're tracking all available achievements. Keep playing to complete them!
                </p>
              </div>
            )}
          </div>

          {/* Create Achievement Helper Section - Only show if NO achievements */}
          {achievementsData.length === 0 && (
            <div className={styles.emptyState} style={{ marginTop: '2rem' }}>
              <div className={styles.emptyIcon}>🏆</div>
              <h2 style={{ color: darkMode ? '#ecf0f1' : '#000' }}>No Achievement Trackers Yet</h2>
              <p style={{ color: darkMode ? '#bdc3c7' : '#666' }}>Start tracking your progress by creating achievement trackers above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
