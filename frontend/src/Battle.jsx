import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Header from "./Header";
import styles from "./Battle.module.css";

const DEFAULT_PETS = [
  { name: "Cat", emoji: "🐱", hp: 60, atk: 12, def: 6, spd: 8 },
  { name: "Dog", emoji: "🐶", hp: 75, atk: 10, def: 8, spd: 6 },
  { name: "Rabbit", emoji: "🐰", hp: 50, atk: 9, def: 5, spd: 10 },
  { name: "Hamster", emoji: "🐹", hp: 40, atk: 8, def: 4, spd: 12 },
];

function calcDamage(att, def) {
  const raw = Math.max(1, Math.round(att - def * 0.4));
  // small randomness
  const variance = Math.round(raw * 0.2);
  return raw + (Math.floor(Math.random() * (variance * 2 + 1)) - variance);
}

export default function Battle() {
  const [playerChoice, setPlayerChoice] = useState(DEFAULT_PETS[0]);
  const [enemy, setEnemy] = useState(null);
  const [playerHp, setPlayerHp] = useState(playerChoice.hp);
  const [enemyHp, setEnemyHp] = useState(null);
  const [log, setLog] = useState([]);
  const [turn, setTurn] = useState(null); // 'player' | 'enemy'
  const [inBattle, setInBattle] = useState(false);
  const [result, setResult] = useState(null);
  const [reward, setReward] = useState(0);

  useEffect(() => {
    setPlayerHp(playerChoice.hp);
  }, [playerChoice]);

  const pickEnemy = () => {
    const choices = DEFAULT_PETS.filter((p) => p.name !== playerChoice.name);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    setEnemy(pick);
    setEnemyHp(pick.hp);
    setLog((l) => [...l, `An enemy ${pick.name} appeared ${pick.emoji}`]);
    setResult(null);
  };

  const startBattle = () => {
    if (!enemy) {
      setLog((l) => [...l, "You need to find an opponent first."]);
      return;
    }
    setInBattle(true);
    setLog((l) => [...l, "Battle started!"]);
    // determine first turn by speed
    const who = playerChoice.spd >= enemy.spd ? "player" : "enemy";
    setTurn(who);
    if (who === "enemy") {
      // slight delay to let UI update
      setTimeout(enemyAttack, 600);
    }
  };

  const pushLog = (text) => setLog((l) => [text, ...l].slice(0, 8));

  const playerAttack = () => {
    if (!inBattle || turn !== "player" || !enemy) return;
    const dmg = calcDamage(playerChoice.atk, enemy.def);
    setEnemyHp((hp) => {
      const next = Math.max(0, hp - dmg);
      pushLog(`${playerChoice.name} hits ${enemy.name} for ${dmg} dmg`);
      if (next === 0) {
        finishBattle("player");
      } else {
        setTurn("enemy");
        setTimeout(enemyAttack, 800 + Math.random() * 400);
      }
      return next;
    });
  };

  const enemyAttack = () => {
    if (!inBattle || turn !== "enemy" || !enemy) return;
    const dmg = calcDamage(enemy.atk, playerChoice.def);
    setPlayerHp((hp) => {
      const next = Math.max(0, hp - dmg);
      pushLog(`${enemy.name} hits ${playerChoice.name} for ${dmg} dmg`);
      if (next === 0) {
        finishBattle("enemy");
      } else {
        setTurn("player");
      }
      return next;
    });
  };

  const finishBattle = (winner) => {
    setInBattle(false);
    setTurn(null);
    if (winner === "player") {
      const won = Math.floor(5 + Math.random() * 16); // 5-20 reward
      setReward(won);
      setResult(`Victory! You earned ${won} tokens.`);
      pushLog("You won the battle!");
    } else {
      setReward(0);
      setResult("Defeat. Better luck next time.");
      pushLog("You were defeated.");
    }
  };

  const resetBattle = () => {
    setEnemy(null);
    setEnemyHp(null);
    setInBattle(false);
    setLog([]);
    setResult(null);
    setPlayerHp(playerChoice.hp);
    setReward(0);
  };

  return (
    <div className={styles.page}>
      <Header darkMode={true} setDarkMode={() => {}} />
      <div className={styles.container}>
        <h2>Battle Arena</h2>
        <div className={styles.topRow}>
          <div className={styles.card}>
            <h3>Your Pet</h3>
            <div className={styles.petRow}>
              <div className={styles.emoji}>{playerChoice.emoji}</div>
              <div>
                <div className={styles.name}>{playerChoice.name}</div>
                <div className={styles.stat}>HP: {playerHp}/{playerChoice.hp}</div>
                <div className={styles.stat}>ATK: {playerChoice.atk} DEF: {playerChoice.def} SPD: {playerChoice.spd}</div>
                <div className={styles.hpBar}><div style={{width: `${(playerHp/playerChoice.hp)*100}%`}} className={styles.hpFill}></div></div>
              </div>
            </div>
            <label>Select Pet</label>
            <select className={styles.select} value={playerChoice.name} onChange={(e)=>{
              const p = DEFAULT_PETS.find(x=>x.name===e.target.value);
              setPlayerChoice(p);
              setPlayerHp(p.hp);
            }}>
              {DEFAULT_PETS.map((p)=> <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className={styles.card}>
            <h3>Opponent</h3>
            {enemy ? (
              <>
                <div className={styles.petRow}>
                  <div className={styles.emoji}>{enemy.emoji}</div>
                  <div>
                    <div className={styles.name}>{enemy.name}</div>
                    <div className={styles.stat}>HP: {enemyHp}/{enemy.hp}</div>
                    <div className={styles.stat}>ATK: {enemy.atk} DEF: {enemy.def} SPD: {enemy.spd}</div>
                    <div className={styles.hpBar}><div style={{width: `${(enemyHp/enemy.hp)*100}%`}} className={styles.hpFill}></div></div>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.placeholder}>No opponent selected</div>
            )}
            <div className={styles.controls}>
              <button onClick={pickEnemy} className={styles.btn}>Find Opponent</button>
              <button onClick={startBattle} className={styles.btn} disabled={!enemy || inBattle}>Start Battle</button>
            </div>
          </div>
        </div>

        <div className={styles.middleRow}>
          <div className={styles.actions}>
            <button className={styles.attackBtn} onClick={playerAttack} disabled={!inBattle || turn!=='player'}>Attack</button>
            <button className={styles.resetBtn} onClick={resetBattle}>Reset</button>
          </div>

          <div className={styles.log}>
            <h4>Battle Log</h4>
            {result && <div className={styles.result}>{result}</div>}
            <ul>
              {log.map((l,idx)=>(<li key={idx}>{l}</li>))}
            </ul>
          </div>
        </div>

        <div className={styles.footerRow}>
          <Link to="/HomePage" className={styles.back}>← Back</Link>
          {reward>0 && <div className={styles.reward}>Reward: {reward} tokens</div>}
        </div>
      </div>
    </div>
  );
}
