import { Link } from "react-router";
import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import Header from "./Header";

export default function HomePage({darkMode, setDarkMode}) {
  const [ownedPets, setOwnedPets] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [suiBalance, setSuiBalance] = useState(null);
  const pets = [
    { name: "Cat", emoji: "🐱", description: "Calm and curious. Loves naps and quiet."},
    { name: "Dog", emoji: "🐶", description: "Loyal and playful. Always ready to explore."},
    { name: "Rabbit", emoji: "🐰", description: "Gentle and shy. Enjoys peace and snacks."},
    { name: "Hamster", emoji: "🐹", description: "Tiny and active. Loves tunnels and treats."},
  ];

  const handleAdopt = () => {
    // TODO: Replace with actual mint transaction logic
  };

  const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

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
      setWalletAddress(addr);
      fetchBalancesRpc(addr).then((b) => { if (b) setSuiBalance(b); });
    }
    const onStorage = (e) => {
      if (e.key === 'suiAddress') {
        if (!e.newValue) {
          setWalletAddress(null);
          setSuiBalance(null);
        } else {
          setWalletAddress(e.newValue);
          fetchBalancesRpc(e.newValue).then((b) => { if (b) setSuiBalance(b); });
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
              <Link to="/PetStats">
                <button
                  className={styles.adoptBtn}
                  onClick={() => handleAdopt(pet.name)}
                  disabled={ownedPets.includes(pet.name)}
                >
                  {ownedPets.includes(pet.name) ? "✅ Adopted" : "Adopt"}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>🎡 Daily free spin</p>
          <p>🎮 Play to Earn</p>
          <p>⚔️ Battle other pets</p>
        </div>
      </section>
    </div>
  );
}