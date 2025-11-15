import { Link } from "react-router";
import React, { useState } from "react";
import Header from "./Header";
import styles from "./PetStats.module.css";

export default function PetStats({darkMode, setDarkMode}) {
  const [stats, setStats] = useState([
    { text: 'Happiness', value: 50 },
    { text: 'Hunger', value: 30 },
    { text: 'Health', value: 90 },
    { text: 'Energy', value: 75 }
  ]);

  //demo logic only
  const feed = () => {
    setStats((s) => ({
      ...s,
      hunger: Math.min(s.hunger + 30, 100),
      energy: Math.min(s.energy + 10, 100),
    }));
  };

  const play = () => {
    setStats((s) => ({
      ...s,
      happiness: Math.min(s.happiness + 25, 100),
      energy: Math.max(s.energy - 10, 0),
    }));
  };

  const sleep = () => {
    setStats((s) => ({
      ...s,
      energy: 100,
      happiness: Math.max(s.happiness - 10, 0),
    }));
  };

  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : styles.light}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={styles.container}>
        <div className={styles.petCard}>

          <div className={styles.petHeader}>
            <div>
              <button style={{backgroundColor:"transparent", border:"none"}} onClick={()=>setOpen(!open)}>
                <img src="/img/Hamburger_icon.png" width="30px"></img>
              </button>
              <div className={open?styles.content:styles.hide}>
                <Link to="/Shop">Shop</Link>
                <Link>Daily Spin</Link>
                <Link>Battle</Link>
              </div>
            </div>

            <h2>Chip</h2> 
            <span className={styles.level}>Lv.1</span>
          </div>

          <img
            src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
            className={styles.petImage}
          />
          <p className={styles.mood}>Happy</p>
          <p className={styles.xp}>{stats.xp} / 100 XP</p>
          <div className={styles.tokenBox}>
            <span>NFT Token ID</span>
            <p>TOKEN ID</p>
          </div>
        </div>

        <div className={styles.statsPanel}>
          <div className={styles.section}>
            <h3>Pet Stats</h3>
            {stats.map((stat) => {
              return (
                <div key={crypto.randomUUID()} className={styles.barGroup}>
                  <span>{stat.text}</span>
                  <div className={styles.bar}>
                    <div
                      className={styles.fill}
                      style={{ width: `${stat.value}%` }}
                    ></div>
                  </div>
                  <span className={styles.percent}>{stat.value}%</span>
                </div>
              )
            })}
          </div>

          <div className={styles.section}>
            <h3>Care for Your Pet</h3>
            <div className={styles.actions}>
              <button className={styles.feed} onClick={feed}>
                🍖 Feed <br /> +x Hunger
              </button>
              <button className={styles.play} onClick={play}>
                🎮 Play <br /> +x Happiness
              </button>
              <button className={styles.sleep} onClick={sleep}>
                🌙 Sleep <br /> +x Energy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
