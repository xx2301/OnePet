import React, { useState } from "react";
import styles from "./Shop.module.css";

export default function Shop({ tokenBalance, setTokenBalance, inventory, setInventory }) {
  const [items] = useState([
    {
      id: 1,
      name: "Pet Food",
      price: 10,
      effect: "+10 Hunger",
      image: "https://cdn-icons-png.flaticon.com/512/616/616408.png"
    },
    {
      id: 2,
      name: "Chew Toy",
      price: 15,
      effect: "+10 Happiness",
      image: "https://cdn-icons-png.flaticon.com/512/616/616408.png"
    },
    {
      id: 3,
      name: "Energy Drink",
      price: 20,
      effect: "+20 Energy",
      image: "https://cdn-icons-png.flaticon.com/512/616/616408.png"
    },
    {
      id: 4,
      name: "Health Potion",
      price: 25,
      effect: "+30 Health",
      image: "https://cdn-icons-png.flaticon.com/512/616/616408.png"
    },
  ]);

  const [message, setMessage] = useState("");

  const handleBuy = (item) => {
    if (tokenBalance < item.price) {
      setMessage("❌ Not enough tokens!");
      return;
    }

    // simulate purchase
    setTokenBalance((prev) => prev - item.price);
    setInventory((prev) => [...prev, item]);
    setMessage(`✅ You bought ${item.name}!`);
  };

  const handleUse = (item) => {
    // demo only, here you'd update pet stats on-chain or locally
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setMessage(`🎯 You used ${item.name}!`);
  };

  return (
    <div className={styles.page}>
      <h1>🛍 Pet Shop</h1>
      <p className={styles.balance}>Your Token Balance: <strong>{tokenBalance}</strong></p>

      <div className={styles.shopGrid}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            <img src={item.image} alt={item.name} className={styles.itemImage} />
            <h3>{item.name}</h3>
            <p className={styles.effect}>{item.effect}</p>
            <p className={styles.price}>{item.price} TOKEN</p>
            <button className={styles.shopButton} onClick={() => handleBuy(item)}>Buy</button>
          </div>
        ))}
      </div>

      <h2>🎒 Your Inventory</h2>
      {inventory.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <div className={styles.inventoryGrid}>
          {inventory.map((item) => (
            <div key={item.id} className={styles.card}>
              <img src={item.image} alt={item.name} className={styles.itemImage} />
              <h4>{item.name}</h4>
              <p>{item.effect}</p>
              <button className={`${styles.shopButton} ${styles.useBtn}`} onClick={() => handleUse(item)}>Use</button>
            </div>
          ))}
        </div>
      )}

      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
}
