import platformOverview from "../../assets/blog/platform-overview.jpg";
import spotTrading from "../../assets/blog/spot-trading.jpg";
import p2pSecurity from "../../assets/blog/p2p-security.jpg";
import web3Wallet from "../../assets/blog/web3-wallet.jpg";
import futuresRisk from "../../assets/blog/futures-risk.jpg";
import exaltCoin from "../../assets/blog/exalt-coin.jpg";

export const BLOG_CATEGORIES = [
  "All",
  "Exchange Updates",
  "Exalt Coin",
  "Crypto Education",
  "Spot Trading",
  "Futures",
  "P2P",
  "Web3 Wallet",
  "Security",
];

export const blogPosts = [
  {
    id: "exalt-exchange-platform-overview",
    slug: "exalt-exchange-platform-overview",
    title: "Exalt Exchange: A Complete Digital Asset Platform Overview",
    excerpt:
      "Explore the core services of Exalt Exchange, including spot trading, futures, P2P, Web3 wallet access, staking, security, and account management.",
    category: "Exchange Updates",
    tags: ["Exalt Exchange", "Crypto Exchange", "Digital Assets"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "6 min read",
    featured: true,
    image: platformOverview,
    imageAlt: "Exalt Exchange digital asset platform",
    seoTitle:
      "Exalt Exchange Platform Overview | Trading, Wallet & P2P",
    seoDescription:
      "Discover Exalt Exchange services, including spot trading, futures, P2P, Web3 wallet access, staking, KYC, and digital asset management.",
    content: [
      {
        type: "paragraph",
        text: "Exalt Exchange is being developed as a digital asset platform designed to bring trading, wallet services, P2P access, staking, and account management into one connected ecosystem.",
      },
      {
        type: "heading",
        text: "Spot Trading",
      },
      {
        type: "paragraph",
        text: "Spot trading allows users to buy and sell supported digital assets using available trading pairs. Orders are matched through the exchange trading system based on price and availability.",
      },
      {
        type: "heading",
        text: "Futures Trading",
      },
      {
        type: "paragraph",
        text: "The futures section is designed for users who want access to advanced trading tools. Futures trading involves increased risk and should only be used after understanding leverage, liquidation, and market volatility.",
      },
      {
        type: "heading",
        text: "P2P Services",
      },
      {
        type: "paragraph",
        text: "Peer-to-peer services allow eligible users to trade directly with other users through supported payment methods and platform controls.",
      },
      {
        type: "heading",
        text: "Web3 Wallet Access",
      },
      {
        type: "paragraph",
        text: "The Exalt Exchange Web3 wallet is designed to support wallet connections, token balances, transfers, transaction history, and decentralized asset access.",
      },
      {
        type: "heading",
        text: "Security and Compliance",
      },
      {
        type: "paragraph",
        text: "Account protection, identity verification, transaction monitoring, and risk controls are important parts of the platform architecture.",
      },
    ],
  },

  {
    id: "what-is-spot-trading",
    slug: "what-is-spot-trading",
    title: "What Is Spot Trading in Cryptocurrency?",
    excerpt:
      "Learn how cryptocurrency spot trading works, how orders are matched, and what users should consider before buying or selling digital assets.",
    category: "Spot Trading",
    tags: ["Spot Trading", "Crypto Education", "Trading Guide"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "5 min read",
    featured: false,
    image: spotTrading,
    imageAlt: "Cryptocurrency spot trading guide",
    seoTitle: "What Is Crypto Spot Trading? | Exalt Exchange Guide",
    seoDescription:
      "Learn how cryptocurrency spot trading works, including market orders, limit orders, trading pairs, liquidity, fees, and basic risk management.",
    content: [
      {
        type: "paragraph",
        text: "Spot trading is the direct purchase or sale of a digital asset at the current market price or at a price selected by the trader.",
      },
      {
        type: "heading",
        text: "Trading Pairs",
      },
      {
        type: "paragraph",
        text: "A trading pair represents two assets that can be exchanged. For example, a token paired with USDT allows users to view the token price in USDT.",
      },
      {
        type: "heading",
        text: "Market and Limit Orders",
      },
      {
        type: "paragraph",
        text: "A market order attempts to execute immediately at available prices. A limit order remains open until the market reaches the selected price or the order is cancelled.",
      },
      {
        type: "heading",
        text: "Liquidity",
      },
      {
        type: "paragraph",
        text: "Liquidity reflects how easily an asset can be bought or sold without causing a significant price movement.",
      },
      {
        type: "heading",
        text: "Trading Risk",
      },
      {
        type: "paragraph",
        text: "Digital asset prices can change rapidly. Traders should understand fees, liquidity, volatility, and order execution before placing a trade.",
      },
    ],
  },

  {
    id: "crypto-p2p-trading-guide",
    slug: "crypto-p2p-trading-guide",
    title: "A Beginner’s Guide to Cryptocurrency P2P Trading",
    excerpt:
      "Understand how peer-to-peer cryptocurrency trading works and how escrow, payment confirmation, and dispute management help protect users.",
    category: "P2P",
    tags: ["P2P", "Crypto Trading", "Escrow"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "6 min read",
    featured: false,
    image: p2pSecurity,
    imageAlt: "Cryptocurrency peer-to-peer trading guide",
    seoTitle: "Cryptocurrency P2P Trading Guide | Exalt Exchange",
    seoDescription:
      "Learn how cryptocurrency P2P trading works, including advertisements, escrow protection, payment confirmation, disputes, and user safety.",
    content: [
      {
        type: "paragraph",
        text: "Peer-to-peer trading allows buyers and sellers to trade directly while the platform provides tools for order management and transaction protection.",
      },
      {
        type: "heading",
        text: "P2P Advertisements",
      },
      {
        type: "paragraph",
        text: "Sellers may create offers that include the asset, price, available amount, payment method, and transaction limits.",
      },
      {
        type: "heading",
        text: "Escrow Protection",
      },
      {
        type: "paragraph",
        text: "During a P2P order, the digital asset may be temporarily locked until the required payment steps are completed.",
      },
      {
        type: "heading",
        text: "Payment Confirmation",
      },
      {
        type: "paragraph",
        text: "A seller should independently confirm that payment has been received before releasing the digital asset.",
      },
      {
        type: "heading",
        text: "Disputes",
      },
      {
        type: "paragraph",
        text: "If both parties cannot complete an order normally, a dispute process may be used to review order details and available evidence.",
      },
    ],
  },

  {
    id: "web3-wallet-security-guide",
    slug: "web3-wallet-security-guide",
    title: "How to Protect Your Web3 Wallet",
    excerpt:
      "Follow essential Web3 wallet security practices for private keys, seed phrases, wallet connections, token approvals, and transaction verification.",
    category: "Security",
    tags: ["Web3 Wallet", "Wallet Security", "Blockchain"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "7 min read",
    featured: false,
    image: web3Wallet,
    imageAlt: "Web3 wallet security guide",
    seoTitle: "How to Protect Your Web3 Wallet | Security Guide",
    seoDescription:
      "Learn how to protect your Web3 wallet, private keys, seed phrases, token approvals, wallet connections, and blockchain transactions.",
    content: [
      {
        type: "paragraph",
        text: "A Web3 wallet gives users direct control over blockchain assets. That control also means users are responsible for protecting wallet credentials and reviewing transactions.",
      },
      {
        type: "heading",
        text: "Protect Your Seed Phrase",
      },
      {
        type: "paragraph",
        text: "A seed phrase should never be shared through messages, email, websites, forms, or support chats.",
      },
      {
        type: "heading",
        text: "Verify Wallet Connections",
      },
      {
        type: "paragraph",
        text: "Before connecting a wallet, confirm the website domain and review the permissions being requested.",
      },
      {
        type: "heading",
        text: "Review Token Approvals",
      },
      {
        type: "paragraph",
        text: "Token approvals can grant applications permission to use wallet assets. Users should review and remove approvals that are no longer required.",
      },
      {
        type: "heading",
        text: "Confirm Every Transaction",
      },
      {
        type: "paragraph",
        text: "Always verify the destination address, blockchain network, token, amount, and estimated network fee before approving a transaction.",
      },
    ],
  },

  {
    id: "understanding-crypto-futures-risk",
    slug: "understanding-crypto-futures-risk",
    title: "Understanding Cryptocurrency Futures Trading Risk",
    excerpt:
      "Learn about leverage, liquidation, margin, market volatility, and other risks associated with cryptocurrency futures trading.",
    category: "Futures",
    tags: ["Futures", "Leverage", "Risk Management"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "7 min read",
    featured: false,
    image: futuresRisk,
    imageAlt: "Cryptocurrency futures trading risk guide",
    seoTitle: "Crypto Futures Trading Risks | Exalt Exchange Guide",
    seoDescription:
      "Understand cryptocurrency futures trading risks, including leverage, margin, liquidation, volatility, fees, and risk management.",
    content: [
      {
        type: "paragraph",
        text: "Cryptocurrency futures allow traders to take positions based on expected price movements without necessarily purchasing the underlying asset.",
      },
      {
        type: "heading",
        text: "Leverage",
      },
      {
        type: "paragraph",
        text: "Leverage increases market exposure but can also increase losses. A small adverse price movement may significantly reduce available margin.",
      },
      {
        type: "heading",
        text: "Liquidation",
      },
      {
        type: "paragraph",
        text: "A position may be liquidated when the available margin is no longer sufficient to maintain it.",
      },
      {
        type: "heading",
        text: "Market Volatility",
      },
      {
        type: "paragraph",
        text: "Cryptocurrency prices can move quickly, and futures positions may react more strongly because of leverage.",
      },
      {
        type: "heading",
        text: "Risk Management",
      },
      {
        type: "paragraph",
        text: "Traders should understand position size, margin requirements, stop-loss planning, fees, and liquidation risk before using futures products.",
      },
    ],
  },

  {
    id: "what-is-exalt-coin",
    slug: "what-is-exalt-coin",
    title: "What Is Exalt Coin?",
    excerpt:
      "Learn about Exalt Coin, its role within the Exalt ecosystem, its blockchain network, and the importance of verifying the official contract address.",
    category: "Exalt Coin",
    tags: ["Exalt Coin", "EXALT", "BNB Smart Chain"],
    author: "Exalt Exchange Team",
    publishedAt: "2026-07-29",
    updatedAt: "2026-07-29",
    readTime: "5 min read",
    featured: false,
    image: exaltCoin,
    imageAlt: "Exalt Coin ecosystem guide",
    seoTitle: "What Is Exalt Coin? | EXALT Ecosystem Guide",
    seoDescription:
      "Learn about Exalt Coin, its role in the Exalt ecosystem, its BNB Smart Chain contract, wallet support, and contract verification.",
    content: [
      {
        type: "paragraph",
        text: "Exalt Coin is a digital asset developed for use within the growing Exalt ecosystem.",
      },
      {
        type: "heading",
        text: "Blockchain Network",
      },
      {
        type: "paragraph",
        text: "Exalt Coin is deployed on BNB Smart Chain and uses the BEP-20 token standard.",
      },
      {
        type: "heading",
        text: "Official Contract Address",
      },
      {
        type: "paragraph",
        text: "The official Exalt Coin contract address is 0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78. Users should verify the full address before adding, buying, selling, or transferring the token.",
      },
      {
        type: "heading",
        text: "Ecosystem Utility",
      },
      {
        type: "paragraph",
        text: "The planned Exalt ecosystem includes exchange services, wallet access, trading features, community development, and future blockchain products.",
      },
      {
        type: "heading",
        text: "Important Risk Notice",
      },
      {
        type: "paragraph",
        text: "Digital assets are volatile and may lose value. Users should conduct independent research and verify all official information before making decisions.",
      },
    ],
  },
];

export const getBlogPostBySlug = (slug) =>
  blogPosts.find((post) => post.slug === slug);

export const getFeaturedBlogPost = () =>
  blogPosts.find((post) => post.featured) || blogPosts[0];

export const getLatestBlogPosts = (limit = 3) =>
  [...blogPosts]
    .sort(
      (firstPost, secondPost) =>
        new Date(secondPost.publishedAt) -
        new Date(firstPost.publishedAt)
    )
    .slice(0, limit);

export const getBlogPostsByCategory = (category) => {
  if (!category || category === "All") {
    return blogPosts;
  }

  return blogPosts.filter((post) => post.category === category);
};

export const searchBlogPosts = (query) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return blogPosts;
  }

  return blogPosts.filter((post) => {
    const searchableContent = [
      post.title,
      post.excerpt,
      post.category,
      post.author,
      ...post.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedQuery);
  });
};

export const getRelatedBlogPosts = (
  currentSlug,
  category,
  limit = 3
) => {
  const sameCategoryPosts = blogPosts.filter(
    (post) =>
      post.slug !== currentSlug &&
      post.category === category
  );

  if (sameCategoryPosts.length >= limit) {
    return sameCategoryPosts.slice(0, limit);
  }

  const additionalPosts = blogPosts.filter(
    (post) =>
      post.slug !== currentSlug &&
      post.category !== category &&
      !sameCategoryPosts.some(
        (relatedPost) => relatedPost.slug === post.slug
      )
  );

  return [...sameCategoryPosts, ...additionalPosts].slice(
    0,
    limit
  );
};