// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicketing is Ownable {
    struct Event {
        string name;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        bool isActive;
        uint256 eventDate;
        mapping(address => uint256[]) tickets; // Tickets owned by each address
    }

    struct PredictionMarket {
        uint256 eventId;
        uint256 attendanceThreshold;
        uint256 totalYesShares;
        uint256 totalNoShares;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        bool isSettled;
        bool outcome; // True if attendance >= threshold, False otherwise
        uint256 actualAttendance;
        uint256 totalPool; // Total ETH in the market
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => PredictionMarket) public predictionMarkets;
    uint256 public eventCount;
    uint256 public marketCount;

    event EventCreated(uint256 eventId, string name, uint256 ticketPrice, uint256 totalTickets, uint256 eventDate);
    event TicketPurchased(uint256 eventId, uint256 ticketId, address buyer);
    event TicketTransferred(uint256 eventId, uint256 ticketId, address from, address to);
    event PredictionMarketCreated(uint256 marketId, uint256 eventId, uint256 attendanceThreshold);
    event SharesPurchased(uint256 marketId, address buyer, bool isYes, uint256 shares, uint256 cost);
    event MarketSettled(uint256 marketId, bool outcome, uint256 actualAttendance);

    constructor() Ownable(msg.sender) {}

    function createEvent(string memory _name, uint256 _ticketPrice, uint256 _totalTickets, uint256 _eventDate) public onlyOwner {
        require(_eventDate > block.timestamp, "Event date must be in the future");
        eventCount++;
        Event storage newEvent = events[eventCount];
        newEvent.name = _name;
        newEvent.ticketPrice = _ticketPrice;
        newEvent.totalTickets = _totalTickets;
        newEvent.ticketsSold = 0;
        newEvent.isActive = true;
        newEvent.eventDate = _eventDate;
        emit EventCreated(eventCount, _name, _ticketPrice, _totalTickets, _eventDate);
    }

    function buyTicket(uint256 _eventId) public payable {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        require(evt.isActive, "Event is not active");
        require(evt.ticketsSold < evt.totalTickets, "No tickets available");
        require(msg.value >= evt.ticketPrice, "Insufficient payment");
        evt.ticketsSold++;
        evt.tickets[msg.sender].push(evt.ticketsSold);
        emit TicketPurchased(_eventId, evt.ticketsSold, msg.sender);
        if (msg.value > evt.ticketPrice) {
            payable(msg.sender).transfer(msg.value - evt.ticketPrice);
        }
    }

    function transferTicket(uint256 _eventId, uint256 _ticketId, address _to) public {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        require(evt.isActive, "Event is not active");
        require(_ticketId > 0 && _ticketId <= evt.ticketsSold, "Invalid ticket ID");
        uint256[] storage senderTickets = evt.tickets[msg.sender];
        bool found = false;
        for (uint256 i = 0; i < senderTickets.length; i++) {
            if (senderTickets[i] == _ticketId) {
                senderTickets[i] = senderTickets[senderTickets.length - 1];
                senderTickets.pop();
                evt.tickets[_to].push(_ticketId);
                found = true;
                break;
            }
        }
        require(found, "Ticket not owned by sender");
        emit TicketTransferred(_eventId, _ticketId, msg.sender, _to);
    }

    function getEventDetails(uint256 _eventId) public view returns (string memory, uint256, uint256, uint256, bool, uint256) {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        return (evt.name, evt.ticketPrice, evt.totalTickets, evt.ticketsSold, evt.isActive, evt.eventDate);
    }

    function getTicketDetails(uint256 _eventId, uint256 _ticketId) public view returns (address, bool, bool) {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        require(_ticketId > 0 && _ticketId <= evt.ticketsSold, "Invalid ticket ID");
        address owner;
        for (uint256 i = 1; i <= eventCount; i++) {
            for (uint256 j = 0; j < evt.tickets[msg.sender].length; j++) {
                if (evt.tickets[msg.sender][j] == _ticketId) {
                    owner = msg.sender;
                    break;
                }
            }
        }
        return (owner, false, true); // Simplified; assumes tickets are valid and unused
    }

    function createPredictionMarket(uint256 _eventId, uint256 _attendanceThreshold) public onlyOwner {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        require(_attendanceThreshold > 0, "Attendance threshold must be positive");
        marketCount++;
        PredictionMarket storage market = predictionMarkets[marketCount];
        market.eventId = _eventId;
        market.attendanceThreshold = _attendanceThreshold;
        market.isSettled = false;
        emit PredictionMarketCreated(marketCount, _eventId, _attendanceThreshold);
    }

    function buyShares(uint256 _marketId, bool _isYes, uint256 _shares) public payable {
        require(_marketId > 0 && _marketId <= marketCount, "Invalid market ID");
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(!market.isSettled, "Market is settled");
        require(events[market.eventId].isActive, "Event is not active");
        require(_shares > 0, "Must buy at least one share");
        uint256 cost = _shares * 0.5 ether; // Fixed price of 0.5 ETH per share for simplicity
        require(msg.value >= cost, "Insufficient payment");

        if (_isYes) {
            market.yesShares[msg.sender] += _shares;
            market.totalYesShares += _shares;
        } else {
            market.noShares[msg.sender] += _shares;
            market.totalNoShares += _shares;
        }
        market.totalPool += cost;
        emit SharesPurchased(_marketId, msg.sender, _isYes, _shares, cost);

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function settleMarket(uint256 _marketId, uint256 _actualAttendance) public onlyOwner {
        require(_marketId > 0 && _marketId <= marketCount, "Invalid market ID");
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(!market.isSettled, "Market already settled");
        require(events[market.eventId].eventDate < block.timestamp, "Event not yet occurred");

        market.actualAttendance = _actualAttendance;
        market.outcome = _actualAttendance >= market.attendanceThreshold;
        market.isSettled = true;

        uint256 totalShares = market.totalYesShares + market.totalNoShares;
        if (totalShares == 0) return; // No shares bought, no payouts

        uint256 payoutPerShare = market.totalPool / (market.outcome ? market.totalYesShares : market.totalNoShares);
        // Payouts are handled via claimShares function to avoid gas limit issues
        emit MarketSettled(_marketId, market.outcome, _actualAttendance);
    }

    function claimShares(uint256 _marketId) public {
        require(_marketId > 0 && _marketId <= marketCount, "Invalid market ID");
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(market.isSettled, "Market not settled");

        uint256 shares = market.outcome ? market.yesShares[msg.sender] : market.noShares[msg.sender];
        require(shares > 0, "No shares to claim");

        uint256 payoutPerShare = market.totalPool / (market.outcome ? market.totalYesShares : market.totalNoShares);
        uint256 payout = shares * payoutPerShare;

        if (market.outcome) {
            market.yesShares[msg.sender] = 0;
        } else {
            market.noShares[msg.sender] = 0;
        }

        payable(msg.sender).transfer(payout);
    }
}