import { Link } from "react-router";
import styles from "./ConnectWallet.module.css";

export default function ConnectWallet() {
  const handleConnectWallet = () => {
    // TODO: Replace with actual wallet connect logic
  };

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>Welcome to OnePet</div>
      <div className={styles.message}>
        Connect your wallet to start your pet adventure!
      </div>
      <Link to="/HomePage">
        <img src="img/cat.png" width="400px" />
      </Link>
      <button
        className={styles.connect_wallet_button}
        onClick={handleConnectWallet}
      >
        Connect Wallet
      </button>
    </div>
  );
}