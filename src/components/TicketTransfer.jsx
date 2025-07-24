import React, { useState } from 'react';

function TicketTransfer({ contract }) {
  const [eventId, setEventId] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [status, setStatus] = useState('');

  const transferTicket = async () => {
    try {
      const tx = await contract.transferTicket(eventId, ticketId, toAddress);
      await tx.wait();
      setStatus('Ticket transferred successfully!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="ticket-transfer">
      <h2>Transfer Ticket</h2>
      <input
        type="number"
        placeholder="Event ID"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
      />
      <input
        type="number"
        placeholder="Ticket ID"
        value={ticketId}
        onChange={(e) => setTicketId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Recipient Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      <button onClick={transferTicket}>Transfer Ticket</button>
      <p>{status}</p>
    </div>
  );
}

export default TicketTransfer;