import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import "./P2P.css";

function P2P() {
  const { t } = useI18n();

  const API_BASE =
    import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

  const [orders, setOrders] = useState([]);
  const [type, setType] = useState("sell");
  const [asset, setAsset] = useState("EXALT");
  const [fiat, setFiat] = useState("USD");
  const [country, setCountry] = useState("United States");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState(null);

  const [filterType, setFilterType] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  const countries = [
    "Kuwait", "Pakistan", "UAE", "Saudi Arabia", "Oman", "Qatar", "Bahrain",
    "India", "Turkey", "United Kingdom", "United States", "Canada", "Australia",
    "Germany", "France", "China", "Japan", "Nigeria", "Philippines", "Vietnam"
  ];

  const assets = ["EXALT", "USDT", "BTC", "ETH", "BNB", "TRX", "SOL", "XRP", "DOGE", "LTC", "ADA", "AVAX", "TON", "LINK"];

  const fiats = ["USD", "KWD", "PKR", "AED", "SAR", "OMR", "QAR", "BHD", "INR", "EUR", "GBP", "TRY", "NGN", "PHP", "MYR", "IDR", "AUD", "CAD", "CNY", "JPY"];

  const paymentMethods = [
    "Bank Transfer", "Cash", "USDT Wallet", "PayPal", "Wise", "Revolut",
    "Western Union", "MoneyGram", "Skrill", "Payoneer", "Apple Pay",
    "Google Pay", "Visa", "MasterCard", "K-Net", "STC Pay", "Mada",
    "JazzCash", "EasyPaisa", "NayaPay", "Sadapay", "Binance Pay",
    "WeChat Pay", "Alipay", "UPI", "Crypto Wallet", "Local Bank", "Mobile Wallet"
  ];

  const countryFlags = {
    Kuwait: "🇰🇼",
    Pakistan: "🇵🇰",
    UAE: "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    Oman: "🇴🇲",
    Qatar: "🇶🇦",
    Bahrain: "🇧🇭",
    India: "🇮🇳",
    Turkey: "🇹🇷",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    France: "🇫🇷",
    China: "🇨🇳",
    Japan: "🇯🇵",
    Nigeria: "🇳🇬",
    Philippines: "🇵🇭",
    Vietnam: "🇻🇳",
  };

  const getTraderInfo = (order, index) => ({
    name: order.traderName || order.sellerName || `${t("trader")} ${index + 1}`,
    verified: order.verified ?? index % 2 === 0,
    online: order.online ?? index % 3 !== 0,
    rating: order.rating || "4.8",
    completionRate: order.completionRate || "98%",
    completedOrders: order.completedOrders || 120 + index * 7,
  });

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/p2p/orders`);
      const data = await response.json();
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.log("P2P load error:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const typeMatch = filterType === "all" || order.type === filterType;
      const countryMatch = filterCountry === "all" || order.country === filterCountry;
      const paymentMatch = filterPayment === "all" || order.paymentMethod === filterPayment;
      return typeMatch && countryMatch && paymentMatch;
    });
  }, [orders, filterType, filterCountry, filterPayment]);

  const createOrder = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?._id && !user?.id) return alert(t("pleaseLoginFirst"));
      if (!price || !amount || !paymentMethod || !walletAddress || !country) {
        return alert(t("fillAllFields"));
      }

      const response = await fetch(`${API_BASE}/api/p2p/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: user._id || user.id,
          asset,
          fiat,
          type,
          price: Number(price),
          amount: Number(amount),
          paymentMethod,
          walletAddress,
          country,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(t("p2pOrderCreated"));
        window.dispatchEvent(new Event("walletUpdated"));
        setPrice("");
        setAmount("");
        setPaymentMethod("");
        setWalletAddress("");
        loadOrders();
      } else {
        alert(data.message || t("failed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?._id && !user?.id) return alert(t("pleaseLoginFirst"));

      const response = await fetch(`${API_BASE}/api/p2p/${orderId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, buyerId: user._id || user.id }),
      });

      const data = await response.json();

      if (data.success) {
        alert(t("tradeStartedSuccessfully"));
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || t("tradeFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const markPaid = async (orderId) => {
    try {
      if (!paymentProofFile) return alert(t("uploadPaymentProof"));

      const formData = new FormData();
      formData.append("proof", paymentProofFile);

      const response = await fetch(`${API_BASE}/api/p2p/${orderId}/paid`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(t("paymentSubmitted"));
        window.dispatchEvent(new Event("walletUpdated"));
        setPaymentProofFile(null);
        loadOrders();
      } else {
        alert(data.message || t("failed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const releaseOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/p2p/${orderId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        alert(t("tradeCompletedSuccessfully"));
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || t("releaseFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/p2p/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        alert(t("orderCancelledRefunded"));
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || t("cancelFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const statusText = (status) => {
    if (status === "open") return t("open");
    if (status === "matched") return t("inTrade");
    if (status === "paid") return t("paymentSent");
    if (status === "released") return t("completed");
    if (status === "cancelled") return t("cancelled");
    return status || t("open");
  };

  return (
    <div className="p2p-page">
      <div className="p2p-hero">
        <div>
          <h1>{t("globalP2pTrading")}</h1>
          <p>{t("p2pSubtitle")}</p>
        </div>
        <div className="p2p-hero-badge">{t("escrowReady")}</div>
      </div>

      <div className="p2p-stats">
        <div><span>{t("totalOrders")}</span><strong>{orders.length}</strong></div>
        <div><span>{t("openOrders")}</span><strong>{orders.filter((o) => o.status === "open").length}</strong></div>
        <div><span>{t("inEscrow")}</span><strong>{orders.filter((o) => o.status === "matched" || o.status === "paid").length}</strong></div>
      </div>

      <div className="p2p-card">
        <h2>{t("createP2pAd")}</h2>

        <div className="p2p-form">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="sell">{t("sell").toUpperCase()}</option>
            <option value="buy">{t("buy").toUpperCase()}</option>
          </select>

          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            {assets.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={fiat} onChange={(e) => setFiat(e.target.value)}>
            {fiats.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((item) => (
              <option key={item} value={item}>
                {countryFlags[item] || "🌍"} {item}
              </option>
            ))}
          </select>

          <input placeholder={t("price")} value={price} onChange={(e) => setPrice(e.target.value)} />
          <input placeholder={t("amount")} value={amount} onChange={(e) => setAmount(e.target.value)} />

          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">{t("selectPaymentMethod")}</option>
            {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <input
            placeholder={t("walletAddress")}
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />

          <button className="p2p-main-btn" onClick={createOrder}>
            {t("createP2pAd")}
          </button>
        </div>
      </div>

      <div className="p2p-card">
        <div className="p2p-section-head">
          <h2>{t("liveGlobalAds")}</h2>

          <div className="p2p-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">{t("allTypes")}</option>
              <option value="buy">{t("buy")}</option>
              <option value="sell">{t("sell")}</option>
            </select>

            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="all">{t("allCountries")}</option>
              {countries.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">{t("allPayments")}</option>
              {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p2p-empty">{t("noP2pAdsFound")}</div>
        ) : (
          <div className="p2p-table-wrap">
            <table className="p2p-table">
              <thead>
                <tr>
                  <th>{t("trader")}</th>
                  <th>{t("type")}</th>
                  <th>{t("asset")}</th>
                  <th>{t("country")}</th>
                  <th>{t("price")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("payment")}</th>
                  <th>{t("escrow")}</th>
                  <th>{t("status")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order, index) => {
                  const trader = getTraderInfo(order, index);

                  return (
                    <tr key={order._id || index}>
                      <td>
                        <div className="trader-box">
                          <div className="trader-avatar">
                            {trader.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="trader-name">
                              {trader.name}
                              {trader.verified && <span className="verified-badge">✔</span>}
                            </div>

                            <div className="trader-meta">
                              <span className={trader.online ? "online-status" : "offline-status"}>
                                <span className={trader.online ? "online-dot" : "offline-dot"}></span>
                                {trader.online ? t("online") : t("offline")}
                              </span>
                              <span className="rating-badge">⭐ {trader.rating}</span>
                              <span className="completion-badge">{trader.completionRate}</span>
                            </div>

                            <div className="trader-orders">
                              <span className="orders-badge">{trader.completedOrders} {t("orders")}</span>
                              {trader.verified && (
                                <span className="merchant-badge">✔ {t("verifiedMerchant")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={order.type === "sell" ? "sell-badge" : "buy-badge"}>
                          {order.type === "buy" ? t("buy").toUpperCase() : t("sell").toUpperCase()}
                        </span>
                      </td>

                      <td>{order.asset || "EXALT"}</td>

                      <td>
                        <span className="country-badge">
                          {countryFlags[order.country] || "🌍"} {order.country || t("global")}
                        </span>
                      </td>

                      <td>{order.price} {order.fiat}</td>
                      <td>{order.amount}</td>
                      <td>{order.paymentMethod}</td>

                      <td>
                        <span className={order.status === "open" ? "escrow-waiting-badge" : "escrow-active-badge"}>
                          {order.status === "open" ? t("waitingEscrow") : t("escrowActive")}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge status-${order.status || "open"}`}>
                          {statusText(order.status)}
                        </span>
                      </td>

                      <td className="p2p-actions">
                        {order.status === "open" && (
                          <>
                            <button className="accept-btn" onClick={() => acceptOrder(order._id)}>
                              {t("accept")}
                            </button>
                            <button className="cancel-btn" onClick={() => cancelOrder(order._id)}>
                              {t("cancel")}
                            </button>
                          </>
                        )}

                        {order.status === "matched" && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) setPaymentProofFile(e.target.files[0]);
                              }}
                            />
                            <button className="paid-btn" onClick={() => markPaid(order._id)}>
                              {t("markPaid")}
                            </button>
                          </>
                        )}

                        {order.status === "paid" && (
                          <button className="release-btn" onClick={() => releaseOrder(order._id)}>
                            {t("release")}
                          </button>
                        )}

                        {order.status === "released" && (
                          <span className="done-text">{t("completed")}</span>
                        )}

                        {order.status === "cancelled" && (
                          <span className="done-text">{t("cancelled")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p2p-card">
        <h2>{t("p2pSecurity")}</h2>
        <div className="security-grid">
          <p>{t("p2pSecurity1")}</p>
          <p>{t("p2pSecurity2")}</p>
          <p>{t("p2pSecurity3")}</p>
          <p>{t("p2pSecurity4")}</p>
          <p>{t("p2pSecurity5")}</p>
          <p>{t("p2pSecurity6")}</p>
        </div>
      </div>
    </div>
  );
}

export default P2P;