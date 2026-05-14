import { useEffect, useState } from "react";
import "./Markets.css";

function Markets() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");

 useEffect(() => {
  fetch("https://exalt-exchange-backend.onrender.com/api/market/coins")
    .then((res) => res.json())
    .then((data) => {
      const uniqueCoins = Array.from(
        new Map(
          (data.coins || []).map((coin) => [
            coin.contract || coin.symbol,
            coin
          ])
        ).values()
      );

      setCoins(uniqueCoins);
    })
    .catch((err) => {
      console.log("API Error:", err);
    });
}, []);

  const filteredCoins = coins.filter((coin) =>
    (coin.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (coin.symbol || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="markets-page">
      <div className="top-bar">
        <div>
          <h1>EXALT EXCHANGE</h1>
          <p>Approved Listed Coins</p>
        </div>

        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="market-stats">
        <div className="stat-card">
          <h3>Total Listed Coins</h3>
          <p>{filteredCoins.length}</p>
        </div>

        <div className="stat-card">
          <h3>Market Status</h3>
          <p className="green-text">LIVE</p>
        </div>

        <div className="stat-card">
          <h3>Exchange</h3>
          <p>EXALTEXCHANGE</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="market-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th>Chain</th>
              <th>Contract</th>
              <th>Status</th>
              <th>Website</th>
              <th>Buy</th>
            </tr>
          </thead>

          <tbody>
            {filteredCoins.length === 0 ? (
              <tr>
                <td colSpan="7">No approved coins found</td>
              </tr>
            ) : (
              filteredCoins.map((coin, index) => (
                <tr key={coin._id || index}>
                  <td>{index + 1}</td>

                  <td>
                    <div className="coin-info">
                      <div>
                        <span>{coin.name}</span>
                        <small>{coin.symbol}</small>
                      </div>
                    </div>
                  </td>

                  <td>{coin.chain || "BNB Smart Chain"}</td>
                  <td>{coin.contract}</td>
                  <td className="green-text">{coin.status}</td>

                  <td>
                    {coin.website ? (
                      <a href={coin.website} target="_blank" rel="noreferrer">
                        Website
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td>
                    {coin.buy ? (
                      <a href={coin.buy} target="_blank" rel="noreferrer">
                        Buy
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Markets;