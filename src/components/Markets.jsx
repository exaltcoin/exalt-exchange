import { useEffect, useState } from "react";
import API_BASE_URL from "../api";
import { socket } from "../api";
import "./Markets.css";

function Markets() {
  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [search, setSearch] = useState("");

 useEffect(() => {
 fetch(`${API_BASE_URL}/api/listings`)
    .then((res) => res.json())
    .then((data) => {
      const approvedCoins = (data.listings || []).filter(
  (coin) => (coin.status || "").toLowerCase() === "approved"
);
console.log("APPROVED COINS:", approvedCoins);
setCoins(approvedCoins);
    })
    .catch((err) => {
      console.log("API Error:", err);
    });
}, []);
useEffect(() => {
  socket.on("marketUpdate", (data) => {
    setLivePrices((prev) => ({
      ...prev,
      [data.symbol]: data.price,
    }));
  });

  return () => {
    socket.off("marketUpdate");
  };
}, []);
 const filteredCoins = coins.filter((coin) =>
  (coin.coinName || "").toLowerCase().includes(search.toLowerCase()) ||
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
              <th>Logo</th>
              <th>Price</th>
                <th>Market Cap</th>
              <th>Liquidity</th>
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
  <img
    src={coin.logo}
    alt="logo"
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      objectFit: "cover"
    }}
  />
</td>
                  <td>
                    <div className="coin-info">
                      <div>
                        <span>{coin.coinName}</span>
                        <small>{coin.symbol}</small>
                      </div>
                    </div>
                  </td>
                    <td>
  $
  {(
    livePrices[`${coin.symbol?.toUpperCase()}USDT`] ||
    Number(String(coin.price || "0").replace("$", ""))
  ).toFixed(4)}
</td>
                        <td>{coin.marketCap || "$0"}</td>
                       <td>{coin.liquidity || "$0"}</td>
                  <td>{coin.chain || "BNB Smart Chain"}</td>
                  <td>{coin.contractAddress}</td>
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