// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EventTicketing is Ownable, ReentrancyGuard {
    // Struct to represent a ticket
    struct Ticket {
        uint256 eventId;
        uint256 ticketId;
        address owner;
        bool isUsed;
        bool isValid;
    }

    // Struct to represent an event
    struct Event {
        string name;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        bool isActive;
        uint256 eventDate;
    }

    // State variables
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(uint256 => Ticket)) public tickets; // eventId => ticketId => Ticket
    uint256 public eventCount;

    // Events for logging
    event EventCreated(uint256 eventId, string name, uint256 ticketPrice, uint256 totalTickets, uint256 eventDate);
    event TicketPurchased(uint256 eventId, uint256 ticketId, address buyer);
    event TicketTransferred(uint256 eventId, uint256 ticketId, address from, address to);
    event TicketUsed(uint256 eventId, uint256 ticketId, address owner);
    event EventCancelled(uint256 eventId);

    // Constructor to set the contract deployer as the owner
    constructor() Ownable(msg.sender) {}

    // Create a new event
    function createEvent(
        string memory _name,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        uint256 _eventDate
    ) external onlyOwner {
        require(_totalTickets > 0, "Must have at least one ticket");
        require(_eventDate > block.timestamp, "Event date must be in the future");

        eventCount++;
        events[eventCount] = Event({
            name: _name,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            isActive: true,
            eventDate: _eventDate
        });

        emit EventCreated(eventCount, _name, _ticketPrice, _totalTickets, _eventDate);
    }

    // Purchase a ticket
    function buyTicket(uint256 _eventId) external payable nonReentrant {
        Event storage eventData = events[_eventId];
        require(eventData.isActive, "Event is not active");
        require(block.timestamp < eventData.eventDate, "Event has already occurred");
        require(eventData.ticketsSold < eventData.totalTickets, "No tickets available");
        require(msg.value >= eventData.ticketPrice, "Insufficient payment");

        eventData.ticketsSold++;
        uint256 ticketId = eventData.ticketsSold;
        tickets[_eventId][ticketId] = Ticket({
            eventId: _eventId,
            ticketId: ticketId,
            owner: msg.sender,
            isUsed: false,
            isValid: true
        });

        emit TicketPurchased(_eventId, ticketId, msg.sender);

        // Refund excess payment
        if (msg.value > eventData.ticketPrice) {
            payable(msg.sender).transfer(msg.value - eventData.ticketPrice);
        }
    }

    // Transfer a ticket to another address
    function transferTicket(uint256 _eventId, uint256 _ticketId, address _to) external {
        Ticket storage ticket = tickets[_eventId][_ticketId];
        require(ticket.owner == msg.sender, "Only ticket owner can transfer");
        require(ticket.isValid, "Ticket is invalid or used");
        require(events[_eventId].isActive, "Event is not active");
        require(_to != address(0), "Invalid recipient");

        ticket.owner = _to;
        emit TicketTransferred(_eventId, _ticketId, msg.sender, _to);
    }

    // Mark a ticket as used (e.g., at event entry)
    function useTicket(uint256 _eventId, uint256 _ticketId) external onlyOwner {
        Ticket storage ticket = tickets[_eventId][_ticketId];
        require(ticket.isValid, "Ticket is invalid");
        require(!ticket.isUsed, "Ticket already used");
        require(events[_eventId].isActive, "Event is not active");

        ticket.isUsed = true;
        ticket.isValid = false;
        emit TicketUsed(_eventId, _ticketId, ticket.owner);
    }

    // Cancel an event
    function cancelEvent(uint256 _eventId) external onlyOwner {
        Event storage eventData = events[_eventId];
        require(eventData.isActive, "Event is already cancelled or inactive");

        eventData.isActive = false;
        emit EventCancelled(_eventId);
    }

    // Withdraw funds from ticket sales
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Get ticket details
    function getTicketDetails(uint256 _eventId, uint256 _ticketId)
        external
        view
        returns (address owner, bool isUsed, bool isValid)
    {
        Ticket storage ticket = tickets[_eventId][_ticketId];
        return (ticket.owner, ticket.isUsed, ticket.isValid);
    }

    // Get event details
    function getEventDetails(uint256 _eventId)
        external
        view
        returns (string memory name, uint256 ticketPrice, uint256 totalTickets, uint256 ticketsSold, bool isActive, uint256 eventDate)
    {
        Event storage eventData = events[_eventId];
        return (
            eventData.name,
            eventData.ticketPrice,
            eventData.totalTickets,
            eventData.ticketsSold,
            eventData.isActive,
            eventData.eventDate
        );
    }
}
