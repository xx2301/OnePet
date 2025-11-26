import { Routes,Route } from "react-router";
import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import HomePage from "./HomePage";
import PetStats from "./PetStats";
import Shop from "./Shop";
import Spin from "./Spin";
import Battle from "./Battle";
export default function App(){
  const [darkMode, setDarkMode] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(100);
  const [inventory, setInventory] = useState([]);
  return (
    <Routes>
      <Route path="/" element={<ConnectWallet />}></Route>
      <Route path="/HomePage" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />}></Route>
      <Route path="/PetStats" element={<PetStats darkMode={darkMode} setDarkMode={setDarkMode} />}></Route>
      <Route path="/Shop" element={<Shop darkMode={darkMode} setDarkMode={setDarkMode} tokenBalance={tokenBalance} setTokenBalance={setTokenBalance} inventory={inventory} setInventory={setInventory}/>}></Route>
      <Route path="/Spin" element={<Spin darkMode={darkMode} setDarkMode={setDarkMode} />}></Route>
      <Route path="/Battle" element={<Battle darkMode={darkMode} setDarkMode={setDarkMode} />}></Route>
    </Routes>
  );
}