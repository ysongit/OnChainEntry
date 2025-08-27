import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import CreateEvent from './components/CreateEvent';
import EventList from './components/EventList';
import TicketPurchase from './components/TicketPurchase';
import TicketTransfer from './components/TicketTransfer';
import MyTickets from './components/MyTickets';
import PredictionMarket from './components/PredictionMarket';

import contractABI from './contractABI.json';
import './App.css';

const CONTRACT_ADDRESS = '0xE54D86675Cda71efd8B197A5681Fa32C66197C7e';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        const accounts = await provider.listAccounts();
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(accounts[0]);
      }
    };
    init();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const accounts = await provider.listAccounts();
      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h1 className="navbar-brand">Event Ticketing</h1>
        <div className="navbar-links">
          <Link to="/events" className="nav-link">Events</Link>
          <Link to="/purchase" className="nav-link">Buy Ticket</Link>
          <Link to="/transfer" className="nav-link">Transfer Ticket</Link>
          <Link to="/my-tickets" className="nav-link">My Tickets</Link>
          {isOwner && <Link to="/create-event" className="nav-link">Create Event</Link>}
          <Link to="/prediction-market" className="nav-link">Prediction Market</Link>
          {account ? (
            <span className="nav-account">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
          ) : (
            <button onClick={connectWallet} className="nav-connect">Connect Wallet</button>
          )}
        </div>
      </nav>
     <main className="main-content">
        {contract ? (
          <Routes>
            <Route path="/events" element={<EventList contract={contract} />} />
            <Route path="/purchase" element={<TicketPurchase contract={contract} signer={signer} />} />
            <Route path="/transfer" element={<TicketTransfer contract={contract} />} />
            <Route path="/my-tickets" element={<MyTickets contract={contract} account={account} />} />
            {isOwner && <Route path="/create-event" element={<CreateEvent contract={contract} signer={signer} />} />}
            <Route path="/prediction-market" element={<PredictionMarket contract={contract} signer={signer} isOwner={isOwner} />} />
            <Route path="/" element={<EventList contract={contract} />} /> {/* Default route */}
          </Routes>
        ) : (
          <p className="loading">Please connect your wallet to continue.</p>
        )}
      </main>
    </div>
  );
}

export default App;
