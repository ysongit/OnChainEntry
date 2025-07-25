import React, { useState } from 'react';
import { ethers } from 'ethers';

function CreateEvent({ contract, signer }) {
  const [name, setName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [status, setStatus] = useState('');

  const createEvent = async () => {
    try {
      // Convert ticket price to wei (assuming input is in ETH)
      const priceInWei = ethers.parseEther(ticketPrice);
      // Convert event date to Unix timestamp (assuming input is a date string like "2025-12-31T18:00")
      const date = new Date(eventDate).getTime() / 1000;

      const tx = await contract.createEvent(name, priceInWei, totalTickets, date);
      await tx.wait();
      setStatus('Event created successfully!');
      // Reset form
      setName('');
      setTicketPrice('');
      setTotalTickets('');
      setEventDate('');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="create-event">
      <h2>Create New Event</h2>
      <input
        type="text"
        placeholder="Event Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Ticket Price (ETH)"
        value={ticketPrice}
        onChange={(e) => setTicketPrice(e.target.value)}
      />
      <input
        type="number"
        placeholder="Total Tickets"
        value={totalTickets}
        onChange={(e) => setTotalTickets(e.target.value)}
      />
      <input
        type="datetime-local"
        placeholder="Event Date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />
      <button onClick={createEvent}>Create Event</button>
      <p>{status}</p>
    </div>
  );
}

export default CreateEvent;
