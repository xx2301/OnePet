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

    // how many extra full rotations to perform before landing
    const extraRotations = 6; // full spins for visual effect

    // center angle of the chosen slice (degrees)
    const sliceCenter = index * sliceAngle + sliceAngle / 2;

    // compute angle so that the sliceCenter comes to the pointer (top)
    // depending on orientation of the wheel the pointer aligns at 0deg,
    // so we rotate by (360 - sliceCenter) degrees within the final turn
    const landedAngle = (360 - sliceCenter) % 360;

    // ensure final angle is > current angle so animation always spins forward
    const currentTurns = Math.floor(angle / 360);
    const finalAngle = (currentTurns + extraRotations) * 360 + landedAngle;

    setAngle(finalAngle);

    // match transition duration in CSS (3.8s)
    const durationMs = 3800;
    setTimeout(() => {
      setSpinning(false);
      setResult(rewards[index]);
    }, durationMs);
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
