import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EventList from './components/EventList';
import TicketPurchase from './components/TicketPurchase';
import TicketTransfer from './components/TicketTransfer';
import MyTickets from './components/MyTickets';
import contractABI from './contractABI.json';
import './App.css';

const CONTRACT_ADDRESS = '0xE54D86675Cda71efd8B197A5681Fa32C66197C7e';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

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
      <h1>Event Ticketing DApp</h1>
      {account ? (
        <p>Connected: {account.address}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      {contract && (
        <>
          <EventList contract={contract} />
          <TicketPurchase contract={contract} signer={signer} />
          <TicketTransfer contract={contract} />
          <MyTickets contract={contract} account={account} />
        </>
      )}
    </div>
  );
}

export default App;
