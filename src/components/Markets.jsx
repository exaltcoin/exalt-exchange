import { useEffect, useState } from "react";
import "./Markets.css";

function Markets() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => {
        setCoins(data);
      })
      .catch((err) => {
        console.log("API Error:", err);
      });
  }, []);

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="markets-page">
      <div className="top-bar">
        <div>
          <h1>EXALT EXCHANGE</h1>
          <p>Live Global Crypto Market</p>
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
          <h3>Total Coins</h3>
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
              <th>Price</th>
              <th>24H</th>
              <th>Market Cap</th>
              <th>Volume</th>
            </tr>
          </thead>

          <tbody>
            {filteredCoins.map((coin, index) => (
              <tr key={coin.id}>
                <td>{index + 1}</td>

                <td className="coin-info">
                  <img src={coin.image} alt={coin.name} />
                  <div>
                    <span>{coin.name}</span>
                    <small>{coin.symbol.toUpperCase()}</small>
                  </div>
                </td>

                <td>
                  $
                  {coin.current_price?.toLocaleString()}
                </td>

                <td
                  className={
                    coin.price_change_percentage_24h >= 0
                      ? "green-text"
                      : "red-text"
                  }
                >
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </td>

                <td>
                  $
                  {coin.market_cap?.toLocaleString()}
                </td>

                <td>
                  $
                  {coin.total_volume?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Markets;