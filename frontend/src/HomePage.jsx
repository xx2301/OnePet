import { Link } from "react-router";
import React, { useState } from "react";
import styles from "./HomePage.module.css";
import Header from "./Header";

export default function HomePage({darkMode, setDarkMode}) {
  const [ownedPets, setOwnedPets] = useState([]);
  const pets = [
    { name: "Cat", emoji: "🐱", description: "Calm and curious. Loves naps and quiet."},
    { name: "Dog", emoji: "🐶", description: "Loyal and playful. Always ready to explore."},
    { name: "Rabbit", emoji: "🐰", description: "Gentle and shy. Enjoys peace and snacks."},
    { name: "Hamster", emoji: "🐹", description: "Tiny and active. Loves tunnels and treats."},
  ];

  const handleAdopt = () => {
    // TODO: Replace with actual mint transaction logic
  };

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