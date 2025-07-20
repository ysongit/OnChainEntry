import React, { useState } from 'react';
import { ethers } from 'ethers';

function TicketPurchase({ contract, signer }) {
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState('');

  const buyTicket = async () => {
    try {
      const event = await contract.getEventDetails(eventId);
      const ticketPrice = event[1];
      const tx = await contract.buyTicket(eventId, {
        value: ticketPrice,
      });
      await tx.wait();
      setStatus('Ticket purchased successfully!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="ticket-purchase">
      <h2>Buy Ticket</h2>
      <input
        type="number"
        placeholder="Event ID"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
      />
      <button onClick={buyTicket}>Buy Ticket</button>
      <p>{status}</p>
    </div>
  );
}

export default TicketPurchase;
