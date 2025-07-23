import React, { useState, useEffect } from 'react';

function MyTickets({ contract, account }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!contract || !account) return;
      const eventCount = await contract.eventCount();
      const userTickets = [];
      for (let eventId = 1; eventId <= eventCount; eventId++) {
        const event = await contract.getEventDetails(eventId);
        const totalTickets = Number(event[2]);
        for (let ticketId = 1; ticketId <= totalTickets; ticketId++) {
          const ticket = await contract.getTicketDetails(eventId, ticketId);
          if (ticket[0].toLowerCase() === account.toLowerCase()) {
            userTickets.push({
              eventId,
              ticketId,
              eventName: event[0],
              isUsed: ticket[1],
              isValid: ticket[2],
            });
          }
        }
      }
      setTickets(userTickets);
    };
    fetchTickets();
  }, [contract, account]);

  return (
    <div className="my-tickets">
      <h2>My Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets owned.</p>
      ) : (
        tickets.map((ticket) => (
          <div key={`${ticket.eventId}-${ticket.ticketId}`}>
            <h3>{ticket.eventName}</h3>
            <p>Ticket ID: {ticket.ticketId}</p>
            <p>Status: {ticket.isValid ? (ticket.isUsed ? 'Used' : 'Valid') : 'Invalid'}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default MyTickets;