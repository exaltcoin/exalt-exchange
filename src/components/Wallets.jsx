import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QRCodeCanvas } from "qrcode.react";

import exaltLogo from "../assets/exalt-coin.png";
import PageShell from "./PageShell";
import { useI18n } from "../i18n/index.js";
import "./Wallets.css";

const API_FALLBACK =
  "https://exalt-real-backend-6b6v.onrender.com";

const normalizeApiBase = (value) => {
  const base = String(value || API_FALLBACK)
    .trim()
    .replace(/\/+$/, "");

  return base.endsWith("/api")
    ? base.slice(0, -4)
    : base;
};

const COIN_LOGOS = {
  BTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  ETH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  USDT:
    "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  BNB: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  EXALT: exaltLogo,
  SOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  XRP: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
  DOGE:
    "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png",
  TRX: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
  ADA: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
  AVAX:
    "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  LINK:
    "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png",
  LTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
  DOT: "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png",
  SHIB:
    "https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png",
};

const DEFAULT_ASSETS = [
  {
    symbol: "USDT",
    name: "Tether USD",
    balance: 0,
    price: 1,
    change24h: 0,
    network: "BEP20",
  },
  {
    symbol: "EXALT",
    name: "Exalt Coin",
    balance: 0,
    price: 0.0003,
    change24h: 0,
    network: "BEP20",
  },
  {
    symbol: "BNB",
    name: "BNB",
    balance: 0,
    price: 650,
    change24h: 0,
    network: "BEP20",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    balance: 0,
    price: 103000,
    change24h: 0,
    network: "BTC",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: 0,
    price: 2400,
    change24h: 0,
    network: "ERC20",
  },
  {
    symbol: "SOL",
    name: "Solana",
    balance: 0,
    price: 150,
    change24h: 0,
    network: "SOL",
  },
  {
    symbol: "XRP",
    name: "XRP",
    balance: 0,
    price: 0.55,
    change24h: 0,
    network: "XRP",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    balance: 0,
    price: 0.12,
    change24h: 0,
    network: "DOGE",
  },
  {
    symbol: "TRX",
    name: "TRON",
    balance: 0,
    price: 0.13,
    change24h: 0,
    network: "TRC20",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    balance: 0,
    price: 0.45,
    change24h: 0,
    network: "ADA",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    balance: 0,
    price: 25,
    change24h: 0,
    network: "AVAX",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    balance: 0,
    price: 14,
    change24h: 0,
    network: "ERC20",
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    balance: 0,
    price: 80,
    change24h: 0,
    network: "LTC",
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    balance: 0,
    price: 6,
    change24h: 0,
    network: "DOT",
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    balance: 0,
    price: 0.00002,
    change24h: 0,
    network: "ERC20",
  },
];

/*
 * Production میں بہتر طریقہ یہ ہے کہ deposit addresses
 * backend سے user/network کے مطابق آئیں۔
 *
 * فی الحال موجودہ exchange addresses محفوظ رکھے گئے ہیں۔
 */
const FALLBACK_DEPOSIT_ADDRESSES = {
  EXALT: {
    BEP20:
      "0x0Aaa68665517eC192Ae796b42eBc4ab7BbE50C31",
  },

  USDT: {
    BEP20:
      "0x0Aaa68665517eC192Ae796b42eBc4ab7BbE50C31",

    ERC20:
      "0x0Aaa68665517eC192Ae796b42eBc4ab7BbE50C31",

    TRC20:
      "TNYUR7wq97dzRpWLHKCwBR8KMNZJu2N3Qd",
  },

  BNB: {
    BEP20:
     "0x0Aaa68665517eC192Ae796b42eBc4ab7BbE50C31" ,
  },

  ETH: {
    ERC20:
     "0x0Aaa68665517eC192Ae796b42eBc4ab7BbE50C31" ,
  },

  BTC: {
    BTC:
     "bc1q5pwt4zc4rv2rk5xtew8jms65n2h8wscyunt0s0" ,
  },

  TRX: {
    TRC20:
      "TNYUR7wq97dzRpWLHKCwBR8KMNZJu2N3Qd",
  },
};

const API_DEPOSIT_NETWORKS = Object.freeze({
  USDT: ["BEP20"],
  BNB: ["BEP20"],
  EXALT: ["BEP20"],
});

const BANK_INFO = {
  jazzCash:
    import.meta.env.VITE_JAZZCASH_NUMBER ||
    "03001234567",

  easyPaisa:
    import.meta.env.VITE_EASYPAISA_NUMBER ||
    "03001234567",

  accountTitle:
    import.meta.env.VITE_BANK_ACCOUNT_TITLE ||
    "Exalt Exchange",

  iban:
    import.meta.env.VITE_BANK_IBAN ||
    "PK00ABCD1234567890",

  bank:
    import.meta.env.VITE_BANK_NAME ||
    "Meezan Bank",
};

const NETWORK_META = {
  BEP20: {
    minDeposit: 1,
    confirmations: 15,
    fee: 0.8,
    time: "3–10 min",
  },

  ERC20: {
    minDeposit: 10,
    confirmations: 12,
    fee: 5,
    time: "5–20 min",
  },

  TRC20: {
    minDeposit: 1,
    confirmations: 20,
    fee: 1,
    time: "2–10 min",
  },

  BTC: {
    minDeposit: 0.0001,
    confirmations: 2,
    fee: 0.0002,
    time: "10–60 min",
  },
};

const EMPTY_BALANCES = {
  USDT: 0,
  EXALT: 0,
  BNB: 0,
};

const DEFAULT_FAVORITES = [
  "USDT",
  "EXALT",
  "BNB",
];

const readStoredArray = (
  storageKey,
  fallback = []
) => {
  try {
    const parsedValue = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    return Array.isArray(parsedValue)
      ? parsedValue
      : fallback;
  } catch {
    return fallback;
  }
};

function Wallets() {
  const { t } = useI18n();

  const API = useMemo(
    () =>
      normalizeApiBase(
        import.meta.env.VITE_API_URL
      ),
    []
  );

  const [activeTab, setActiveTab] =
    useState("overview");

  const [assetSearch, setAssetSearch] =
    useState("");

  const [hideSmall, setHideSmall] =
    useState(false);

  const [hideBalance, setHideBalance] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [depositSubmitting, setDepositSubmitting] =
    useState(false);

  const [
    withdrawalSubmitting,
    setWithdrawalSubmitting,
  ] = useState(false);

  const [wallets, setWallets] =
    useState(EMPTY_BALANCES);

  const [lockedBalances, setLockedBalances] =
    useState(EMPTY_BALANCES);

  const [walletStats, setWalletStats] =
    useState({
      totalPortfolioUsd: 0,
      todayPnl: 0,
      todayPnlPercent: 0,
      availableBalance: 0,
      lockedBalance: 0,
      inOrders: 0,
      pendingRewards: 0,
      approvedRewards: 0,
      miningRewards: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      walletStatus: "Active",
      securityScore: 86,
    });

  const [assets, setAssets] =
    useState(DEFAULT_ASSETS);

  const [favorites, setFavorites] = useState(
    () => {
      const savedFavorites = readStoredArray(
        "exalt_wallet_favorites",
        DEFAULT_FAVORITES
      );

      return savedFavorites.length
        ? savedFavorites
        : DEFAULT_FAVORITES;
    }
  );

  const [selectedCoin, setSelectedCoin] =
    useState("EXALT");

  const [
    selectedNetwork,
    setSelectedNetwork,
  ] = useState("BEP20");

  const [liveDepositAddress, setLiveDepositAddress] =
    useState("");

  const [depositAddressLoading, setDepositAddressLoading] =
    useState(false);

  const [depositAddressError, setDepositAddressError] =
    useState("");

  const [depositAddressMeta, setDepositAddressMeta] =
    useState(null);

  const [depositForm, setDepositForm] =
    useState({
      senderName: "",
      senderAccount: "",
      amount: "",
      paymentMethod: "EXALT",
      txHash: "",
      memo: "",
    });

  const [withdrawForm, setWithdrawForm] =
    useState({
      amount: "",
      accountName: "",
      accountNumber: "",
      method: "CRYPTO",
      coin: "USDT",
      network: "BEP20",
      memo: "",
    });

  const [addressBook, setAddressBook] =
    useState(() =>
      readStoredArray(
        "exalt_address_book",
        []
      )
    );

  const [history, setHistory] =
    useState([]);

  const translateWithFallback = (
    key,
    fallback,
    namespace = "wallets"
  ) => {
    try {
      const translatedValue = t(key, {
        ns: namespace,
        defaultValue: fallback,
      });

      if (
        translatedValue === undefined ||
        translatedValue === null ||
        translatedValue === key ||
        String(translatedValue).trim() === ""
      ) {
        return fallback;
      }

      return translatedValue;
    } catch (error) {
      console.error(
        `Wallet translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const requestJson = useCallback(
    async (url, options = {}) => {
      const response = await fetch(
        url,
        options
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data?.message ||
            `Request failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
      }

      return data;
    },
    []
  );

  const formatUsd = (value) =>
    `$${Number(value || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const formatAmount = (
    value,
    decimals = 4
  ) => {
    const numericValue = Number(value || 0);

    if (
      !Number.isFinite(numericValue) ||
      numericValue === 0
    ) {
      return "0.0000";
    }

    if (
      numericValue > 0 &&
      numericValue < 0.0001
    ) {
      return numericValue.toFixed(8);
    }

    return numericValue.toLocaleString(
      undefined,
      {
        maximumFractionDigits: decimals,
      }
    );
  };

  const copyText = async (
    text,
    label = "Value"
  ) => {
    if (!text) {
      window.alert(
        translateWithFallback(
          "noAddressAvailable",
          "No address available."
        )
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      window.alert(
        `${label} ${translateWithFallback(
          "copied",
          "copied",
          "common"
        )}`
      );
    } catch (error) {
      console.error(
        "Clipboard copy failed:",
        error
      );

      window.alert(
        translateWithFallback(
          "copyFailed",
          "Copy failed.",
          "common"
        )
      );
    }
  };

  

  const loadDepositAddress = useCallback(async () => {
    const token = localStorage.getItem("token");

    setDepositAddressError("");
    setDepositAddressMeta(null);

    const apiEnabled =
      API_DEPOSIT_NETWORKS[selectedCoin]?.includes(
        selectedNetwork
      );

    if (!apiEnabled || !token) {
      setLiveDepositAddress("");
      setDepositAddressLoading(false);
      return;
    }

    setDepositAddressLoading(true);

    try {
      const data = await requestJson(
        `${API}/api/wallets/deposit-address?coin=${encodeURIComponent(
          selectedCoin
        )}&network=${encodeURIComponent(selectedNetwork)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const address = String(
        data?.data?.address || data?.address || ""
      ).trim();

      if (!data?.success || !address) {
        throw new Error(
          data?.message || "Deposit address is unavailable."
        );
      }

      setLiveDepositAddress(address);
      setDepositAddressMeta(data?.data || data);
    } catch (error) {
      console.error(
        "Live deposit address loading failed:",
        error
      );

      setLiveDepositAddress("");
      setDepositAddressError(
        error?.message || "Unable to load live deposit address."
      );
    } finally {
      setDepositAddressLoading(false);
    }
  }, [
    API,
    requestJson,
    selectedCoin,
    selectedNetwork,
  ]);

  useEffect(() => {
    loadDepositAddress();
  }, [loadDepositAddress]);

 const activeDepositAddress =
  liveDepositAddress ||
  FALLBACK_DEPOSIT_ADDRESSES[selectedCoin]?.[selectedNetwork] ||
  "";

  const defaultNetworkMeta =
    NETWORK_META[selectedNetwork] ||
    NETWORK_META.BEP20;

  const activeNetworkMeta = {
    ...defaultNetworkMeta,
    minDeposit: Number(
      depositAddressMeta?.minimumDeposit ??
        defaultNetworkMeta.minDeposit
    ),
    confirmations: Number(
      depositAddressMeta?.confirmations ??
        defaultNetworkMeta.confirmations
    ),
    time:
      depositAddressMeta?.estimatedArrival ||
      defaultNetworkMeta.time,
  };

  const withdrawFee = useMemo(() => {
    const networkMeta =
      NETWORK_META[withdrawForm.network] ||
      NETWORK_META.BEP20;

    return Number(networkMeta.fee || 0);
  }, [withdrawForm.network]);

  const receiveAmount = useMemo(() => {
    const withdrawalAmount = Number(
      withdrawForm.amount || 0
    );

    if (
      !Number.isFinite(withdrawalAmount) ||
      withdrawalAmount <= 0
    ) {
      return 0;
    }

    return Math.max(
      withdrawalAmount - withdrawFee,
      0
    );
  }, [
    withdrawForm.amount,
    withdrawFee,
  ]);

  const preparedAssets = useMemo(
    () =>
      assets.map((asset) => {
        const balance = Number(
          wallets[asset.symbol] ??
            asset.balance ??
            0
        );

        const price = Number(
          asset.price || 0
        );

        return {
          ...asset,
          balance,
          price,
          valueUsd: balance * price,
          logo:
            COIN_LOGOS[asset.symbol] ||
            asset.logo,
          favorite: favorites.includes(
            asset.symbol
          ),
        };
      }),
    [assets, favorites, wallets]
  );

  const totalPortfolioUsd = useMemo(
    () =>
      preparedAssets.reduce(
        (total, asset) =>
          total +
          Number(asset.valueUsd || 0),
        0
      ),
    [preparedAssets]
  );

  const filteredAssets = useMemo(() => {
    const searchValue = assetSearch
      .trim()
      .toLowerCase();

    return preparedAssets
      .filter((asset) => {
        const matchesSearch =
          !searchValue ||
          asset.symbol
            .toLowerCase()
            .includes(searchValue) ||
          asset.name
            .toLowerCase()
            .includes(searchValue) ||
          asset.network
            .toLowerCase()
            .includes(searchValue);

        const matchesSmallBalance =
          !hideSmall ||
          asset.valueUsd >= 1;

        return (
          matchesSearch &&
          matchesSmallBalance
        );
      })
      .sort((firstAsset, secondAsset) => {
        if (
          firstAsset.favorite &&
          !secondAsset.favorite
        ) {
          return -1;
        }

        if (
          !firstAsset.favorite &&
          secondAsset.favorite
        ) {
          return 1;
        }

        return (
          secondAsset.valueUsd -
          firstAsset.valueUsd
        );
      });
  }, [
    assetSearch,
    hideSmall,
    preparedAssets,
  ]);

  const allocation = useMemo(() => {
    if (totalPortfolioUsd <= 0) {
      return [];
    }

    return preparedAssets
      .filter(
        (asset) => asset.valueUsd > 0
      )
      .sort(
        (firstAsset, secondAsset) =>
          secondAsset.valueUsd -
          firstAsset.valueUsd
      )
      .slice(0, 5)
      .map((asset) => ({
        ...asset,

        percent:
          (asset.valueUsd /
            totalPortfolioUsd) *
          100,
      }));
  }, [
    preparedAssets,
    totalPortfolioUsd,
  ]);

  const loadRewardStats = useCallback(
    async (token) => {
      try {
        const rewardData =
          await requestJson(
            `${API}/api/rewards/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

        if (rewardData?.success) {
          setWalletStats(
            (previousStats) => ({
              ...previousStats,

              pendingRewards: Number(
                rewardData?.data?.myStats
                  ?.pendingAmount || 0
              ),

              approvedRewards: Number(
                rewardData?.data?.myStats
                  ?.approvedAmount || 0
              ),

              miningRewards: Number(
                rewardData?.data?.pools
                  ?.mining?.distributed || 0
              ),
            })
          );
        }
      } catch (error) {
        console.error(
          "Reward stats loading failed:",
          error
        );
      }
    },
    [API, requestJson]
  );

  const loadWalletHistory = useCallback(
    async (token) => {
      const historyItems = [];

      const depositRequest =
        requestJson(
          `${API}/api/deposit-request/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        ).catch(() => null);

      const withdrawalRequest =
        requestJson(
          `${API}/api/withdrawals/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        ).catch(() => null);

      const [
        depositData,
        withdrawalData,
      ] = await Promise.all([
        depositRequest,
        withdrawalRequest,
      ]);

      const deposits = Array.isArray(
        depositData?.deposits
      )
        ? depositData.deposits
        : [];

      deposits.forEach((item) => {
        historyItems.push({
          id:
            item?._id ||
            item?.id ||
            `deposit-${Math.random()}`,

          type: "DEPOSIT",

          coin:
            item?.coin ||
            item?.paymentMethod ||
            "USDT",

          amount: Number(
            item?.amount || 0
          ),

          status:
            item?.status || "Pending",

          date:
            item?.createdAt ||
            new Date().toISOString(),

          txHash:
            item?.txHash ||
            item?.transactionId ||
            "",
        });
      });

      const withdrawals = Array.isArray(
        withdrawalData?.withdrawals
      )
        ? withdrawalData.withdrawals
        : [];

      withdrawals.forEach((item) => {
        historyItems.push({
          id:
            item?._id ||
            item?.id ||
            `withdraw-${Math.random()}`,

          type: "WITHDRAW",

          coin: item?.coin || "USDT",

          amount: Number(
            item?.amount || 0
          ),

          status:
            item?.status || "Pending",

          date:
            item?.createdAt ||
            new Date().toISOString(),

          txHash: item?.txHash || "",
        });
      });

      setHistory(
        historyItems
          .sort(
            (firstItem, secondItem) =>
              new Date(secondItem.date) -
              new Date(firstItem.date)
          )
          .slice(0, 100)
      );

      setWalletStats(
        (previousStats) => ({
          ...previousStats,

          totalDeposits: deposits.reduce(
            (total, item) =>
              total +
              Number(item?.amount || 0),
            0
          ),

          totalWithdrawals:
            withdrawals.reduce(
              (total, item) =>
                total +
                Number(item?.amount || 0),
              0
            ),
        })
      );
    },
    [API, requestJson]
  );

  const loadMarketPrices =
    useCallback(async () => {
      try {
        const marketData =
          await requestJson(
            `${API}/api/coins/all-market`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

        const marketCoins =
          Array.isArray(marketData?.coins)
            ? marketData.coins
            : [];

        if (!marketCoins.length) {
          return;
        }

        setAssets((previousAssets) =>
          previousAssets.map((asset) => {
            const marketCoin =
              marketCoins.find(
                (coin) =>
                  String(
                    coin?.symbol || ""
                  ).toUpperCase() ===
                  asset.symbol.toUpperCase()
              );

            if (!marketCoin) {
              return asset;
            }

            return {
              ...asset,

              price: Number(
                marketCoin?.priceUsd ||
                  marketCoin?.price ||
                  asset.price ||
                  0
              ),

              change24h: Number(
                marketCoin?.change24h ||
                  marketCoin
                    ?.priceChange24h ||
                  marketCoin?.priceChange
                    ?.h24 ||
                  0
              ),
            };
          })
        );
      } catch (error) {
        console.error(
          "Market prices loading failed:",
          error
        );
      }
    }, [API, requestJson]);

  const loadWalletData =
    useCallback(async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setWallets(EMPTY_BALANCES);
        setLockedBalances(
          EMPTY_BALANCES
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const walletData =
          await requestJson(
            `${API}/api/wallets/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

        if (
          !walletData?.success ||
          !walletData?.wallet
        ) {
          setWallets(EMPTY_BALANCES);
          setLockedBalances(
            EMPTY_BALANCES
          );
          return;
        }

        const balances =
          walletData.wallet.balances || {};

        const locked =
          walletData.wallet.locked || {};

        const nextBalances = {
          ...EMPTY_BALANCES,

          ...Object.fromEntries(
            Object.entries(balances).map(
              ([coin, value]) => [
                String(coin).toUpperCase(),
                Number(value || 0),
              ]
            )
          ),
        };

        const nextLockedBalances = {
          ...EMPTY_BALANCES,

          ...Object.fromEntries(
            Object.entries(locked).map(
              ([coin, value]) => [
                String(coin).toUpperCase(),
                Number(value || 0),
              ]
            )
          ),
        };

        setWallets(nextBalances);
        setLockedBalances(
          nextLockedBalances
        );

        setAssets((previousAssets) =>
          previousAssets.map((asset) => ({
            ...asset,

            balance: Number(
              nextBalances[asset.symbol] ||
                asset.balance ||
                0
            ),
          }))
        );

        const totalLockedBalance =
          Object.values(
            nextLockedBalances
          ).reduce(
            (total, value) =>
              total + Number(value || 0),
            0
          );

        setWalletStats(
          (previousStats) => ({
            ...previousStats,

            availableBalance: Number(
              nextBalances.USDT || 0
            ),

            lockedBalance:
              totalLockedBalance,

            walletStatus:
              translateWithFallback(
                "verifiedActive",
                "Verified / Active"
              ),
          })
        );

        await Promise.allSettled([
          loadRewardStats(token),
          loadWalletHistory(token),
          loadMarketPrices(),
        ]);
      } catch (error) {
        console.error(
          "Wallet loading failed:",
          error
        );

        if (error?.status === 401) {
          setWallets(EMPTY_BALANCES);
          setLockedBalances(
            EMPTY_BALANCES
          );
        }
      } finally {
        setIsLoading(false);
      }
    }, [
      API,
      loadMarketPrices,
      loadRewardStats,
      loadWalletHistory,
      requestJson,
  ]);

  useEffect(() => {
    loadWalletData();

    const intervalId =
      window.setInterval(
        loadWalletData,
        30000
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadWalletData]);

  useEffect(() => {
    setWalletStats(
      (previousStats) => ({
        ...previousStats,
        totalPortfolioUsd,
      })
    );
  }, [totalPortfolioUsd]);

  const toggleFavorite = (symbol) => {
    setFavorites(
      (previousFavorites) => {
        const updatedFavorites =
          previousFavorites.includes(symbol)
            ? previousFavorites.filter(
                (item) => item !== symbol
              )
            : [
                ...previousFavorites,
                symbol,
              ];

        localStorage.setItem(
          "exalt_wallet_favorites",
          JSON.stringify(
            updatedFavorites
          )
        );

        return updatedFavorites;
      }
    );
  };

  const submitDeposit = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.alert(
        translateWithFallback(
          "pleaseLoginFirst",
          "Please login first.",
          "common"
        )
      );
      return;
    }

    const numericAmount = Number(
      depositForm.amount
    );

    if (
      !depositForm.senderName.trim() ||
      !depositForm.senderAccount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      window.alert(
        translateWithFallback(
          "depositRequiredFields",
          "Name, account or wallet, and a valid amount are required."
        )
      );
      return;
    }

    setDepositSubmitting(true);

    try {
      const data = await requestJson(
        `${API}/api/wallets/deposit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,

            Accept: "application/json",
          },

          body: JSON.stringify({
            coin:
              depositForm.paymentMethod,

            network: selectedNetwork,

            senderName:
              depositForm.senderName.trim(),

            senderAccount:
              depositForm.senderAccount.trim(),

            amount: numericAmount,

            paymentMethod:
              depositForm.paymentMethod,

            txHash:
              depositForm.txHash.trim(),

            transactionId:
              depositForm.txHash.trim(),

            memo:
              depositForm.memo.trim(),
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Deposit request failed."
        );
      }

      window.alert(
        translateWithFallback(
          "depositSubmittedSuccessfully",
          "Deposit request submitted successfully."
        )
      );

      setDepositForm({
        senderName: "",
        senderAccount: "",
        amount: "",
        paymentMethod: "EXALT",
        txHash: "",
        memo: "",
      });

      await loadWalletData();
    } catch (error) {
      console.error(
        "Deposit request failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "depositFailed",
            "Deposit failed."
          )
      );
    } finally {
      setDepositSubmitting(false);
    }
  };

  const submitWithdrawal = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.alert(
        translateWithFallback(
          "pleaseLoginFirst",
          "Please login first.",
          "common"
        )
      );
      return;
    }

    const numericAmount = Number(
      withdrawForm.amount
    );

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !withdrawForm.accountName.trim() ||
      !withdrawForm.accountNumber.trim()
    ) {
      window.alert(
        translateWithFallback(
          "withdrawRequiredFields",
          "Amount, account name and wallet or account number are required."
        )
      );
      return;
    }

    const availableCoinBalance = Number(
      wallets[withdrawForm.coin] || 0
    );

    if (
      withdrawForm.method === "CRYPTO" &&
      numericAmount >
        availableCoinBalance
    ) {
      window.alert(
        translateWithFallback(
          "insufficientBalance",
          "Insufficient wallet balance."
        )
      );
      return;
    }

    if (
      receiveAmount <= 0 &&
      withdrawForm.method === "CRYPTO"
    ) {
      window.alert(
        translateWithFallback(
          "amountBelowNetworkFee",
          "Withdrawal amount must be greater than the network fee."
        )
      );
      return;
    }

    const confirmed = window.confirm(
      translateWithFallback(
        "confirmWithdrawal",
        `Submit ${numericAmount} ${withdrawForm.coin} withdrawal request?`
      )
    );

    if (!confirmed) {
      return;
    }

    setWithdrawalSubmitting(true);

    try {
      const data = await requestJson(
        `${API}/api/wallets/withdraw`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,

            Accept: "application/json",
          },

          body: JSON.stringify({
            amount: numericAmount,

            walletAddress:
              withdrawForm.accountNumber.trim(),

            accountName:
              withdrawForm.accountName.trim(),

            paymentMethod:
              withdrawForm.method,

            coin: withdrawForm.coin,

            network:
              withdrawForm.method ===
              "CRYPTO"
                ? withdrawForm.network
                : withdrawForm.method,

            memo:
              withdrawForm.memo.trim(),
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Withdrawal request failed."
        );
      }

      window.alert(
        translateWithFallback(
          "withdrawalSubmittedSuccessfully",
          "Withdrawal request submitted successfully."
        )
      );

      setWithdrawForm({
        amount: "",
        accountName: "",
        accountNumber: "",
        method: "CRYPTO",
        coin: "USDT",
        network: "BEP20",
        memo: "",
      });

      await loadWalletData();
    } catch (error) {
      console.error(
        "Withdrawal request failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "withdrawalFailed",
            "Withdrawal failed."
          )
      );
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const saveAddressBook = () => {
    if (
      !withdrawForm.accountNumber.trim() ||
      !withdrawForm.accountName.trim()
    ) {
      window.alert(
        translateWithFallback(
          "addressBookFieldsRequired",
          "Wallet name and address are required."
        )
      );
      return;
    }

    const addressAlreadyExists =
      addressBook.some(
        (item) =>
          item.address.toLowerCase() ===
          withdrawForm.accountNumber
            .trim()
            .toLowerCase()
      );

    if (addressAlreadyExists) {
      window.alert(
        translateWithFallback(
          "addressAlreadySaved",
          "This address is already saved."
        )
      );
      return;
    }

    const newAddress = {
      id: `${Date.now()}-${Math.random()}`,

      name:
        withdrawForm.accountName.trim(),

      address:
        withdrawForm.accountNumber.trim(),

      coin: withdrawForm.coin,

      network: withdrawForm.network,

      createdAt:
        new Date().toISOString(),
    };

    const updatedAddressBook = [
      newAddress,
      ...addressBook,
    ].slice(0, 50);

    setAddressBook(
      updatedAddressBook
    );

    localStorage.setItem(
      "exalt_address_book",
      JSON.stringify(
        updatedAddressBook
      )
    );

    window.alert(
      translateWithFallback(
        "addressSaved",
        "Address saved successfully."
      )
    );
  };

  const deleteSavedAddress = (
    addressId
  ) => {
    const confirmed = window.confirm(
      translateWithFallback(
        "confirmDeleteAddress",
        "Delete this saved address?"
      )
    );

    if (!confirmed) {
      return;
    }

    const updatedAddressBook =
      addressBook.filter(
        (item) => item.id !== addressId
      );

    setAddressBook(
      updatedAddressBook
    );

    localStorage.setItem(
      "exalt_address_book",
      JSON.stringify(
        updatedAddressBook
      )
    );
  };

  const useSavedAddress = (item) => {
    setWithdrawForm(
      (previousForm) => ({
        ...previousForm,

        accountName: item.name,

        accountNumber: item.address,

        coin: item.coin,

        network: item.network,
      })
    );
  };

  const renderAssetList = () => (
    <section className="wallet-v2-assets">
      <div className="wallet-v2-section-head">
        <div>
          <h2>
            {translateWithFallback(
              "assets",
              "Assets"
            )}
          </h2>

          <p>
            {translateWithFallback(
              "assetsManagementText",
              "Search, favorite and manage your exchange assets."
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={loadWalletData}
        >
          {isLoading
            ? translateWithFallback(
                "refreshing",
                "Refreshing..."
              )
            : translateWithFallback(
                "refresh",
                "Refresh",
                "common"
              )}
        </button>
      </div>

      <div className="wallet-v2-tools">
        <input
          type="search"
          placeholder={translateWithFallback(
            "searchAsset",
            "Search coin, network or symbol..."
          )}
          value={assetSearch}
          onChange={(event) =>
            setAssetSearch(
              event.target.value
            )
          }
        />

        <button
          type="button"
          className={
            hideSmall ? "active" : ""
          }
          onClick={() =>
            setHideSmall(
              (hidden) => !hidden
            )
          }
        >
          {translateWithFallback(
            "hideSmallBalances",
            "Hide Small"
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            setHideBalance(
              (hidden) => !hidden
            )
          }
        >
          {hideBalance
            ? translateWithFallback(
                "showBalance",
                "Show Balance"
              )
            : translateWithFallback(
                "hideBalance",
                "Hide Balance"
              )}
        </button>
      </div>

      <div className="wallet-v2-asset-list">
        {filteredAssets.length === 0 ? (
          <div className="wallet-v2-empty">
            <h3>
              {translateWithFallback(
                "noAssetsFound",
                "No assets found"
              )}
            </h3>

            <p>
              {translateWithFallback(
                "tryAnotherSearch",
                "Try another search keyword."
              )}
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <article
              className="wallet-v2-asset-row"
              key={asset.symbol}
            >
              <div className="asset-main">
                <img
                  src={asset.logo}
                  alt={asset.symbol}
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      exaltLogo;
                  }}
                />

                <div>
                  <strong>
                    {asset.symbol}
                  </strong>

                  <p>
                    {asset.name} •{" "}
                    {asset.network}
                  </p>
                </div>
              </div>

              <div className="asset-price">
                <strong>
                  {formatUsd(asset.price)}
                </strong>

                <span
                  className={
                    Number(
                      asset.change24h
                    ) >= 0
                      ? "green"
                      : "red"
                  }
                >
                  {Number(
                    asset.change24h || 0
                  ).toFixed(2)}
                  %
                </span>
              </div>

              <div className="asset-balance">
                <strong>
                  {hideBalance
                    ? "****"
                    : formatAmount(
                        asset.balance
                      )}
                </strong>

                <p>
                  {hideBalance
                    ? "****"
                    : formatUsd(
                        asset.valueUsd
                      )}
                </p>
              </div>

              <button
                type="button"
                className={
                  asset.favorite
                    ? "fav active"
                    : "fav"
                }
                aria-label={
                  asset.favorite
                    ? translateWithFallback(
                        "removeFavorite",
                        "Remove favorite"
                      )
                    : translateWithFallback(
                        "addFavorite",
                        "Add favorite"
                      )
                }
                onClick={() =>
                  toggleFavorite(
                    asset.symbol
                  )
                }
              >
                ★
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );

  const renderPortfolioAllocation =
    () => (
      <section className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>
              {translateWithFallback(
                "portfolioAllocation",
                "Portfolio Allocation"
              )}
            </h2>

            <p>
              {translateWithFallback(
                "portfolioAllocationText",
                "Top holdings by estimated USD value."
              )}
            </p>
          </div>
        </div>

        {allocation.length === 0 ? (
          <div className="wallet-v2-empty">
            <h3>
              {translateWithFallback(
                "noAllocationYet",
                "No allocation yet"
              )}
            </h3>

            <p>
              {translateWithFallback(
                "depositToSeeAllocation",
                "Deposit assets to see portfolio allocation."
              )}
            </p>
          </div>
        ) : (
          <div className="wallet-v2-allocation">
            {allocation.map((asset) => (
              <div
                className="allocation-row"
                key={asset.symbol}
              >
                <div>
                  <strong>
                    {asset.symbol}
                  </strong>

                  <span>
                    {asset.percent.toFixed(
                      2
                    )}
                    %
                  </span>
                </div>

                <div className="allocation-bar">
                  <span
                    style={{
                      width: `${Math.min(
                        asset.percent,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );

  const renderOverview = () => (
    <>
      <section className="wallet-v2-hero">
        <div>
          <p>
            {translateWithFallback(
              "totalPortfolioValue",
              "Total Portfolio Value"
            )}
          </p>

          <h1>
            {hideBalance
              ? "******"
              : formatUsd(
                  totalPortfolioUsd
                )}
          </h1>

          <span
            className={
              Number(
                walletStats.todayPnl
              ) >= 0
                ? "green"
                : "red"
            }
          >
            {Number(
              walletStats.todayPnl || 0
            ) >= 0
              ? "+"
              : ""}

            {formatUsd(
              walletStats.todayPnl
            )}{" "}
            /{" "}
            {Number(
              walletStats.todayPnlPercent ||
                0
            ).toFixed(2)}
            %
          </span>
        </div>

        <button
          type="button"
          aria-label={
            hideBalance
              ? translateWithFallback(
                  "showBalance",
                  "Show Balance"
                )
              : translateWithFallback(
                  "hideBalance",
                  "Hide Balance"
                )
          }
          onClick={() =>
            setHideBalance(
              (hidden) => !hidden
            )
          }
        >
          {hideBalance ? "👁️" : "🙈"}
        </button>
      </section>

      <section className="wallet-v2-stats">
        <div>
          <span>
            {translateWithFallback(
              "available",
              "Available",
              "common"
            )}
          </span>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  walletStats.availableBalance
                )} USDT`}
          </strong>
        </div>

        <div>
          <span>
            {translateWithFallback(
              "locked",
              "Locked",
              "common"
            )}
          </span>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  walletStats.lockedBalance
                )} USDT`}
          </strong>
        </div>

        <div>
          <span>
            {translateWithFallback(
              "inOrders",
              "In Orders"
            )}
          </span>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  walletStats.inOrders
                )} USDT`}
          </strong>
        </div>

        <div>
          <span>
            {translateWithFallback(
              "status",
              "Status",
              "common"
            )}
          </span>

          <strong>
            {walletStats.walletStatus}
          </strong>
        </div>
      </section>

      <section className="wallet-v2-grid">
        <div className="wallet-v2-card">
          <h3>
            {translateWithFallback(
              "fundingWallet",
              "Funding Wallet"
            )}
          </h3>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  wallets.USDT
                )} USDT`}
          </strong>

          <p>
            {translateWithFallback(
              "fundingWalletText",
              "Deposits, withdrawals and fiat funding."
            )}
          </p>
        </div>

        <div className="wallet-v2-card">
          <h3>
            {translateWithFallback(
              "spotWallet",
              "Spot Wallet"
            )}
          </h3>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  wallets.EXALT
                )} EXALT`}
          </strong>

          <p>
            {translateWithFallback(
              "spotWalletText",
              "Trading balance and exchange assets."
            )}
          </p>
        </div>

        <div className="wallet-v2-card">
          <h3>
            {translateWithFallback(
              "bnbWallet",
              "BNB Wallet"
            )}
          </h3>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  wallets.BNB
                )} BNB`}
          </strong>

          <p>
            {translateWithFallback(
              "bnbWalletText",
              "Gas and BNB Smart Chain assets."
            )}
          </p>
        </div>

        <div className="wallet-v2-card">
          <h3>
            {translateWithFallback(
              "rewards",
              "Rewards",
              "navigation"
            )}
          </h3>

          <strong>
            {hideBalance
              ? "****"
              : `${formatAmount(
                  walletStats.pendingRewards
                )} EXALT`}
          </strong>

          <p>
            {translateWithFallback(
              "rewardBalancesText",
              "Pending and approved reward balances."
            )}
          </p>
        </div>
      </section>

      {renderPortfolioAllocation()}
      {renderAssetList()}
    </>
  );

  const renderDeposit = () => (
    <div className="wallet-v2-two-col">
      <section className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>
              {translateWithFallback(
                "depositCrypto",
                "Deposit Crypto"
              )}
            </h2>

            <p>
              {translateWithFallback(
                "depositCryptoText",
                "Select coin and network, then send only supported assets."
              )}
            </p>
          </div>
        </div>

        <div className="wallet-v2-form-row">
          <select
            value={selectedCoin}
            onChange={(event) => {
              const nextCoin =
                event.target.value;

              setSelectedCoin(nextCoin);

              const availableNetworks =
                Object.keys(
                  FALLBACK_DEPOSIT_ADDRESSES[
                    nextCoin
                  ] || {}
                );

              setSelectedNetwork(
                availableNetworks[0] ||
                  "BEP20"
              );

              setDepositForm(
                (previousForm) => ({
                  ...previousForm,
                  paymentMethod:
                    nextCoin,
                })
              );
            }}
          >
            {Object.keys(
              FALLBACK_DEPOSIT_ADDRESSES
            ).map((coin) => (
              <option
                key={coin}
                value={coin}
              >
                {coin}
              </option>
            ))}
          </select>

          <select
            value={selectedNetwork}
            onChange={(event) =>
              setSelectedNetwork(
                event.target.value
              )
            }
          >
            {Object.keys(
              FALLBACK_DEPOSIT_ADDRESSES[
                selectedCoin
              ] || {}
            ).map((network) => (
              <option
                key={network}
                value={network}
              >
                {network}
              </option>
            ))}
          </select>
        </div>

        {depositAddressLoading && (
          <div className="wallet-v2-empty">
            <h3>
              {translateWithFallback(
                "loadingDepositAddress",
                "Loading secure deposit address..."
              )}
            </h3>
          </div>
        )}

        {!depositAddressLoading && depositAddressError && (
          <div className="wallet-v2-warning">
            <strong>
              {translateWithFallback(
                "depositAddressFallback",
                "Fallback Address Active"
              )}
            </strong>

            <p>{depositAddressError}</p>
          </div>
        )}

        {!depositAddressLoading && activeDepositAddress ? (
          <div className="wallet-v2-address-card">
            <div className="deposit-coin-head">
              <img
                src={
                  COIN_LOGOS[
                    selectedCoin
                  ] || exaltLogo
                }
                alt={selectedCoin}
                onError={(event) => {
                  event.currentTarget.onerror =
                    null;

                  event.currentTarget.src =
                    exaltLogo;
                }}
              />

              <div>
                <strong>
                  {selectedCoin}{" "}
                  {translateWithFallback(
                    "deposit",
                    "Deposit",
                    "common"
                  )}
                </strong>

                <p>
                  {selectedNetwork}{" "}
                  {translateWithFallback(
                    "network",
                    "Network"
                  )}
                </p>
              </div>
            </div>

            <div className="wallet-v2-qr">
              <QRCodeCanvas
                value={
                  activeDepositAddress
                }
                size={150}
                includeMargin
              />
            </div>

            <div className="wallet-v2-address-text">
              <span>
                {translateWithFallback(
                  "depositAddress",
                  "Deposit Address"
                )}
              </span>

              <strong>
                {activeDepositAddress}
              </strong>

              <small>
                {liveDepositAddress
                  ? translateWithFallback(
                      "liveBackendAddress",
                      "Live exchange address"
                    )
                  : translateWithFallback(
                      "configuredFallbackAddress",
                      "Configured fallback address"
                    )}
              </small>
            </div>

            <div className="wallet-v2-action-row">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    activeDepositAddress,
                    `${selectedCoin} address`
                  )
                }
              >
                {translateWithFallback(
                  "copyAddress",
                  "Copy Address"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    activeDepositAddress,
                    "QR value"
                  )
                }
              >
                {translateWithFallback(
                  "copyQrValue",
                  "Copy QR Value"
                )}
              </button>
            </div>

            <div className="wallet-v2-warning">
              <strong>
                {translateWithFallback(
                  "important",
                  "Important",
                  "common"
                )}
              </strong>

              <p>
                {translateWithFallback(
                  "depositNetworkWarning",
                  `Send only ${selectedCoin} on ${selectedNetwork}. Sending unsupported assets or using the wrong network may cause permanent loss.`
                )}
              </p>
            </div>

            <div className="wallet-v2-mini-grid">
              <div>
                <span>
                  {translateWithFallback(
                    "minimumDeposit",
                    "Minimum Deposit"
                  )}
                </span>

                <strong>
                  {
                    activeNetworkMeta.minDeposit
                  }{" "}
                  {selectedCoin}
                </strong>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "confirmations",
                    "Confirmations"
                  )}
                </span>

                <strong>
                  {
                    activeNetworkMeta.confirmations
                  }
                </strong>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "arrivalTime",
                    "Arrival Time"
                  )}
                </span>

                <strong>
                  {activeNetworkMeta.time}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-v2-empty">
            <h3>
              {translateWithFallback(
                "noAddressAvailable",
                "No address available"
              )}
            </h3>

            <p>
              {translateWithFallback(
                "networkNotEnabled",
                "This network is not enabled yet."
              )}
            </p>
          </div>
        )}
      </section>

      <section className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>
              {translateWithFallback(
                "submitDeposit",
                "Submit Deposit"
              )}
            </h2>

            <p>
              {translateWithFallback(
                "submitDepositText",
                "Submit proof after making a crypto, bank or mobile-wallet deposit."
              )}
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder={translateWithFallback(
            "yourName",
            "Your Name"
          )}
          value={depositForm.senderName}
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                senderName:
                  event.target.value,
              })
            )
          }
        />

        <input
          type="text"
          placeholder={translateWithFallback(
            "yourWalletBankAccount",
            "Wallet / Bank / Mobile Account"
          )}
          value={
            depositForm.senderAccount
          }
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                senderAccount:
                  event.target.value,
              })
            )
          }
        />

        <input
          type="number"
          min="0"
          step="any"
          placeholder={translateWithFallback(
            "amount",
            "Amount",
            "common"
          )}
          value={depositForm.amount}
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                amount:
                  event.target.value,
              })
            )
          }
        />

        <select
          value={
            depositForm.paymentMethod
          }
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                paymentMethod:
                  event.target.value,
              })
            )
          }
        >
          <option value="EXALT">
            EXALT
          </option>
          <option value="USDT">
            USDT
          </option>
          <option value="BNB">
            BNB
          </option>
          <option value="JazzCash">
            JazzCash
          </option>
          <option value="EasyPaisa">
            EasyPaisa
          </option>
          <option value="Bank Transfer">
            Bank Transfer
          </option>
        </select>

        <input
          type="text"
          placeholder={translateWithFallback(
            "transactionHashReference",
            "Transaction Hash / Reference"
          )}
          value={depositForm.txHash}
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                txHash:
                  event.target.value,
              })
            )
          }
        />

        <input
          type="text"
          placeholder={translateWithFallback(
            "memoOptional",
            "Memo / Tag (Optional)"
          )}
          value={depositForm.memo}
          onChange={(event) =>
            setDepositForm(
              (previousForm) => ({
                ...previousForm,

                memo:
                  event.target.value,
              })
            )
          }
        />

        <button
          type="button"
          className="wallet-v2-primary"
          disabled={depositSubmitting}
          onClick={submitDeposit}
        >
          {depositSubmitting
            ? translateWithFallback(
                "submitting",
                "Submitting...",
                "common"
              )
            : translateWithFallback(
                "submitDeposit",
                "Submit Deposit"
              )}
        </button>

        <div className="wallet-v2-fiat-box">
          <h3>
            {translateWithFallback(
              "fiatDepositMethods",
              "Fiat Deposit Methods"
            )}
          </h3>

          <div>
            <span>
              JazzCash / Easypaisa
            </span>

            <strong>
              {BANK_INFO.jazzCash}
            </strong>

            <button
              type="button"
              onClick={() =>
                copyText(
                  BANK_INFO.jazzCash,
                  "JazzCash / Easypaisa"
                )
              }
            >
              {translateWithFallback(
                "copy",
                "Copy",
                "common"
              )}
            </button>
          </div>

          <div>
            <span>
              {translateWithFallback(
                "accountTitle",
                "Account Title"
              )}
            </span>

            <strong>
              {BANK_INFO.accountTitle}
            </strong>
          </div>

          <div>
            <span>IBAN</span>

            <strong>
              {BANK_INFO.iban}
            </strong>

            <button
              type="button"
              onClick={() =>
                copyText(
                  BANK_INFO.iban,
                  "IBAN"
                )
              }
            >
              {translateWithFallback(
                "copy",
                "Copy",
                "common"
              )}
            </button>
          </div>

          <div>
            <span>
              {translateWithFallback(
                "bank",
                "Bank"
              )}
            </span>

            <strong>
              {BANK_INFO.bank}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );

  const renderWithdraw = () => (
    <div className="wallet-v2-two-col">
      <section className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>
              {translateWithFallback(
                "withdraw",
                "Withdraw"
              )}
            </h2>

            <p>
              {translateWithFallback(
                "withdrawText",
                "Submit a withdrawal request with network-fee preview."
              )}
            </p>
          </div>
        </div>

        <div className="wallet-v2-form-row">
          <select
            value={withdrawForm.coin}
            onChange={(event) =>
              setWithdrawForm(
                (previousForm) => ({
                  ...previousForm,

                  coin:
                    event.target.value,
                })
              )
            }
          >
            <option value="USDT">
              USDT
            </option>
            <option value="EXALT">
              EXALT
            </option>
            <option value="BNB">
              BNB
            </option>
            <option value="BTC">
              BTC
            </option>
            <option value="ETH">
              ETH
            </option>
          </select>

          <select
            value={
              withdrawForm.network
            }
            onChange={(event) =>
              setWithdrawForm(
                (previousForm) => ({
                  ...previousForm,

                  network:
                    event.target.value,
                })
              )
            }
          >
            {Object.keys(
              NETWORK_META
            ).map((network) => (
              <option
                key={network}
                value={network}
              >
                {network}
              </option>
            ))}
          </select>
        </div>

        <input
          type="number"
          min="0"
          step="any"
          placeholder={translateWithFallback(
            "amount",
            "Amount",
            "common"
          )}
          value={withdrawForm.amount}
          onChange={(event) =>
            setWithdrawForm(
              (previousForm) => ({
                ...previousForm,

                amount:
                  event.target.value,
              })
            )
          }
        />

        <div className="wallet-v2-max-row">
          <span>
            {translateWithFallback(
              "available",
              "Available",
              "common"
            )}
            :{" "}
            {formatAmount(
              wallets[
                withdrawForm.coin
              ] || 0
            )}{" "}
            {withdrawForm.coin}
          </span>

          <button
            type="button"
            onClick={() =>
              setWithdrawForm(
                (previousForm) => ({
                  ...previousForm,

                  amount: String(
                    wallets[
                      previousForm.coin
                    ] || 0
                  ),
                })
              )
            }
          >
            {translateWithFallback(
              "max",
              "Max",
              "common"
            )}
          </button>
        </div>

        <input
          type="text"
          placeholder={translateWithFallback(
            "accountWalletName",
            "Wallet / Account Name"
          )}
          value={
            withdrawForm.accountName
          }
          onChange={(event) =>
            setWithdrawForm(
              (previousForm) => ({
                ...previousForm,

                accountName:
                  event.target.value,
              })
            )
          }
        />

        <input
          type="text"
          placeholder={translateWithFallback(
            "walletBankIbanPlaceholder",
            "Wallet Address / Bank IBAN / Mobile Number"
          )}
          value={
            withdrawForm.accountNumber
          }
          onChange={(event) =>
            setWithdrawForm(
              (previousForm) => ({
                ...previousForm,

                accountNumber:
                  event.target.value,
              })
            )
          }
        />

        <select
          value={withdrawForm.method}
          onChange={(event) =>
            setWithdrawForm(
              (previousForm) => ({
                ...previousForm,

                method:
                  event.target.value,
              })
            )
          }
        >
          <option value="CRYPTO">
            Crypto Wallet
          </option>

          <option value="JAZZCASH">
            JazzCash
          </option>

          <option value="EASYPAISA">
            Easypaisa
          </option>

          <option value="BANK">
            Bank Transfer
          </option>
        </select>

        <input
          type="text"
          placeholder={translateWithFallback(
            "memoOptional",
            "Memo / Tag (Optional)"
          )}
          value={withdrawForm.memo}
          onChange={(event) =>
            setWithdrawForm(
              (previousForm) => ({
                ...previousForm,

                memo:
                  event.target.value,
              })
            )
          }
        />

        <div className="wallet-v2-fee-box">
          <div>
            <span>
              {translateWithFallback(
                "estimatedNetworkFee",
                "Estimated Network Fee"
              )}
            </span>

            <strong>
              {formatAmount(
                withdrawFee,
                8
              )}{" "}
              {withdrawForm.coin}
            </strong>
          </div>

          <div>
            <span>
              {translateWithFallback(
                "youWillReceive",
                "You Will Receive"
              )}
            </span>

            <strong>
              {formatAmount(
                receiveAmount,
                8
              )}{" "}
              {withdrawForm.coin}
            </strong>
          </div>
        </div>

        <div className="wallet-v2-action-row">
          <button
            type="button"
            onClick={saveAddressBook}
          >
            {translateWithFallback(
              "saveAddress",
              "Save Address"
            )}
          </button>

          <button
            type="button"
            className="wallet-v2-primary"
            disabled={
              withdrawalSubmitting
            }
            onClick={submitWithdrawal}
          >
            {withdrawalSubmitting
              ? translateWithFallback(
                  "submitting",
                  "Submitting...",
                  "common"
                )
              : translateWithFallback(
                  "submitWithdrawal",
                  "Submit Withdrawal"
                )}
          </button>
        </div>
      </section>

      <section className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>
              {translateWithFallback(
                "savedAddressBook",
                "Saved Address Book"
              )}
            </h2>

            <p>
              {translateWithFallback(
                "savedAddressBookText",
                "Quick withdrawal destinations."
              )}
            </p>
          </div>
        </div>

        {addressBook.length === 0 ? (
          <div className="wallet-v2-empty">
            <h3>
              {translateWithFallback(
                "noSavedAddresses",
                "No saved addresses"
              )}
            </h3>

            <p>
              {translateWithFallback(
                "savedWalletsAppearHere",
                "Your saved withdrawal wallets will appear here."
              )}
            </p>
          </div>
        ) : (
          <div className="wallet-v2-address-list">
            {addressBook.map((item) => (
              <article
                key={item.id}
                className="wallet-v2-address-row"
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <p>
                    {item.coin} •{" "}
                    {item.network}
                  </p>

                  <small>
                    {item.address.slice(
                      0,
                      10
                    )}
                    ...
                    {item.address.slice(
                      -8
                    )}
                  </small>
                </div>

                <div className="wallet-v2-address-actions">
                  <button
                    type="button"
                    onClick={() =>
                      useSavedAddress(item)
                    }
                  >
                    {translateWithFallback(
                      "use",
                      "Use",
                      "common"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        item.address,
                        "Wallet Address"
                      )
                    }
                  >
                    {translateWithFallback(
                      "copy",
                      "Copy",
                      "common"
                    )}
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      deleteSavedAddress(
                        item.id
                      )
                    }
                  >
                    {translateWithFallback(
                      "delete",
                      "Delete",
                      "common"
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="wallet-v2-security">
          <h3>
            {translateWithFallback(
              "withdrawalSecurity",
              "Withdrawal Security"
            )}
          </h3>

          <ul>
            <li>
              ✅{" "}
              {translateWithFallback(
                "emailVerificationRequired",
                "Email verification required"
              )}
            </li>

            <li>
              ✅{" "}
              {translateWithFallback(
                "adminApprovalSystem",
                "Admin approval system"
              )}
            </li>

            <li>
              ✅{" "}
              {translateWithFallback(
                "riskEngineVerification",
                "Risk engine verification"
              )}
            </li>

            <li>
              ✅{" "}
              {translateWithFallback(
                "amlMonitoring",
                "AML monitoring"
              )}
            </li>

            <li>
              ✅{" "}
              {translateWithFallback(
                "withdrawalHistoryRecorded",
                "Withdrawal history recorded"
              )}
            </li>

            <li>
              ✅{" "}
              {translateWithFallback(
                "auditTrailEnabled",
                "Audit trail enabled"
              )}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );

  const renderHistory = () => (
    <section className="wallet-v2-card">
      <div className="wallet-v2-section-head">
        <div>
          <h2>
            {translateWithFallback(
              "walletHistory",
              "Wallet History"
            )}
          </h2>

          <p>
            {translateWithFallback(
              "walletHistoryText",
              "Deposits, withdrawals and rewards."
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={loadWalletData}
        >
          {isLoading
            ? translateWithFallback(
                "refreshing",
                "Refreshing..."
              )
            : translateWithFallback(
                "refresh",
                "Refresh",
                "common"
              )}
        </button>
      </div>

      {history.length === 0 ? (
        <div className="wallet-v2-empty">
          <h3>
            {translateWithFallback(
              "noHistoryAvailable",
              "No history available"
            )}
          </h3>

          <p>
            {translateWithFallback(
              "walletTransactionsAppearHere",
              "Your wallet transactions will appear here."
            )}
          </p>
        </div>
      ) : (
        <div className="wallet-v2-history">
          {history.map((item) => {
            const normalizedStatus =
              String(
                item.status || ""
              ).toLowerCase();

            const statusClass = [
              "approved",
              "completed",
              "success",
            ].includes(normalizedStatus)
              ? "green"
              : [
                  "rejected",
                  "failed",
                  "cancelled",
                ].includes(
                  normalizedStatus
                )
              ? "red"
              : "orange";

            return (
              <article
                className="wallet-v2-history-row"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.type}
                  </strong>

                  <p>
                    {item.coin} •{" "}
                    {new Date(
                      item.date
                    ).toLocaleString()}
                  </p>

                  {item.txHash && (
                    <small>
                      {item.txHash.slice(
                        0,
                        14
                      )}
                      ...
                      {item.txHash.slice(
                        -10
                      )}
                    </small>
                  )}
                </div>

                <div className="history-right">
                  <strong>
                    {Number(
                      item.amount || 0
                    ).toLocaleString()}
                  </strong>

                  <span
                    className={
                      statusClass
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderSecurity = () => (
    <section className="wallet-v2-card">
      <h2>
        {translateWithFallback(
          "walletSecurity",
          "Wallet Security"
        )}
      </h2>

      <div className="wallet-v2-security-score">
        <h1>
          {walletStats.securityScore}%
        </h1>

        <p>
          {translateWithFallback(
            "securityScore",
            "Security Score"
          )}
        </p>
      </div>

      <ul>
        <li>
          ✅{" "}
          {translateWithFallback(
            "securityAdminApproval",
            "Admin withdrawal approval"
          )}
        </li>

        <li>
          ✅{" "}
          {translateWithFallback(
            "securityNoAutoRelease",
            "No automatic fund release"
          )}
        </li>

        <li>
          ✅{" "}
          {translateWithFallback(
            "securityWalletVerification",
            "Wallet verification enabled"
          )}
        </li>

        <li>
          ✅{" "}
          {translateWithFallback(
            "securityBackendApproval",
            "Backend approval system"
          )}
        </li>

        <li>
          ✅{" "}
          {translateWithFallback(
            "riskMonitoringReady",
            "Risk monitoring ready"
          )}
        </li>
      </ul>
    </section>
  );

  const tabs = [
    [
      "overview",
      translateWithFallback(
        "overview",
        "Overview"
      ),
    ],

    [
      "assets",
      translateWithFallback(
        "assets",
        "Assets"
      ),
    ],

    [
      "deposit",
      translateWithFallback(
        "deposit",
        "Deposit",
        "common"
      ),
    ],

    [
      "withdraw",
      translateWithFallback(
        "withdraw",
        "Withdraw"
      ),
    ],

    [
      "history",
      translateWithFallback(
        "history",
        "History",
        "common"
      ),
    ],

    [
      "security",
      translateWithFallback(
        "security",
        "Security"
      ),
    ],
  ];

  return (
    <PageShell
      titleKey="wallets"
      subtitleKey="walletsSubtitle"
    >
      <main className="wallet-v2-page">
        <nav className="wallet-v2-tabs">
          {tabs.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={
                activeTab === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(key)
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" &&
          renderOverview()}

        {activeTab === "assets" &&
          renderAssetList()}

        {activeTab === "deposit" &&
          renderDeposit()}

        {activeTab === "withdraw" &&
          renderWithdraw()}

        {activeTab === "history" &&
          renderHistory()}

        {activeTab === "security" &&
          renderSecurity()}
      </main>
    </PageShell>
  );
}

export default Wallets;