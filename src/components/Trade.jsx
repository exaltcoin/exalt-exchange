import { useEffect, useState } from "react";
import Tradingchart from "./Tradingchart";
import OrderBook from "./OrderBook";

function Trade() {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => {
        setCoins(data);
        setSelectedCoin(data[0]);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="trade-layout">
      <div className="trade-sidebar">
        <h2>Live Markets</h2>

        {coins.map((coin) => (
          <div
            key={coin.id}
            className="coin-item"
            onClick={() => setSelectedCoin(coin)}
          >
            <img src={coin.image} alt="" />
            <div>
              <strong>{coin.symbol.toUpperCase()}</strong>
              <p>${coin.current_price}</p>
            </div>

            <span
              className={
                coin.price_change_percentage_24h >= 0
                  ? "green-text"
                  : "red-text"
              }
            >
              {coin.price_change_percentage_24h?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <div className="trade-main">
        {selectedCoin && (
          <>
            <div className="trade-header">
              <div className="trade-title">
                <img src={selectedCoin.image} />
                <div>
                  <h1>{selectedCoin.name}</h1>
                  <p>{selectedCoin.symbol.toUpperCase()}/USDT</p>
                </div>
              </div>
<div style={{ marginTop: "20px", marginBottom: "20px" }}>
  <a
    href="https://pancakeswap.finance/swap?outputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
    target="_blank"
    rel="noreferrer"
    className="buy-btn"
    style={{
      background: "#f0b90b",
      color: "#000",
      padding: "14px 22px",
      borderRadius: "10px",
      textDecoration: "none",
      fontWeight: "bold",
      display: "inline-block"
    }}
  >
    Buy / Sell EXALT Live
  </a>

  <p
    style={{
      marginTop: "10px",
      color: "#00ff99",
      fontSize: "14px"
    }}
  >
    Live trading powered by PancakeSwap & BNB Smart Chain
  </p>
</div>
              <div className="trade-stats">
                <div>
                  <span>Price</span>
                  <h3>${selectedCoin.current_price}</h3>
                </div>

                <div>
                  <span>24H</span>
                  <h3
                    className={
                      selectedCoin.price_change_percentage_24h >= 0
                        ? "green-text"
                        : "red-text"
                    }
                  >
                    {selectedCoin.price_change_percentage_24h?.toFixed(2)}%
                  </h3>
                </div>

                <div>
                  <span>Volume</span>
                  <h3>
                    $
                    {selectedCoin.total_volume?.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            <Tradingchart coin={selectedCoin} />

            <OrderBook coin={selectedCoin} />
          </>
        )}
      </div>
    </div>
  );
}

export default Trade;