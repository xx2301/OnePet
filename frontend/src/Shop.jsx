import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import styles from "./Shop.module.css";
import Header from "./Header";
import { getUserObjects, buyShopItem, getOCTBalance, removeItemFromInventory } from "./services/onePetApi";
import { SHOP_SYSTEM_ID } from "./constants";

export default function Shop({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [petTokenBalance, setPetTokenBalance] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [userResources, setUserResources] = useState({ inventories: [], pets: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);

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

  // Load balance and inventory on mount
  useEffect(() => {
    loadShopData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShopData = async () => {
    const addr = localStorage.getItem("suiAddress");
    if (!addr) return;

    try {
      // Get OCT balance in micro-OCT (displayed as PetToken)
      const balance = await getOCTBalance(addr);
      setPetTokenBalance(Number(balance)); // Keep in micro-OCT units

      // Get user objects to find inventory and pets
      const objs = await getUserObjects(addr);
      const resources = { inventories: [], pets: [] };
      let inventoryItems = [];

      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;
        
        if (type.includes('inventory::PlayerInventory')) {
          resources.inventories.push(id);
          // Get inventory items
          const items = obj?.data?.content?.fields?.items || [];
          console.log(`Inventory ${id} has ${items.length} items:`, items);
          
          // Only update if this inventory has items (avoid overwriting with empty arrays)
          if (items.length > 0) {
            inventoryItems = items.map(item => 
              typeof item === 'string' ? parseInt(item, 10) : item
            );
          }
        } else if (type.includes('pet_stats::PetNFT')) {
          const petData = obj?.data?.content?.fields;
          resources.pets.push({
            id,
            name: petData?.name || 'Unknown',
            health: petData?.health || 0,
            hunger: petData?.hunger || 0,
            happiness: petData?.happiness || 0,
            energy: petData?.energy || 0
          });
        }
      }

      console.log('Final inventory items:', inventoryItems);
      console.log('Pets found:', resources.pets);
      setUserResources(resources);
      setInventory(inventoryItems);
      
      // Auto-select first pet if not already selected
      if (!selectedPet && resources.pets.length > 0) {
        setSelectedPet(resources.pets[0].id);
      }
    } catch (err) {
      console.error('Failed to load shop data:', err);
    }
  };

  const [items] = useState([
    {
      id: 1,
      name: "Pet Food",
      price: 10,
      effect: "-10 Hunger",
      emoji: "🍖"
    },
    {
      id: 2,
      name: "Chew Toy",
      price: 15,
      effect: "+10 Happiness",
      emoji: "🎾"
    },
    {
      id: 3,
      name: "Energy Drink",
      price: 20,
      effect: "+20 Energy",
      emoji: "⚡"
    },
    {
      id: 4,
      name: "Health Potion",
      price: 25,
      effect: "+30 Health",
      emoji: "💊"
    },
  ]);

  const handleBuy = async (item) => {
    if (loading) return;

    const inventoryId = userResources.inventories[0];
    if (!inventoryId) {
      setMessage("❌ Inventory not found. Please refresh.");
      return;
    }

    if (petTokenBalance < item.price) {
      setMessage("❌ Not enough PetTokens!");
      return;
    }

    try {
      setLoading(true);
      setMessage("⏳ Processing purchase...");

      // Get OCT coins for payment (displayed as PetToken to user)
      const addr = localStorage.getItem("suiAddress");
      const coinsResponse = await fetch('https://rpc-testnet.onelabs.cc:443', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getCoins',
          params: [addr, '0x2::oct::OCT', null, 10]
        })
      });
      
      const coinsData = await coinsResponse.json();
      const coins = coinsData.result?.data || [];
      
      if (coins.length < 2) {
        setMessage("❌ Need at least 2 OCT coin objects. Please consolidate your coins.");
        setLoading(false);
        return;
      }

      // Use second coin for payment (first is for gas)
      const paymentCoinId = coins[1].coinObjectId;
      
      await buyShopItem(
        SHOP_SYSTEM_ID,
        inventoryId,
        item.id,
        1, // quantity
        paymentCoinId
      );

      setMessage(`✅ You bought ${item.name}!`);
      
      // Refresh balance and inventory after purchase
      setTimeout(() => {
        loadShopData();
        // Notify Header to update balance
        window.dispatchEvent(new Event('balanceUpdate'));
      }, 2000);
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage(`❌ Purchase failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Count items by ID
  const getItemCount = (itemId) => {
    return inventory.filter(id => id === itemId).length;
  };

  // Use item from inventory
  const handleUseItem = async (itemId) => {
    if (loading) return;
    
    const inventoryId = userResources.inventories[0];
    if (!inventoryId) {
      setMessage("❌ Inventory not found.");
      return;
    }

    if (!selectedPet) {
      setMessage("❌ Please select a pet first.");
      return;
    }

    const itemInfo = items.find(i => i.id === itemId);
    if (!itemInfo) return;

    try {
      setLoading(true);
      setMessage(`⏳ Using ${itemInfo.name}...`);

      // Remove item from inventory
      await removeItemFromInventory(inventoryId, itemId);

      setMessage(`✅ Used ${itemInfo.name}! ${itemInfo.effect}`);
      
      // Refresh inventory after use
      setTimeout(() => {
        loadShopData();
      }, 2000);
    } catch (error) {
      console.error('Use item error:', error);
      setMessage(`❌ Failed to use item: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <h1>🛒 Pet Shop</h1>
        <p className={styles.balance}>Your OCT Balance: <strong>{Math.round(petTokenBalance).toLocaleString()}</strong></p>

        <div className={styles.shopGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.emoji}>{item.emoji}</div>
              <h3>{item.name}</h3>
              <p className={styles.effect}>{item.effect}</p>
              <p className={styles.price}>{item.price} PetToken</p>
              <p className={styles.owned}>Owned: {getItemCount(item.id)}</p>
              <button 
                className={styles.shopButton} 
                onClick={() => handleBuy(item)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Buy'}
              </button>
            </div>
          ))}
        </div>

        <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>🎒 Your Inventory</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {userResources.pets.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label>Use items on:</label>
              <select 
                value={selectedPet || ''} 
                onChange={(e) => setSelectedPet(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {userResources.pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} (HP: {pet.health})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={loadShopData} 
            className={styles.shopButton}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            🔄 Refresh
          </button>
        </div>
        {inventory.length === 0 ? (
          <p>No items yet. Buy some items above!</p>
        ) : (
          <div className={styles.inventoryGrid}>
            {items.map((item) => {
              const count = getItemCount(item.id);
              if (count === 0) return null;
              return (
                <div key={item.id} className={styles.card}>
                  <div className={styles.emoji}>{item.emoji}</div>
                  <h4>{item.name}</h4>
                  <p>Quantity: {count}</p>
                  <p className={styles.effect}>{item.effect}</p>
                  <button 
                    className={styles.shopButton}
                    onClick={() => handleUseItem(item.id)}
                    disabled={loading || !selectedPet}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {loading ? 'Using...' : 'Use'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {message && <div className={styles.message}>{message}</div>}
      </div>
    </div>
  );
}
