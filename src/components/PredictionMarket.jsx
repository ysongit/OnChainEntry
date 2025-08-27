import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function PredictionMarket({ contract, signer, isOwner }) {
  const [markets, setMarkets] = useState([]);
  const [eventId, setEventId] = useState('');
  const [attendanceThreshold, setAttendanceThreshold] = useState('');
  const [marketId, setMarketId] = useState('');
  const [shares, setShares] = useState('');
  const [isYes, setIsYes] = useState(true);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!contract) return;
      const marketCount = await contract.marketCount();
      const marketList = [];
      for (let i = 1; i <= marketCount; i++) {
        const market = await contract.predictionMarkets(i);
        marketList.push({
          id: i,
          eventId: Number(market.eventId),
          attendanceThreshold: Number(market.attendanceThreshold),
          totalYesShares: Number(market.totalYesShares),
          totalNoShares: Number(market.totalNoShares),
          isSettled: market.isSettled,
          outcome: market.isSettled ? market.outcome : null,
          actualAttendance: Number(market.actualAttendance),
        });
      }
      setMarkets(marketList);
    };
    fetchMarkets();
  }, [contract]);

  const createMarket = async () => {
    if (!eventId || !attendanceThreshold || parseInt(eventId) <= 0 || parseInt(attendanceThreshold) <= 0) {
      setStatus('Please enter valid Event ID and Attendance Threshold');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.createPredictionMarket(eventId, attendanceThreshold);
      await tx.wait();
      setStatus('Prediction market created successfully!');
      setEventId('');
      setAttendanceThreshold('');
    } catch (error) {
      setStatus(error);
    } finally {
      setLoading(false);
    }
  };

  const buyShares = async () => {
    if (!marketId || !shares || parseInt(marketId) <= 0 || parseInt(shares) <= 0) {
      setStatus('Please enter valid Market ID and number of shares');
      return;
    }
    setLoading(true);
    try {
      const cost = ethers.parseEther((0.5 * shares).toString());
      const tx = await contract.buyShares(marketId, isYes, shares, { value: cost });
      await tx.wait();
      setStatus('Shares purchased successfully!');
      setMarketId('');
      setShares('');
    } catch (error) {
      setStatus(`${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const claimShares = async (marketId) => {
    setLoading(true);
    try {
      const tx = await contract.claimShares(marketId);
      await tx.wait();
      setStatus('Payout claimed successfully!');
    } catch (error) {
      setStatus(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-market">
      <h2>Prediction Markets</h2>
      {isOwner && (
        <div className="form-group">
          <h3>Create Prediction Market</h3>
          <input
            type="number"
            placeholder="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Attendance Threshold"
            value={attendanceThreshold}
            onChange={(e) => setAttendanceThreshold(e.target.value)}
          />
          <button onClick={createMarket} disabled={loading}>
            {loading ? 'Creating...' : 'Create Market'}
          </button>
        </div>
      )}
      <div className="form-group">
        <h3>Buy Shares</h3>
        <input
          type="number"
          placeholder="Market ID"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Number of Shares"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />
        <select value={isYes} onChange={(e) => setIsYes(e.target.value === 'true')}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <button onClick={buyShares} disabled={loading}>
          {loading ? 'Purchasing...' : 'Buy Shares'}
        </button>
      </div>
      {status && <p className={status.startsWith('Error') ? 'error' : 'success'}>{status}</p>}
      <h3>Available Markets</h3>
      {markets.length === 0 ? (
        <p className="no-markets">No prediction markets available.</p>
      ) : (
        <div className="market-list">
          {markets.map((market) => (
            <div key={market.id} className="market-item">
              <p><strong>Market ID:</strong> {market.id}</p>
              <p><strong>Event ID:</strong> {market.eventId}</p>
              <p><strong>Attendance Threshold:</strong> {market.attendanceThreshold}</p>
              <p><strong>Total Yes Shares:</strong> {market.totalYesShares}</p>
              <p><strong>Total No Shares:</strong> {market.totalNoShares}</p>
              <p>
                <strong>Status:</strong>{' '}
                {market.isSettled ? (
                  market.outcome ? 'Yes (Settled)' : 'No (Settled)'
                ) : (
                  'Open'
                )}
              </p>
              {market.isSettled && (
                <button onClick={() => claimShares(market.id)} disabled={loading}>
                  {loading ? 'Claiming...' : 'Claim Payout'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PredictionMarket;
