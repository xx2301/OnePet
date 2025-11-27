import { useNavigate } from "react-router";
import React, { useState, useEffect } from "react";
import Header from "./Header";
import styles from "./Profile.module.css";
import { getUserObjects, createProfile } from "./services/onePetApi";

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

export default function Profile({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [address, setAddress] = useState(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  // Check if wallet is still connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      const addr = localStorage.getItem("suiAddress");
      if (!addr) {
        navigate('/');
        return;
      }
      setAddress(addr);

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

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      const addr = localStorage.getItem("suiAddress");
      if (!addr) {
        setLoading(false);
        return;
      }

      try {
        const objs = await getUserObjects(addr);
        console.log('User objects:', objs);

        // Find ProfileBadge
        let badgeId = null;
        let petCount = 0;
        
        for (const obj of objs) {
          const type = obj?.data?.type || '';
          if (type.includes('profile_badge::ProfileBadge')) {
            badgeId = obj?.data?.objectId;
          }
          // Count actual pets owned
          if (type.includes('pet_stats::PetNFT')) {
            petCount++;
          }
        }

        if (badgeId) {
          const badgeDetails = await getObjectDetails(badgeId);
          if (badgeDetails?.content?.fields) {
            const fields = badgeDetails.content.fields;
            setProfileData({
              username: fields.username || 'Unknown',
              reputation: parseInt(fields.reputation || '0', 10),
              battlesWon: parseInt(fields.battles_won || '0', 10),
              // Use actual pet count from objects instead of badge field
              petsOwned: petCount
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleCreateProfile = async () => {
    if (!username || username.trim().length === 0) {
      setMessage('❌ Please enter a username');
      return;
    }
    if (username.length > 10) {
      setMessage('❌ Username must be 10 characters or less');
      return;
    }

    try {
      setCreatingProfile(true);
      setMessage('⏳ Creating profile...');
      
      await createProfile(username);
      
      setMessage('✅ Profile created! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Create profile error:', error);
      setMessage(`❌ Failed to create profile: ${error.message || 'Unknown error'}`);
    } finally {
      setCreatingProfile(false);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (loading) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className={styles.container}>
          <div className={styles.loading}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Profile Not Found</h2>
            <p>You haven't created a profile badge yet.</p>
            
            {message && (
              <div style={{ 
                margin: '1rem 0', 
                padding: '0.75rem', 
                borderRadius: '8px',
                backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#fff3cd'
              }}>
                {message}
              </div>
            )}
            
            <div style={{ margin: '1.5rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Create Your Profile
              </label>
              <input
                type="text"
                placeholder="Enter username (max 10 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={10}
                disabled={creatingProfile}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid #ccc',
                  marginBottom: '1rem'
                }}
              />
              <button 
                onClick={handleCreateProfile} 
                disabled={creatingProfile}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: creatingProfile ? '#ccc' : '#28a745',
                  color: 'white',
                  cursor: creatingProfile ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {creatingProfile ? '⏳ Creating...' : '✅ Create Profile'}
              </button>
            </div>
            
            <button onClick={() => navigate('/PetStats')} className={styles.backButton}>
              Back to Pet Stats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <span className={styles.avatarEmoji}>👤</span>
            </div>
            <h1 className={styles.username}>{profileData.username}</h1>
            <p className={styles.address}>{shortenAddress(address)}</p>
          </div>

          <div className={styles.statsSection}>
            <h2>📊 Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⭐</div>
                <div className={styles.statValue}>{profileData.reputation}</div>
                <div className={styles.statLabel}>Reputation</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⚔️</div>
                <div className={styles.statValue}>{profileData.battlesWon}</div>
                <div className={styles.statLabel}>Battles Won</div>
                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  (Not tracked)*
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🐾</div>
                <div className={styles.statValue}>{profileData.petsOwned}</div>
                <div className={styles.statLabel}>Pets Owned</div>
                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  (Live count)
                </div>
              </div>
            </div>
            <p style={{ 
              fontSize: '0.85rem', 
              color: '#666', 
              fontStyle: 'italic',
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              *Battle wins are not automatically tracked in the contract
            </p>
          </div>

          <div className={styles.reputationInfo}>
            <h3>💎 Reputation System</h3>
            <p>Earn reputation by:</p>
            <ul>
              <li>✅ Daily check-ins: +5 reputation</li>
              <li>🐾 Creating pets: +5 reputation each</li>
              <li>⚔️ Winning battles: +10 reputation each</li>
              <li>🏆 Completing achievements: +15 to +30 reputation</li>
            </ul>
          </div>

          <button 
            onClick={() => navigate('/PetStats')} 
            className={styles.backButton}
          >
            ← Back to Pet Stats
          </button>
        </div>
      </div>
    </div>
  );
}
