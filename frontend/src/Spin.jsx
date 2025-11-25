import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Spin.module.css";
import Header from "./Header";
import { getUserObjects, spinWheel, getPetTokenBalance } from "./services/onePetApi";

const rewards = [
  "10-30 Tokens",
  "50-100 EXP",
  "Random Item",
  "50-100 Tokens",
  "10-30 Tokens",
  "50-100 EXP",
];

const ITEM_NAMES = {
  1: '🍖 Pet Food',
  2: '🎾 Chew Toy',
  3: '⚡ Energy Drink',
  4: '💊 Health Potion'
};

export default function Spin({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [userResources, setUserResources] = useState({ 
    dailyTrackers: [], 
    inventories: [], 
    pets: [] 
  });
  const [petTokenBalance, setPetTokenBalance] = useState(0);
  const [canSpin, setCanSpin] = useState(false);

  const sliceAngle = 360 / rewards.length;

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

  // Load user resources
  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) return;

    try {
      setLoading(true);
      
      // Get PetToken balance
      const balance = await getPetTokenBalance(addr);
      setPetTokenBalance(balance);

      // Get user objects to find daily tracker, inventory, and pets
      const objs = await getUserObjects(addr);
      const resources = { dailyTrackers: [], inventories: [], pets: [] };

      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;
        
        if (type.includes('daily_limits::DailyTracker')) {
          const fields = obj?.data?.content?.fields;
          
          // Correct field name is spins_used_today
          const spinsUsedToday = parseInt(fields?.spins_used_today || '0', 10);
          const maxDailySpins = parseInt(fields?.max_daily_spins || '1', 10);
          
          resources.dailyTrackers.push({
            id,
            wheelSpinsUsed: spinsUsedToday,  // Use correct field
            maxSpins: maxDailySpins,
            lastSpinDate: fields?.last_spin_date || '0'
          });
          
          console.log('Spins used today:', spinsUsedToday, '/', maxDailySpins);
        } else if (type.includes('inventory::PlayerInventory')) {
          resources.inventories.push(id);
        } else if (type.includes('pet_stats::PetNFT')) {
          const petData = obj?.data?.content?.fields;
          resources.pets.push({
            id,
            name: petData?.name || 'Unknown',
            level: petData?.level || 1
          });
        }
      }

      console.log('User resources:', resources);
      setUserResources(resources);
      
      // Check if user can spin (has daily tracker and hasn't used spin today)
      if (resources.dailyTrackers.length > 0) {
        const wheelSpinsUsed = resources.dailyTrackers[0].wheelSpinsUsed;
        console.log('Wheel spins used:', wheelSpinsUsed);
        
        if (wheelSpinsUsed < 1) {
          setCanSpin(true);
          setMessage('');
        } else {
          setCanSpin(false);
          setMessage('✅ Daily spin already used today. Come back tomorrow!');
        }
      } else {
        setCanSpin(false);
        setMessage('⚠️ Daily tracker not found. Please initialize your account first.');
      }
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setMessage('❌ Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const startSpin = async () => {
    if (spinning || !canSpin) return;

    const dailyTrackerId = userResources.dailyTrackers[0]?.id;
    const inventoryId = userResources.inventories[0];
    const petId = userResources.pets[0]?.id;

    if (!dailyTrackerId) {
      setMessage('❌ Daily tracker not found. Please initialize your account.');
      return;
    }

    if (!inventoryId) {
      setMessage('❌ Inventory not found. Please initialize your account.');
      return;
    }

    if (!petId) {
      setMessage('❌ No pet found. Please create a pet first.');
      return;
    }

    // Immediately disable spinning and set states
    setSpinning(true);
    setCanSpin(false);
    setResult(null);
    setMessage('⏳ Spinning the wheel...');

    try {
      // Pick random slice for animation
      const visualIndex = Math.floor(Math.random() * rewards.length);
      
      // Animate wheel
      const extraRotations = 6;
      const sliceCenter = visualIndex * sliceAngle + sliceAngle / 2;
      const landedAngle = (360 - sliceCenter) % 360;
      const currentTurns = Math.floor(angle / 360);
      const finalAngle = (currentTurns + extraRotations) * 360 + landedAngle;
      
      setAngle(finalAngle);

      // Call blockchain spin function
      const response = await spinWheel(dailyTrackerId, inventoryId, petId);
      
      console.log('Spin response:', response);
      
      // Parse the result from blockchain
      const spinResult = parseSpinResult(response);
      
      // Wait for animation to complete
      setTimeout(() => {
        setSpinning(false);
        setResult(spinResult);
        setMessage(`✅ ${spinResult} Daily spin used.`);
        
        // Refresh data after longer delay to ensure blockchain has updated
        setTimeout(() => {
          loadUserData();
          window.dispatchEvent(new Event('balanceUpdate'));
        }, 3000);
      }, 3800);
      
    } catch (error) {
      console.error('Spin error:', error);
      setSpinning(false);
      
      if (error.message?.includes('413')) {
        setMessage('❌ Daily spin limit reached! Come back tomorrow.');
      } else {
        setMessage(`❌ Spin failed: ${error.message || 'Unknown error'}`);
        // Re-enable if it was a different error (not limit reached)
        if (!error.message?.includes('413')) {
          setCanSpin(true);
        }
      }
    }
  };

  const parseSpinResult = (response) => {
    try {
      console.log('Full spin response:', JSON.stringify(response, null, 2));
      
      // Try to extract reward info from transaction effects
      const effects = response?.effects;
      const events = effects?.events || [];
      
      console.log('Events found:', events);
      
      // Look for wheel reward event
      for (const event of events) {
        console.log('Checking event:', event);
        
        // Check multiple possible type formats
        const eventType = event.type || event.moveEventType || '';
        console.log('Event type:', eventType);
        
        if (eventType.includes('WheelReward') || eventType.includes('wheel')) {
          const fields = event.parsedJson || event.fields || event;
          console.log('Event fields:', fields);
          
          const rewardType = fields.reward_type || fields.rewardType || 0;
          const amount = fields.amount || 0;
          const itemId = fields.item_id || fields.itemId;
          
          console.log('Parsed:', { rewardType, amount, itemId });
          
          if (rewardType === 0) {
            return `🪙 Won ${amount} PetTokens!`;
          } else if (rewardType === 1) {
            return `⭐ Won ${amount} Experience Points!`;
          } else if (rewardType === 2) {
            const itemName = ITEM_NAMES[itemId] || `Item #${itemId}`;
            return `🎁 Won ${itemName}!`;
          } else if (rewardType === 3) {
            return `💎 JACKPOT! Won ${amount} Rare PetTokens!`;
          }
        }
      }
      
      // Try to extract from objectChanges as fallback
      const objectChanges = effects?.objectChanges || [];
      console.log('Object changes:', objectChanges);
      
      // Default fallback with more info
      return 'You won a mystery prize! Check your inventory and balance. 🎉';
    } catch (err) {
      console.error('Error parsing spin result:', err);
      return 'You won a prize! Check your inventory and balance. 🎉';
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 className={styles.title}>Daily Spin</h2>
          <p style={{ marginTop: '2rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ overflowY: 'auto', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 2rem 2rem' }}>
        <h2 className={styles.title} style={{ marginBottom: '1rem', marginTop: '0' }}>🎰 Daily Spin Wheel</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem', width: '100%', maxWidth: '800px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            PetTokens: {petTokenBalance.toLocaleString()}
          </p>
        </div>

        {message && (
          <div style={{
            width: '100%',
            maxWidth: '800px',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#fff3cd',
            color: message.includes('✅') ? '#155724' : message.includes('❌') ? '#721c24' : '#856404',
            textAlign: 'center',
            fontWeight: 'bold',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : message.includes('❌') ? '#f5c6cb' : '#ffeeba'}`
          }}>
            {message}
          </div>
        )}

        <div className={styles.wheelArea}>
          <div className={styles.pointer} />

          <div
            className={styles.wheel}
            style={{ transform: `rotate(${angle}deg)` }}
          >
            {rewards.map((r, i) => {
              const mid = i * sliceAngle + sliceAngle / 2;

              return (
                <div
                  key={i}
                  className={styles.labelWrap}
                  style={{ transform: `rotate(${mid}deg)` }}
                >
                  <div
                    className={styles.label}
                    style={{ transform: `translate(-50%, -135px) rotate(${-mid}deg)` }}
                  >
                    {r}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.controls} style={{ width: '100%', maxWidth: '800px', marginTop: '2rem' }}>
          <button
            className={styles.freeBtn}
            onClick={startSpin}
            disabled={spinning || !canSpin}
            style={{ 
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              cursor: (spinning || !canSpin) ? 'not-allowed' : 'pointer',
              opacity: (spinning || !canSpin) ? 0.6 : 1
            }}
          >
            {spinning ? '🎰 Spinning...' : canSpin ? '🎯 Spin Now (Free Daily Spin)' : '❌ Daily Spin Used'}
          </button>
        </div>

        {result && (
          <div style={{
            width: '100%',
            maxWidth: '800px',
            marginTop: '2rem',
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: '#ffd700',
            color: '#000',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            🎉 {result} 🎉
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', width: '100%', maxWidth: '800px' }}>
          <h3>Possible Rewards:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>🪙 10-30 PetTokens (40% chance)</li>
            <li>⭐ 50-100 Experience (30% chance)</li>
            <li>🎁 Random Item (25% chance)</li>
            <li>💎 50-100 Rare Tokens (5% chance)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
