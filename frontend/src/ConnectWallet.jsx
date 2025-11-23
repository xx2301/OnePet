import { Link } from "react-router";
import { useState, useEffect } from "react";
import styles from "./ConnectWallet.module.css";

const SUI_RPC = "https://rpc-testnet.onelabs.cc:443";

async function fetchOwnedObjectsRpc(addr) {
  try {
    const res = await fetch(SUI_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObjectsOwnedByAddress",
        params: [addr],
      }),
    });
    const data = await res.json();
    return data?.result || data?.result?.data || [];
  } catch (err) {
    console.warn("RPC fetch failed", err);
    return null;
  }
}

export default function ConnectWallet() {
  const [address, setAddress] = useState(null);
  const [objectsCount, setObjectsCount] = useState(null);
  const [walletDetected, setWalletDetected] = useState(false);

  // Poll for One Wallet injection up to 10 seconds
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.onechainWallet || window.onewallet || window.oneWallet) {
        setWalletDetected(true);
        clearInterval(interval);
        const stored = localStorage.getItem("suiAddress");
        if (stored) {
          setAddress(stored);
          fetchOwnedObjects(stored);
        }
      } else {
        attempts++;
        if (attempts > 20) {
          clearInterval(interval);
          setWalletDetected(false);
          console.warn("One Wallet not detected after waiting.");
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const shorten = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";

  const fetchOwnedObjects = async (addr) => {
    const objs = await fetchOwnedObjectsRpc(addr);
    if (objs === null) return setObjectsCount(null);
    setObjectsCount(Array.isArray(objs) ? objs.length : 0);
  };

  const resolveAddressFromWallet = async (wallet) => {
    if (!wallet) return null;
    // common direct properties
    const direct = wallet.account?.address || (wallet.accounts && wallet.accounts[0]) || wallet.selectedAddress;
    if (direct) return direct;

    // try getAccounts if available
    try {
      if (typeof wallet.getAccounts === "function") {
        const accounts = await wallet.getAccounts();
        if (accounts && accounts.length) return accounts[0];
      }
    } catch (e) {
      console.warn("getAccounts failed", e);
    }

    // try common request methods that return account lists
    try {
      if (typeof wallet.request === "function") {
        const res1 = await wallet.request({ method: "sui_accounts" }).catch(() => null);
        if (res1 && res1.length) return res1[0];
        const res2 = await wallet.request({ method: "sui_requestAccounts" }).catch(() => null);
        if (res2 && res2.length) return res2[0];
        const res3 = await wallet.request({ method: "eth_requestAccounts" }).catch(() => null);
        if (res3 && res3.length) return res3[0];
      }
    } catch (e) {
      console.warn("request for accounts failed", e);
    }

    return null;
  };

  const handleDisconnect = async () => {
    try {
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
      if (wallet && typeof wallet.disconnect === "function") {
        try {
          await wallet.disconnect();
        } catch (e) {
          console.warn("wallet.disconnect failed", e);
        }
      }
    } catch (e) {
      console.warn("disconnect handler error", e);
    }
    localStorage.removeItem("suiAddress");
    setAddress(null);
    setObjectsCount(null);
    // Keep walletDetected state in sync
    setWalletDetected(!!(window.onechainWallet || window.onewallet || window.oneWallet));
  };

  // Listen for wallet account changes and cross-tab storage changes
  useEffect(() => {
    const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
    const onStorage = (e) => {
      if (e.key === "suiAddress") {
        if (!e.newValue) {
          setAddress(null);
          setObjectsCount(null);
        } else {
          setAddress(e.newValue);
          fetchOwnedObjects(e.newValue);
        }
      }
    };

    if (wallet && typeof wallet.on === "function") {
      try {
        wallet.on("accountsChanged", (accounts) => {
          const addr = Array.isArray(accounts) ? accounts[0] : accounts?.address || null;
          if (!addr) {
            handleDisconnect();
          } else {
            localStorage.setItem("suiAddress", addr);
            setAddress(addr);
            fetchOwnedObjects(addr);
          }
        });
      } catch (err) {
        console.warn("wallet event subscription failed", err);
      }
    }

    // Poll wallet state as a fallback for wallets that don't emit events
    let pollId = null;
    try {
      if (wallet) {
        pollId = setInterval(async () => {
          try {
            const current = await resolveAddressFromWallet(wallet);
            const stored = localStorage.getItem("suiAddress");
            if (!current && stored) {
              // Wallet was disconnected externally
              handleDisconnect();
            } else if (current && current !== stored) {
              // Account switched externally
              localStorage.setItem("suiAddress", current);
              setAddress(current);
              fetchOwnedObjects(current);
            }
          } catch (e) {
            console.warn("wallet polling error", e);
          }
        }, 2000);
      }
    } catch (e) {
      console.warn("failed to start wallet polling", e);
    }

    window.addEventListener("storage", onStorage);
    return () => {
      try {
        if (wallet && typeof wallet.off === "function") wallet.off("accountsChanged");
      } catch (err) {
        console.warn("wallet.off failed", err);
      }
      if (pollId) clearInterval(pollId);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
      if (!wallet) {
        alert("One Wallet not detected. Please install and enable One Wallet extension.");
        return;
      }

      // Connect to One Wallet using whichever API is available
      if (typeof wallet.connect === "function") {
        await wallet.connect();
      } else if (typeof wallet.request === "function") {
        try {
          await wallet.request({ method: "sui_connect" });
        } catch (err) {
          console.warn(err);
        }
      }

      const addr = await resolveAddressFromWallet(wallet);

      if (!addr) {
        alert("Failed to obtain account address from One Wallet.");
        return;
      }

      localStorage.setItem("suiAddress", addr);
      setAddress(addr);
      await fetchOwnedObjects(addr);
      alert("Connected: " + shorten(addr));
      window.location.href = "/HomePage";
    } catch (err) {
      console.error(err);
      alert("Connection failed: " + (err?.message || err));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>Welcome to OnePet</div>
      <div className={styles.message}>
        {address ? (
          <>
            Connected: <strong>{shorten(address)}</strong>
            {objectsCount !== null && (
              <div style={{ marginTop: 8 }}>Owned objects: {objectsCount}</div>
            )}
          </>
        ) : walletDetected ? (
          "Connect your One Wallet to start your pet adventure!"
        ) : (
          <span style={{ color: "red" }}>
            One Wallet not detected. Please install or enable it.
          </span>
        )}
      </div>
      <Link to="/HomePage">
        <img src="img/cat.png" width="400px" alt="cat" />
      </Link>
      <button
        className={styles.connect_wallet_button}
        onClick={address ? handleDisconnect : handleConnectWallet}
      >
        {address ? "Disconnect" : "Connect Wallet"}
      </button>
    </div>
  );
}
