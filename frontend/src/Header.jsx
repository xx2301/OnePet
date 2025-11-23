import React, { useEffect, useState } from 'react'
import styles from './Header.module.css'

export default function Header({ darkMode, setDarkMode }) {
    const [wallet, setWallet] = useState(null);
    const [suiBalance, setSuiBalance] = useState(null);
    const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

    const shorten = (addr) => (addr ? `${addr.slice(0,6)}...${addr.slice(-6)}` : '');

    const fetchBalancesRpc = async (addr) => {
      if (!addr) return null;
      try {
        const res = await fetch(SUI_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sui_getAllBalances', params: [addr] }),
        });
        const data = await res.json();
        const balances = data?.result || [];
        if (!Array.isArray(balances) || balances.length === 0) return null;
        const suiCoin = balances.find((b) => b.coinType && b.coinType.includes('SUI'));
        const target = suiCoin || balances[0];
        const raw = Number(target.totalBalance || 0);
        const human = raw / 1e9;
        return { raw, human };
      } catch (e) {
        console.warn('Failed to fetch balances', e);
        return null;
      }
    };

    useEffect(() => {
      const addr = localStorage.getItem('suiAddress');
      if (addr) {
        setWallet(addr);
        fetchBalancesRpc(addr).then((b) => { if (b) setSuiBalance(b); });
      }
      const onStorage = (e) => {
        if (e.key === 'suiAddress') {
          if (!e.newValue) {
            setWallet(null);
            setSuiBalance(null);
          } else {
            setWallet(e.newValue);
            fetchBalancesRpc(e.newValue).then((b) => { if (b) setSuiBalance(b); });
          }
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, []);

    return (
        <nav className={styles.navbar}>
            <h1 className={styles.logo}>OnePet</h1>
            <div>
                <button className={styles.toggle} onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
                <span className={styles.connect} title={wallet || 'Not connected'}>
                    {wallet ? shorten(wallet) : 'Wallet: Not connected'}
                </span>
                <span className={styles.token}>
                    TOKEN: {suiBalance ? `${suiBalance.human} SUI` : '—'}
                </span>
            </div>
        </nav>
    )
}