import React, { useEffect, useState } from 'react'
import styles from './Header.module.css'
import { getPetTokenBalance } from './services/onePetApi'
import { Link } from 'react-router'

export default function Header({ darkMode, setDarkMode }) {
    const [wallet, setWallet] = useState(null);
    const [petTokenBalance, setPetTokenBalance] = useState(null);
    const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

    const shorten = (addr) => (addr ? `${addr.slice(0,6)}...${addr.slice(-6)}` : '');

    useEffect(() => {
      const addr = localStorage.getItem('suiAddress');
      if (addr) {
        setWallet(addr);
        getPetTokenBalance(addr).then((balance) => setPetTokenBalance(balance));
      }
      const onStorage = (e) => {
        if (e.key === 'suiAddress') {
          if (!e.newValue) {
            setWallet(null);
            setPetTokenBalance(null);
          } else {
            setWallet(e.newValue);
            getPetTokenBalance(e.newValue).then((balance) => setPetTokenBalance(balance));
          }
        }
      };
      window.addEventListener('storage', onStorage);
      
      // Listen for balance update events from other components
      const onBalanceUpdate = () => {
        const currentAddr = localStorage.getItem('suiAddress');
        if (currentAddr) {
          getPetTokenBalance(currentAddr).then((balance) => setPetTokenBalance(balance));
        }
      };
      window.addEventListener('balanceUpdate', onBalanceUpdate);
      
      // Auto-refresh balance every 5 seconds
      const interval = setInterval(() => {
        const currentAddr = localStorage.getItem('suiAddress');
        if (currentAddr) {
          getPetTokenBalance(currentAddr).then((balance) => setPetTokenBalance(balance));
        }
      }, 5000);
      
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('balanceUpdate', onBalanceUpdate);
        clearInterval(interval);
      };
    }, []);

    return (
        <nav className={styles.navbar}>
            <Link to="/PetStats" className={styles.logo} style={{ color: darkMode ? 'white' : '#222' }}>OnePet</Link>
            <div>
                <button className={styles.toggle} onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
                <span className={styles.connect} title={wallet || 'Not connected'}>
                    {wallet ? shorten(wallet) : 'Wallet: Not connected'}
                </span>
                <span className={styles.token}>
                    PetToken: {petTokenBalance !== null ? Math.round(petTokenBalance).toLocaleString() : '—'}
                </span>
            </div>
        </nav>
    )
}