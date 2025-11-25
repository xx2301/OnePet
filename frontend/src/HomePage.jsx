import { Link, useNavigate } from "react-router";
import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import Header from "./Header";
import ModalInput from "./components/ModalInput";
import { PACKAGE_ID } from "./constants";
import { createFirstPet, getUserObjects } from "./services/onePetApi";
const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

// Wallet-only: build and submit a create_first_pet Move call via wallet

export default function HomePage({darkMode, setDarkMode}) {
  const navigate = useNavigate();
  const [ownedPets, setOwnedPets] = useState([]);
  const [showPetNameModal, setShowPetNameModal] = useState(false);
  const [selectedPetForAdopt, setSelectedPetForAdopt] = useState(null);
  const [pendingUserStateId, setPendingUserStateId] = useState(null);

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
  const pets = [
    { name: "Cat", emoji: "🐱", description: "Calm and curious. Loves naps and quiet."},
    { name: "Dog", emoji: "🐶", description: "Loyal and playful. Always ready to explore."},
    { name: "Rabbit", emoji: "🐰", description: "Gentle and shy. Enjoys peace and snacks."},
    { name: "Hamster", emoji: "🐹", description: "Tiny and active. Loves tunnels and treats."},
  ];

  const handleAdopt = (petName) => {
    (async () => {
      const addr = localStorage.getItem('suiAddress');
      if (!addr) {
        alert('Connect your wallet first.');
        return;
      }

      // Store the selection and show modal for pet name
      setSelectedPetForAdopt(petName);
      setPendingUserStateId(null); // Will be set after finding UserState

      // find user's UserState object using new API
      try {
        const objs = await getUserObjects(addr);
        console.log('User objects:', objs);
        
        let userStateId = null;
        for (const obj of objs) {
          const type = obj?.data?.type || '';
          console.log('Checking object type:', type);
          if (type.includes('pet_stats::UserState')) {
            userStateId = obj.data.objectId;
            console.log('Found UserState:', userStateId);
            break;
          }
        }

        if (!userStateId) {
          alert('No UserState found. Please initialize your account first from the Connect page.');
          return;
        }

        // Store UserState and show pet name modal
        setPendingUserStateId(userStateId);
        setShowPetNameModal(true);
      } catch (err) {
        console.error('Failed to fetch user objects:', err);
        alert('Failed to fetch your account data. Please try again.');
      }
    })();
  };

  const handlePetNameSubmit = async (petName) => {
    if (!petName || petName.length === 0) {
      alert('Pet name cannot be empty.');
      return;
    }
    if (petName.length > 20) {
      alert('Pet name too long (max 20 characters).');
      return;
    }

    if (!pendingUserStateId || !selectedPetForAdopt) {
      alert('Error: Missing required data.');
      setShowPetNameModal(false);
      return;
    }

    // Determine pet type
    const petTypeMap = { 'Dog': 0, 'Cat': 1, 'Rabbit': 2, 'Hamster': 3 };
    const selected = pets.find(p => p.name === selectedPetForAdopt) || pets[0];
    const petType = petTypeMap[selected.name] ?? 0;

    try {
      // Call the API to create first pet
      const result = await createFirstPet(pendingUserStateId, petName, petType);

      console.log('Pet created successfully:', result);
      
      // Close modal and reset state
      setShowPetNameModal(false);
      setPendingUserStateId(null);
      setSelectedPetForAdopt(null);
      setOwnedPets((s) => [...s, selected.name]);
      
      // Navigate to PetStats page
      alert('🎉 Pet created successfully! Redirecting to Pet Stats...');
      setTimeout(() => {
        navigate('/PetStats');
      }, 1000);
    } catch (err) {
      console.error('create_first_pet failed', err);
      alert('Failed to create pet: ' + (err?.message || err));
      setShowPetNameModal(false);
    }
  };

  const handlePetNameCancel = () => {
    setShowPetNameModal(false);
    setPendingUserStateId(null);
    setSelectedPetForAdopt(null);
  };

  const fetchBalancesRpc = async (addr) => {
    if (!addr) return null;
    try {
      const res = await fetch(SUI_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sui_getAllBalances", params: [addr] }),
      });
      const data = await res.json();
      const balances = data?.result || [];
      if (!Array.isArray(balances) || balances.length === 0) return null;
      const suiCoin = balances.find((b) => b.coinType && b.coinType.includes("SUI"));
      const target = suiCoin || balances[0];
      const raw = Number(target.totalBalance || 0);
      const human = raw / 1e9;
      return { raw, human };
    } catch (e) {
      console.warn("Failed to fetch balances", e);
      return null;
    }
  };

  useEffect(() => {
    const addr = localStorage.getItem('suiAddress');
    if (addr) {
      fetchBalancesRpc(addr);
    }
    const onStorage = (e) => {
      if (e.key === 'suiAddress') {
        if (e.newValue) {
          fetchBalancesRpc(e.newValue);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <section className={styles.section}>
        <h2>
          <span className={styles.highlight}>Adopt Your First Pet</span>
        </h2>
        <p>Welcome, Trainer! Choose your first companion to start your jorney.</p>

        <div className={styles.petGrid}>
          {pets.map((pet, index) => (
            <div key={index} className={styles.petCard}>
              <div className={styles.petEmoji}>{pet.emoji}</div>
              <h3>{pet.name}</h3>
              <p style={{fontSize:"15px"}}>{pet.description}</p>
              <button
                className={styles.adoptBtn}
                onClick={() => handleAdopt(pet.name)}
                disabled={ownedPets.includes(pet.name)}
              >
                {ownedPets.includes(pet.name) ? "✅ Adopted" : "Adopt"}
              </button>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>🎡 Daily free spin</p>
          <p>🎮 Play to Earn</p>
          <p>⚔️ Battle other pets</p>
        </div>
      </section>

      <ModalInput
        isOpen={showPetNameModal}
        title="Name Your Pet"
        label="Choose a name for your pet (1-20 characters):"
        defaultValue=""
        maxLength={20}
        placeholder="Enter pet name..."
        onSubmit={handlePetNameSubmit}
        onCancel={handlePetNameCancel}
        submitText="Create Pet"
      />
    </div>
  );
}