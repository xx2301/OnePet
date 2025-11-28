import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import styles from "./Shop.module.css";
import Header from "./Header";
import { getUserObjects, buyShopItem, getOCTBalance, buyAdditionalPet } from "./services/onePetApi";
import { SHOP_SYSTEM_ID } from "./constants";

export default function Shop({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [petTokenBalance, setPetTokenBalance] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [userResources, setUserResources] = useState({ inventories: [], pets: [], userState: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPetModal, setShowPetModal] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState(null);
  const [newPetName, setNewPetName] = useState("");
  const [quantities, setQuantities] = useState({});

  const availablePets = [
    { type: 0, name: "Dog", emoji: "🐶", price: 50 },
    { type: 1, name: "Cat", emoji: "🐱", price: 50 },
    { type: 2, name: "Rabbit", emoji: "🐰", price: 50 },
    { type: 3, name: "Hamster", emoji: "🐹", price: 50 }
  ];

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
      console.log('🔄 Loading shop data for address:', addr);
      
      // Get OCT balance in micro-OCT (displayed as PetToken)
      const balance = await getOCTBalance(addr);
      console.log('💰 OCT Balance:', balance);
      setPetTokenBalance(Number(balance)); // Keep in micro-OCT units

      // Get user objects to find inventory and pets
      const objs = await getUserObjects(addr);
      console.log('📦 Found', objs.length, 'objects');
      const resources = { inventories: [], pets: [], userState: null };
      let inventoryItems = [];

      for (const obj of objs) {
        const type = obj?.data?.type || '';
        const id = obj?.data?.objectId;
        
        if (type.includes('user_initializer::UserState') || type.includes('UserState')) {
          resources.userState = id;
        } else if (type.includes('inventory::PlayerInventory')) {
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
          const pet = {
            id,
            name: petData?.name || 'Unknown',
            health: petData?.health || 0,
            hunger: petData?.hunger || 0,
            happiness: petData?.happiness || 0,
            energy: petData?.energy || 0
          };
          console.log('🐾 Found pet:', pet.name, '- ID:', id);
          resources.pets.push(pet);
        }
      }
      
      console.log('✅ Shop data loaded - Pets:', resources.pets.length, 'Inventory items:', inventoryItems.length);

      if (!resources.userState) {
        console.warn('⚠️ UserState not found. Pet adoption will not work.');
      }
      setUserResources(resources);
      setInventory(inventoryItems);
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

  // Initialize quantities to 1 for each item
  useEffect(() => {
    const initialQuantities = {};
    items.forEach(item => {
      initialQuantities[item.id] = 1;
    });
    setQuantities(initialQuantities);
  }, []);

  const handleQuantityChange = (itemId, value) => {
    const numValue = Math.max(1, parseInt(value) || 1);
    setQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const handleBuy = async (item) => {
    if (loading) return;

    const inventoryId = userResources.inventories[0];
    if (!inventoryId) {
      setMessage("❌ Inventory not found. Please refresh.");
      return;
    }

    const quantity = quantities[item.id] || 1;
    const totalCost = item.price * quantity;

    if (petTokenBalance < totalCost) {
      setMessage(`❌ Not enough PetTokens! Need ${totalCost} but you have ${Math.round(petTokenBalance)}`);
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
        quantity,
        paymentCoinId
      );

      setMessage(`✅ You bought ${quantity}x ${item.name}!`);
      
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

  // Handle pet purchase button click
  const handlePetPurchase = (pet) => {
    console.log('Adopt button clicked for pet:', pet);
    console.log('Current user resources:', userResources);
    setSelectedPetType(pet);
    setNewPetName("");
    setShowPetModal(true);
    console.log('Modal should be open now');
  };

  // Complete pet purchase
  const completePetPurchase = async () => {
    console.log('Complete pet purchase called');
    console.log('Pet name:', newPetName);
    console.log('Selected pet type:', selectedPetType);
    
    if (!newPetName.trim()) {
      setMessage("❌ Please enter a name for your pet!");
      return;
    }

    if (!userResources.userState) {
      setMessage("❌ User state not found. Please refresh.");
      return;
    }

    const petPrice = 50_000_000; // 50 OCT in micro units
    if (petTokenBalance < petPrice) {
      setMessage("❌ Not enough OCT! You need 50 OCT to buy a pet.");
      return;
    }

    try {
      setLoading(true);
      setMessage("⏳ Buying pet...");

      // Get OCT coins for payment
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
        setMessage("❌ You need at least 2 OCT coins (one for payment, one for gas). Try getting more coins or consolidating them.");
        setLoading(false);
        return;
      }

      // Find a coin with enough balance for the pet (50 OCT)
      const paymentCoin = coins.find(c => Number(c.balance) >= petPrice);
      if (!paymentCoin) {
        setMessage("❌ No single coin with enough balance for the pet (50 OCT). Try consolidating your coins.");
        setLoading(false);
        return;
      }

      console.log('Using payment coin:', paymentCoin.coinObjectId, 'Balance:', paymentCoin.balance);

      // Purchase the pet
      console.log('🐾 Calling buyAdditionalPet with:', {
        userState: userResources.userState,
        name: newPetName.trim(),
        type: selectedPetType.type,
        paymentCoin: paymentCoin.coinObjectId
      });
      
      const result = await buyAdditionalPet(
        userResources.userState,
        newPetName.trim(),
        selectedPetType.type,
        paymentCoin.coinObjectId
      );
      
      console.log('✅ Pet purchase transaction successful:', result);

      setMessage(`✅ Successfully bought ${selectedPetType.name} named "${newPetName}"! Refreshing in 3 seconds...`);
      setShowPetModal(false);
      
      // Refresh data with longer delay to ensure blockchain updates
      setTimeout(() => {
        console.log('🔄 Refreshing shop data after pet purchase...');
        loadShopData();
        // Notify Header to update balance and pet count
        window.dispatchEvent(new Event('balanceUpdate'));
        setMessage(`✅ ${selectedPetType.name} "${newPetName}" added to your collection! Check your Pet Stats page.`);
        
        // Clear message after showing confirmation
        setTimeout(() => setMessage(''), 5000);
      }, 3000);
    } catch (error) {
      console.error('Pet purchase error:', error);
      setMessage(`❌ Failed to buy pet: ${error.message || 'Unknown error'}`);
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

        <h2 style={{ textAlign: 'center', marginTop: '1rem' }}>🐾 Adopt a Pet</h2>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Already have {userResources.pets.length} pet{userResources.pets.length !== 1 ? 's' : ''}. Buy more pets to expand your collection!
        </p>
        <div className={styles.shopGrid}>
          {availablePets.map((pet) => (
            <div key={pet.type} className={styles.card}>
              <div className={styles.emoji} style={{ fontSize: '4rem' }}>{pet.emoji}</div>
              <h3>{pet.name}</h3>
              <p className={styles.price}>{pet.price} OCT</p>
              <button 
                className={styles.shopButton} 
                onClick={() => handlePetPurchase(pet)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Adopt'}
              </button>
            </div>
          ))}
        </div>

        <h2 style={{ textAlign: 'center', marginTop: '3rem' }}>🛍️ Shop Items</h2>
        <div className={styles.shopGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.emoji}>{item.emoji}</div>
              <h3>{item.name}</h3>
              <p className={styles.effect}>{item.effect}</p>
              <p className={styles.price}>{item.price} PetToken</p>
              <div style={{ margin: '0.5rem 0' }}>
                <label style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={quantities[item.id] || 1}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  style={{ width: '60px', padding: '0.2rem', textAlign: 'center' }}
                />
              </div>
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
                </div>
              );
            })}
          </div>
        )}

        {message && <div className={styles.message}>{message}</div>}

        {/* Pet Purchase Modal */}
        {showPetModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              color: '#000',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#000' }}>
                Adopt {selectedPetType?.emoji} {selectedPetType?.name}
              </h2>
              <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>
                Cost: {selectedPetType?.price} OCT
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#000' }}>
                  Pet Name:
                </label>
                <input
                  type="text"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="Enter pet name..."
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    console.log('Cancel button clicked');
                    setShowPetModal(false);
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f5f5f5',
                    color: '#000',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Adopt button in modal clicked');
                    completePetPurchase();
                  }}
                  disabled={loading || !newPetName.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: loading || !newPetName.trim() ? '#ccc' : '#4CAF50',
                    color: 'white',
                    cursor: (loading || !newPetName.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Processing...' : 'Adopt'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
