// ConnectWallet.jsx
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { PACKAGE_ID, GLOBAL_STATS_ID } from "./constants";
import ModalInput from "./components/ModalInput";
import styles from "./ConnectWallet.module.css";
import {
  initializeUserAccount,
  getUserObjects
} from "./services/onePetApi";

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
    const objects = data?.result || data?.result?.data || [];
    
    // Fetch detailed info for each object to get type
    if (Array.isArray(objects) && objects.length > 0) {
      const detailedObjects = await Promise.all(
        objects.map(async (obj) => {
          const id = obj?.objectId || obj?.object_id || obj;
          if (typeof id === 'string') {
            const details = await getObjectDetails(id);
            return details;
          }
          return obj;
        })
      );
      return detailedObjects.filter(obj => obj !== null);
    }
    
    return objects;
  } catch (err) {
    console.warn("RPC fetch failed", err);
    return null;
  }
}

async function getObjectDetails(objectId) {
  try {
    const res = await fetch(SUI_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObject",
        params: [objectId, {
          showType: true,
          showContent: true
        }]
      }),
    });
    const data = await res.json();
    return data?.result;
  } catch (e) {
    console.warn("getObjectDetails failed", e);
    return null;
  }
}

// Helper: extract a type string from various RPC object shapes
function getObjectType(obj) {
  if (!obj) return "";
  if (typeof obj === 'string') return obj;
  // Common RPC shapes used in this project
  return obj?.data?.type || obj?.data?.content?.type || obj?.type || obj?.content?.type || "";
}

export default function ConnectWallet() {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [objectsCount, setObjectsCount] = useState(null);
  const [walletDetected, setWalletDetected] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingAddress, setPendingAddress] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [userObjects, setUserObjects] = useState([]);

  useEffect(() => {
    const detectWallet = () => {
      // Check for various wallet implementations
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet ||
        window.suiWallet || window.sui;
      setWalletDetected(!!wallet);

      if (wallet) {
        const stored = localStorage.getItem("suiAddress");
        if (stored) {
          setAddress(stored);
          fetchUserObjects(stored);
        }
      }
    };

    detectWallet();

    // Listen for wallet injection
    const interval = setInterval(detectWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect existing users to PetStats, new users to HomePage
  useEffect(() => {
    if (!address) return;

    const checkExistingUser = async () => {
      try {
        const objs = await getUserObjects(address) || [];
        const hasProfileBadge = Array.isArray(objs) && objs.some(obj =>
          getObjectType(obj).includes('profile_badge::ProfileBadge')
        );
        const hasPetNFT = Array.isArray(objs) && objs.some(obj =>
          getObjectType(obj).includes('pet_stats::PetNFT')
        );
        if (hasProfileBadge && hasPetNFT) {
          navigate('/PetStats');
        } else {
          navigate('/HomePage');
        }
      } catch (err) {
        console.error('Failed to check for existing user:', err);
      }
    };

    checkExistingUser();
  }, [address, navigate]);

  const shorten = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";

  const fetchUserObjects = async (addr) => {
    const objs = await fetchOwnedObjectsRpc(addr);
    if (objs === null) {
      setObjectsCount(null);
      setUserObjects([]);
      return;
    }
    
    setObjectsCount(Array.isArray(objs) ? objs.length : 0);
    setUserObjects(Array.isArray(objs) ? objs : []);
  };

  const resolveAddressFromWallet = async (wallet) => {
    if (!wallet) return null;

    try {
      // Method 1: Try direct properties
      const direct = wallet.account?.address ||
        (wallet.accounts && wallet.accounts[0]) ||
        wallet.selectedAddress;
      if (direct) return direct;

      // Method 2: Try getAccounts
      if (typeof wallet.getAccounts === "function") {
        try {
          const accounts = await wallet.getAccounts();
          if (accounts && accounts.length) return accounts[0];
        } catch (e) {
          console.warn("getAccounts failed", e);
        }
      }

      // Method 3: Try request methods
      if (typeof wallet.request === "function") {
        // Try sui_requestAccounts first
        try {
          const accounts = await wallet.request({
            method: "sui_requestAccounts"
          });
          if (accounts && accounts.length) return accounts[0];
        } catch (e) {
          console.warn("sui_requestAccounts failed", e);
        }

        // Try sui_accounts as fallback
        try {
          const accounts = await wallet.request({
            method: "sui_accounts"
          });
          if (accounts && accounts.length) return accounts[0];
        } catch (e) {
          console.warn("sui_accounts failed", e);
        }
      }

    } catch (e) {
      console.warn("All address resolution methods failed", e);
    }

    return null;
  };

  // checkExistingUser helper removed (logic consolidated in the connect flow)

  const handleInitializeUser = async (username) => {
    if (!pendingAddress) return;

    setIsInitializing(true);
    setStatusMessage("Initializing your account...");

    try {
      // Validate username
      if (username.length < 1 || username.length > 10) {
        throw new Error("Username must be 1-10 characters");
      }

      // Call the initialize function
      await initializeUserAccount(username);

      setStatusMessage("Account initialized successfully! Redirecting...");

      // Store user data
      localStorage.setItem("suiAddress", pendingAddress);
      localStorage.setItem("suiUsername", username);
      localStorage.setItem("suiInitialized", "true");

      setAddress(pendingAddress);
      await fetchUserObjects(pendingAddress);

      // Redirect to home page
      navigate('/HomePage');

    } catch (error) {
      console.error("Initialization failed:", error);
      let errorMsg = error.message;
      
      if (error.message.includes("AlreadyExists")) {
        errorMsg = "User already exists. Please try a different username.";
      } else if (error.message.includes("rejected")) {
        errorMsg = "Transaction was rejected by user.";
      } else if (error.message.includes("insufficient gas")) {
        errorMsg = "Insufficient gas. Please ensure you have enough SUI for gas fees.";
      } else if (error.message.includes("Unexpect transaction format") || error.message.includes("Transaction class")) {
        errorMsg = "Wallet compatibility issue. Please try updating your One Wallet extension.";
      } else if (error.message.includes("All wallet signing methods failed")) {
        errorMsg = "Wallet not compatible. Please ensure One Wallet is installed and up to date.";
      }
      
      setStatusMessage(`Initialization failed: ${errorMsg}`);
    } finally {
      setIsInitializing(false);
      setShowUsernameModal(false);
      setPendingAddress(null);
    }
  };

  const handleConnectWallet = async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    setStatusMessage("");
    
    try {
      const wallet = window.onechainWallet || window.onewallet || window.oneWallet;

      if (!wallet) {
        setStatusMessage("One Wallet not detected. Please install the extension.");
        return;
      }

      // Try to request permissions first (OneWallet requirement)
      if (typeof wallet.requestPermissions === "function") {
        try {
          console.log("Requesting permissions...");
          await wallet.requestPermissions(['viewAccount', 'suggestTransactions']);
          console.log("Permissions requested successfully");
          // Give wallet time to process
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (e) {
          console.error("requestPermissions failed:", e);
          // Continue anyway - some wallets might not need this
        }
      }
      
      // Now get accounts
      let accounts;
      try {
        console.log("Getting accounts...");
        accounts = await wallet.getAccounts();
        console.log("Accounts retrieved:", accounts);
      } catch (e) {
        console.error("getAccounts failed:", e);
        setStatusMessage("Failed to connect. Please make sure you've approved the wallet permissions and try again.");
        setIsConnecting(false);
        return;
      }
      
      const addr = accounts && accounts.length > 0 ? accounts[0] : null;
      
      if (!addr) {
        setStatusMessage("Failed to get address. Please unlock your wallet.");
        return;
      }

      // Inspect objects directly so we can decide where to send the user
      try {
        const objs = await getUserObjects(addr) || [];
        const hasProfileBadge = Array.isArray(objs) && objs.some(o => getObjectType(o).includes('profile_badge::ProfileBadge'));
        const hasPetNFT = Array.isArray(objs) && objs.some(o => getObjectType(o).includes('pet_stats::PetNFT'));

        // If user has both profile badge and at least one PetNFT, go to PetStats.
        // If they have a badge but no pet (existing account without pets), send them to HomePage to adopt.
        // If neither, treat as new user and prompt for username to initialize.
        if (hasProfileBadge && hasPetNFT) {
          localStorage.setItem("suiAddress", addr);
          localStorage.setItem("suiInitialized", "true");
          setAddress(addr);
          fetchUserObjects(addr);
          navigate('/PetStats');
        } else if (hasProfileBadge && !hasPetNFT) {
          localStorage.setItem("suiAddress", addr);
          localStorage.setItem("suiInitialized", "true");
          setAddress(addr);
          fetchUserObjects(addr);
          navigate('/HomePage');
        } else {
          // New user: prompt for username to initialize account
          setPendingAddress(addr);
          setShowUsernameModal(true);
        }
      } catch (err) {
        console.error('Error checking user objects during connect:', err);
        // Fallback: show username modal so user can initialize
        setPendingAddress(addr);
        setShowUsernameModal(true);
      }

    } catch (err) {
      console.error("Connection failed:", err);
      setStatusMessage(`Connection failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
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
    
    // Clear local storage
    localStorage.removeItem("suiAddress");
    localStorage.removeItem("suiUsername");
    localStorage.removeItem("suiInitialized");
    
    // Reset state
    setAddress(null);
    setObjectsCount(null);
    setUserObjects([]);
    setStatusMessage("");
    
    // Update wallet detection
    setWalletDetected(!!(window.onechainWallet || window.onewallet || window.oneWallet));
  };

  // Enhanced wallet event handling
  useEffect(() => {
    const wallet = window.onechainWallet || window.onewallet || window.oneWallet;
    
    const handleAccountsChanged = (accounts) => {
      const addr = Array.isArray(accounts) ? accounts[0] : accounts?.address || null;
      if (!addr) {
        handleDisconnect();
      } else {
        localStorage.setItem("suiAddress", addr);
        setAddress(addr);
        fetchUserObjects(addr);
      }
    };

    // Set up event listeners
    if (wallet && typeof wallet.on === "function") {
      try {
        wallet.on("accountsChanged", handleAccountsChanged);
      } catch (err) {
        console.warn("wallet event subscription failed", err);
      }
    }

    // Polling fallback for wallets without event support
    let pollId = null;
    if (wallet && address) {
      pollId = setInterval(async () => {
        try {
          const current = await resolveAddressFromWallet(wallet);
          const stored = localStorage.getItem("suiAddress");
          
          if (!current && stored) {
            // Wallet disconnected
            handleDisconnect();
          } else if (current && current !== stored) {
            // Account switched
            localStorage.setItem("suiAddress", current);
            setAddress(current);
            fetchUserObjects(current);
          }
        } catch (e) {
          // Ignore permission errors
          if (!e.message?.includes('permission')) {
            console.warn("wallet polling error", e);
          }
        }
      }, 3000);
    }

    // Cleanup
    return () => {
      if (wallet && typeof wallet.off === "function") {
        try {
          wallet.off("accountsChanged", handleAccountsChanged);
        } catch (err) {
          console.warn("wallet.off failed", err);
        }
      }
      if (pollId) clearInterval(pollId);
    };
  }, [address]);

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>Welcome to OnePet</div>

      {statusMessage && (
        <div className={styles.statusMessage} style={{
          color: statusMessage.includes("failed") ? "#ff4444" : "#00ff00",
          marginBottom: "1rem",
          fontSize: "16px",
          textAlign: "center",
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: statusMessage.includes("failed") ? "#ffe6e6" : "#e6ffe6",
          border: `1px solid ${statusMessage.includes("failed") ? "#ff4444" : "#00ff00"}`
        }}>
          {statusMessage}
        </div>
      )}

      <div className={styles.message}>
        {address ? (
          <>
            <div>Connected: <strong>{shorten(address)}</strong></div>
            {objectsCount !== null && objectsCount > 0 && (
              <div style={{ marginTop: 8, fontSize: '18px' }}>
                Game Objects: {objectsCount}
              </div>
            )}
            {userObjects.length > 0 && (
              <div style={{ marginTop: 12, fontSize: '14px', color: '#ccc' }}>
                Found: {userObjects.filter(obj => obj.data?.type?.includes('PetNFT')).length} pets, 
                {userObjects.filter(obj => obj.data?.type?.includes('PlayerInventory')).length} inventory
              </div>
            )}
          </>
        ) : walletDetected ? (
          "Connect your One Wallet to start your pet adventure!"
        ) : (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#ff6b6b", display: "block", marginBottom: "10px" }}>
              One Wallet not detected.
            </span>
            <button
              onClick={() => window.open("https://chrome.google.com/webstore/detail/one-wallet/", "_blank")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              Install One Wallet
            </button>
          </div>
        )}
      </div>

      <Link to="/HomePage">
        <img src="img/cat.png" width="400px" alt="OnePet Cat" />
      </Link>

      <button
        className={styles.connect_wallet_button}
        onClick={address ? handleDisconnect : handleConnectWallet}
        disabled={isInitializing || isConnecting}
        style={{
          opacity: (isInitializing || isConnecting) ? 0.7 : 1,
          cursor: (isInitializing || isConnecting) ? 'not-allowed' : 'pointer'
        }}
      >
        {isInitializing ? "Initializing..." :
          isConnecting ? "Connecting..." :
            address ? "Disconnect Wallet" : "Connect Wallet"}
      </button>

      <ModalInput
        isOpen={showUsernameModal}
        title="Welcome to OnePet!"
        label="Choose your username (1-10 characters):"
        defaultValue=""
        maxLength={10}
        placeholder="Enter username..."
        onSubmit={handleInitializeUser}
        onCancel={() => {
          setShowUsernameModal(false);
          setPendingAddress(null);
          setStatusMessage("");
        }}
        disabled={isInitializing}
        submitText={isInitializing ? "Initializing..." : "Start Adventure"}
      />
    </div>
  );
}