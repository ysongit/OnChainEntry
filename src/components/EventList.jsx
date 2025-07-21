import React, { useState, useEffect } from 'react';

function EventList({ contract }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventCount = await contract.eventCount();
      const eventList = [];
      for (let i = 1; i <= eventCount; i++) {
        const event = await contract.getEventDetails(i);
        eventList.push({
          id: i,
          name: event[0],
          ticketPrice: ethers.formatEther(event[1]),
          totalTickets: Number(event[2]),
          ticketsSold: Number(event[3]),
          isActive: event[4],
          eventDate: new Date(Number(event[5]) * 1000).toLocaleString(),
        });
      }
      setEvents(eventList);
    };
    if (contract) fetchEvents();
  }, [contract]);

  return (
    <div className="event-list">
      <h2>Events</h2>
      {events.map((event) => (
        <div key={event.id}>
          <h3>{event.name}</h3>
          <p>Price: {event.ticketPrice} ETH</p>
          <p>Tickets: {event.ticketsSold}/{event.totalTickets}</p>
          <p>Date: {event.eventDate}</p>
          <p>Status: {event.isActive ? 'Active' : 'Inactive'}</p>
        </div>
      ))}
    </div>
  );
}

export default EventList;
