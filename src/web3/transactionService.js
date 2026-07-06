import { ethers } from "ethers";
import {
  DEFAULT_CHAIN_KEY,
  ROUTER_ABI,
  TOKEN_ABI,
  getChain,
} from "./web3Config";

import {
  getAllTokens,
  getTokenBySymbol,
  getNativeToken,
  getTokenBalanceKey,
  normalizeChainKey,
  normalizeSymbol,
} from "./tokens";

const REQUEST_TIMEOUT = 12000;

function withTimeout(promise, ms = REQUEST_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("RPC request timeout")), ms)
    ),
  ]);
}

export function getProvider(chainKey = DEFAULT_CHAIN_KEY) {
  const chain = getChain(chainKey);

  return new ethers.JsonRpcProvider(
    chain.rpc,
    {
      chainId: chain.chainId,
      name: chain.key,
    },
    {
      staticNetwork: true,
      batchMaxCount: 1,
    }
  );
}

export function isValidAddress(address = "") {
  return ethers.isAddress(String(address || "").trim());
}

export function getSignerFromPrivateKey(privateKey, chainKey = DEFAULT_CHAIN_KEY) {
  if (!privateKey) throw new Error("Private key missing.");
  return new ethers.Wallet(privateKey, getProvider(chainKey));
}

export function getChainRouter(chainKey = DEFAULT_CHAIN_KEY) {
  return getChain(chainKey).router || "";
}

export function getExplorerTx(hash, chainKey = DEFAULT_CHAIN_KEY) {
  const chain = getChain(chainKey);
  return hash ? `${chain.explorer}/tx/${hash}` : chain.explorer;
}

export function getExplorerAddress(address, chainKey = DEFAULT_CHAIN_KEY) {
  const chain = getChain(chainKey);
  return address ? `${chain.explorer}/address/${address}` : chain.explorer;
}

export function getTokenContract(token, providerOrSigner) {
  if (!token?.address) {
    throw new Error(`${token?.symbol || "Token"} contract address missing.`);
  }

  return new ethers.Contract(token.address, TOKEN_ABI, providerOrSigner);
}

export async function getNativeBalance(address, chainKey = DEFAULT_CHAIN_KEY) {
  try {
    if (!isValidAddress(address)) return 0;

    const provider = getProvider(chainKey);
    const raw = await withTimeout(provider.getBalance(address));

    return Number(ethers.formatEther(raw));
  } catch (error) {
    console.warn(`${chainKey} native balance error:`, error.message);
    return 0;
  }
}

export async function getTokenBalance(address, token) {
  try {
    if (!isValidAddress(address) || !token) return 0;
    if (token.marketOnly || token.watchOnly) return 0;

    const chainKey = normalizeChainKey(
      token.chainKey || token.chain || DEFAULT_CHAIN_KEY
    );

    if (token.native) {
      return await getNativeBalance(address, chainKey);
    }

    if (!isValidAddress(token.address)) return 0;

    const provider = getProvider(chainKey);
    const contract = getTokenContract(token, provider);

    const raw = await withTimeout(contract.balanceOf(address));
    const decimals = Number(token.decimals || 18);

    return Number(ethers.formatUnits(raw, decimals));
  } catch (error) {
    console.warn(
      `${token?.symbol || "TOKEN"} ${token?.chainKey || ""} balance error:`,
      error.message
    );
    return 0;
  }
}

export async function getAllBalances(address, chainKey = "") {
  const balances = {};

  if (!isValidAddress(address)) return balances;

  const selectedChain = chainKey ? normalizeChainKey(chainKey) : "";
const tokens = getAllTokens().filter((token) => {
  if (token.marketOnly || token.watchOnly) return false;

  if (!selectedChain) return true;

  return normalizeChainKey(token.chainKey || token.chain) === selectedChain;
});
  
  const results = await Promise.allSettled(
    tokens.map(async (token) => {
      const balance = await getTokenBalance(address, token);
      return { token, balance };
    })
  );

  results.forEach((result) => {
    if (result.status !== "fulfilled") return;

    const { token, balance } = result.value;
    const key = getTokenBalanceKey(token);
    const chainSymbolKey = `${token.chainKey}:${token.symbol}`;
    const addressKey = `${token.chainKey}:${String(token.address || "").toLowerCase()}`;

    balances[key] = balance;
    balances[token.id] = balance;
    balances[chainSymbolKey] = balance;
    balances[addressKey] = balance;

    if (token.chainKey === DEFAULT_CHAIN_KEY) {
      balances[token.symbol] = balance;
    }
  });

  return balances;
}

export async function sendNative({
  signer,
  to,
  amount,
  chainKey = DEFAULT_CHAIN_KEY,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(String(amount)),
  });

  return { tx, chainKey, hash: tx.hash };
}

export async function sendToken({
  signer,
  token,
  tokenSymbol,
  to,
  amount,
  chainKey = DEFAULT_CHAIN_KEY,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const finalToken =
    token ||
    getTokenBySymbol(
      normalizeSymbol(tokenSymbol || getNativeToken(chainKey).symbol),
      chainKey
    );

  const finalChainKey = normalizeChainKey(finalToken.chainKey || chainKey);

if (finalToken.marketOnly || finalToken.watchOnly) {
  throw new Error("This coin is market/watchlist only. Import the real contract token first.");
}
  if (finalToken.native) {
    return sendNative({ signer, to, amount, chainKey: finalChainKey });
  }

  const contract = getTokenContract(finalToken, signer);
  const parsedAmount = ethers.parseUnits(
    String(amount),
    Number(finalToken.decimals || 18)
  );

  const tx = await contract.transfer(to, parsedAmount);

  return { tx, chainKey: finalChainKey, hash: tx.hash };
}

export async function waitForTransaction(txOrResult) {
  const tx = txOrResult?.tx || txOrResult;
  if (!tx?.wait) throw new Error("Invalid transaction.");
  return tx.wait();
}

export async function readTokenMetadata(address, chainKey = DEFAULT_CHAIN_KEY) {
  if (!isValidAddress(address)) {
    throw new Error("Invalid token contract address.");
  }

  const finalChainKey = normalizeChainKey(chainKey);
  const provider = getProvider(finalChainKey);
  const contract = new ethers.Contract(address, TOKEN_ABI, provider);

  const [name, symbol, decimals] = await Promise.all([
    withTimeout(contract.name()).catch(() => "Unknown Token"),
    withTimeout(contract.symbol()).catch(() => "TOKEN"),
    withTimeout(contract.decimals()).catch(() => 18),
  ]);

  return {
    name,
    symbol: normalizeSymbol(symbol),
    decimals: Number(decimals || 18),
    address,
    chainKey: finalChainKey,
    native: false,
  };
}

export async function estimateNativeGas({ signer, to, amount }) {
  try {
    if (!signer || !isValidAddress(to)) return null;

    return await signer.estimateGas({
      to,
      value: ethers.parseEther(String(amount || 0)),
    });
  } catch {
    return null;
  }
}

export async function getTokenAllowance({
  token,
  owner,
  spender,
  chainKey = DEFAULT_CHAIN_KEY,
}) {
  try {
    if (!token || token.native) return 0;
    if (!isValidAddress(owner) || !isValidAddress(spender)) return 0;

    const provider = getProvider(chainKey);
    const contract = getTokenContract(token, provider);
    const raw = await withTimeout(contract.allowance(owner, spender));

    return Number(ethers.formatUnits(raw, Number(token.decimals || 18)));
  } catch {
    return 0;
  }
}

export async function approveToken({ signer, token, spender, amount }) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!token || token.native) throw new Error("Token approval not required.");
  if (!isValidAddress(spender)) throw new Error("Invalid spender address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid approval amount.");

  const contract = getTokenContract(token, signer);
  const parsedAmount = ethers.parseUnits(
    String(amount),
    Number(token.decimals || 18)
  );

  return contract.approve(spender, parsedAmount);
}

export async function swapNativeToToken({
  signer,
  tokenOut,
  walletAddress,
  amount,
  chainKey = DEFAULT_CHAIN_KEY,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidAddress(walletAddress)) throw new Error("Invalid wallet address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const finalChainKey = normalizeChainKey(chainKey);
  const routerAddress = getChainRouter(finalChainKey);

  if (!routerAddress) {
    throw new Error("Swap router is not enabled on this network yet.");
  }
if (tokenOut.marketOnly || tokenOut.watchOnly) {
  throw new Error("Market/watchlist coins cannot be swapped.");
}

  if (!tokenOut?.address || tokenOut.native) {
    throw new Error("Invalid output token.");
  }

  const chain = getChain(finalChainKey);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
    0,
    [chain.wrappedNative, tokenOut.address],
    walletAddress,
    deadline,
    { value: ethers.parseEther(String(amount)) }
  );

  return { tx, hash: tx.hash, chainKey: finalChainKey };
}

export async function swapTokenToNative({
  signer,
  tokenIn,
  walletAddress,
  amount,
  chainKey = DEFAULT_CHAIN_KEY,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidAddress(walletAddress)) throw new Error("Invalid wallet address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const finalChainKey = normalizeChainKey(chainKey);
  const routerAddress = getChainRouter(finalChainKey);

  if (!routerAddress) {
    throw new Error("Swap router is not enabled on this network yet.");
  }
if (tokenIn.marketOnly || tokenIn.watchOnly) {
  throw new Error("Market/watchlist coins cannot be swapped.");
}

  if (!tokenIn?.address || tokenIn.native) {
    throw new Error("Invalid input token.");
  }

  const chain = getChain(finalChainKey);
  const tokenContract = getTokenContract(tokenIn, signer);
  const decimals = Number(tokenIn.decimals || 18);
  const amountIn = ethers.parseUnits(String(amount), decimals);

  const approveTx = await tokenContract.approve(routerAddress, amountIn);
  await approveTx.wait();

  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn,
    0,
    [tokenIn.address, chain.wrappedNative],
    walletAddress,
    deadline
  );

  return { tx, hash: tx.hash, chainKey: finalChainKey };
}

export async function swapBnbToToken({
  signer,
  tokenOutSymbol,
  tokenOut,
  walletAddress,
  amount,
}) {
  const finalToken =
    tokenOut || getTokenBySymbol(tokenOutSymbol || "EXALT", DEFAULT_CHAIN_KEY);

  return swapNativeToToken({
    signer,
    tokenOut: finalToken,
    walletAddress,
    amount,
    chainKey: DEFAULT_CHAIN_KEY,
  });
}

export async function swapTokenToBnb({
  signer,
  tokenInSymbol,
  tokenIn,
  walletAddress,
  amount,
}) {
  const finalToken =
    tokenIn || getTokenBySymbol(tokenInSymbol || "EXALT", DEFAULT_CHAIN_KEY);

  return swapTokenToNative({
    signer,
    tokenIn: finalToken,
    walletAddress,
    amount,
    chainKey: DEFAULT_CHAIN_KEY,
  });
}

export function buildExplorerTx(hash, chainKey = DEFAULT_CHAIN_KEY) {
  return getExplorerTx(hash, chainKey);
}

export function buildExplorerAddress(address, chainKey = DEFAULT_CHAIN_KEY) {
  return getExplorerAddress(address, chainKey);
}

export function buildTransactionPayload({
  type = "Transaction",
  token,
  amount,
  hash,
  wallet,
  chainKey = DEFAULT_CHAIN_KEY,
  status = "pending",
}) {
  return {
    type,
    hash,
    amount,
    coin: token?.symbol || getChain(chainKey).symbol || "BNB",
    status,
    wallet,
    chain: getChain(chainKey).network || chainKey,
    chainKey,
    note: token?.custom ? "Custom token transaction" : "",
  };
}

export default {
  getProvider,
  isValidAddress,
  getSignerFromPrivateKey,
  getChainRouter,
  getExplorerTx,
  getExplorerAddress,
  getNativeBalance,
  getTokenBalance,
  getAllBalances,
  sendNative,
  sendToken,
  waitForTransaction,
  readTokenMetadata,
  estimateNativeGas,
  getTokenAllowance,
  approveToken,
  swapNativeToToken,
  swapTokenToNative,
  swapBnbToToken,
  swapTokenToBnb,
  buildExplorerTx,
  buildExplorerAddress,
  buildTransactionPayload,
};