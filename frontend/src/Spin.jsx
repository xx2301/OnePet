import React, { useEffect, useState } from "react";
import styles from "./Spin.module.css";

const rewards = [
  "5 Tokens",
  "10 Tokens",
  "Pet Food",
  "1 Gem",
  "20 Tokens",
  "Nothing",
];

export default function Spin() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(false);
  const [tokens, setTokens] = useState(100);

  const sliceAngle = 360 / rewards.length;

  useEffect(() => {
    const last = localStorage.getItem("spin-last-date");
    if (!last || last !== new Date().toDateString()) {
      setFreeSpinAvailable(true);
    } else {
      setFreeSpinAvailable(false);
    }
  }, []);

  const startSpin = (type = "free") => {
    if (spinning) return;

    if (type === "paid") {
      const cost = 10;
      if (tokens < cost) {
        alert("Not enough tokens for a paid spin (cost: 10).");
        return;
      }
      setTokens((t) => t - cost);
    } else {
      if (!freeSpinAvailable) {
        alert("Free spin already used today.");
        return;
      }
      setFreeSpinAvailable(false);
      localStorage.setItem("spin-last-date", new Date().toDateString());
    }

    setSpinning(true);
    setResult(null);

    // pick random slice
    const index = Math.floor(Math.random() * rewards.length);

    // 6 full rotations (clockwise)
    const baseSpins = 360 * 6;

    // center of slice
    const sliceCenter = index * sliceAngle + sliceAngle / 2;

    // move sliceCenter to pointer (0°) in clockwise direction
    const landedAngle = 360 - sliceCenter;

    // negative = clockwise rotation
    const finalAngle = (baseSpins + landedAngle);
    setAngle(finalAngle);

    // match transition duration in CSS (3.8s)
    setTimeout(() => {
      setSpinning(false);
      setResult(rewards[index]);
    }, 3800);
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Daily Spin</h2>

      <div className={styles.wheelArea}>
        {/* pointer at top pointing DOWN */}
        <div className={styles.pointer} />

        {/* wheel -> background is conic-gradient for nice slice colors */}
        <div
          className={styles.wheel}
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* labels positioned absolutely around the wheel */}
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

      <div className={styles.controls}>
        <button
          className={styles.freeBtn}
          onClick={() => startSpin("free")}
          disabled={spinning || !freeSpinAvailable}
        >
          {freeSpinAvailable ? "Free Spin" : "Free Spin Used"}
        </button>

        <button
          className={styles.paidBtn}
          onClick={() => startSpin("paid")}
          disabled={spinning}
        >
          {spinning ? "Spinning..." : "Spin (10 Tokens)"}
        </button>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.tokens}>Tokens: {tokens}</div>
        {result && <div className={styles.result}>You won: {result} 🎉</div>}
      </div>
    </div>
  );
}
