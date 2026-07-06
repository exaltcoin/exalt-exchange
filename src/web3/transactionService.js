import { ethers } from "ethers";
import {
  BSC_CHAIN,
  DEFAULT_TOKENS,
  PANCAKE_ROUTER,
  ROUTER_ABI,
  TOKEN_ABI,
} from "./web3Config";

export function getBscProvider() {
  return new ethers.JsonRpcProvider(BSC_CHAIN.rpc);
}

export function isValidBscAddress(address = "") {
  return ethers.isAddress(address);
}

export function getToken(symbol = "BNB") {
  const target = String(symbol || "BNB").toUpperCase();

  return (
    DEFAULT_TOKENS.find((token) => token.symbol.toUpperCase() === target) ||
    DEFAULT_TOKENS[0]
  );
}

export function getTokenAddress(symbol = "BNB") {
  return getToken(symbol)?.address || "";
}

export function getReadContract(tokenSymbol) {
  const token = getToken(tokenSymbol);
  if (token.native) return null;

  if (!token.address) {
    throw new Error(`${token.symbol} contract address missing.`);
  }

  return new ethers.Contract(token.address, TOKEN_ABI, getBscProvider());
}

export function getWriteContract(tokenSymbol, signer) {
  const token = getToken(tokenSymbol);
  if (token.native) return null;

  if (!signer) throw new Error("Signer is required.");
  if (!token.address) throw new Error(`${token.symbol} contract address missing.`);

  return new ethers.Contract(token.address, TOKEN_ABI, signer);
}

export async function getNativeBalance(address) {
  if (!isValidBscAddress(address)) return 0;

  const provider = getBscProvider();
  const raw = await provider.getBalance(address);

  return Number(ethers.formatEther(raw));
}

export async function getTokenBalance(address, tokenSymbol) {
  if (!isValidBscAddress(address)) return 0;

  const token = getToken(tokenSymbol);

  if (token.native) {
    return getNativeBalance(address);
  }

  try {
    const contract = getReadContract(tokenSymbol);
    const raw = await contract.balanceOf(address);
    const decimals = token.decimals || (await contract.decimals());

    return Number(ethers.formatUnits(raw, decimals));
  } catch (error) {
    console.log(`${token.symbol} balance error:`, error);
    return 0;
  }
}

export async function getAllBalances(address) {
  const balances = {};

  for (const token of DEFAULT_TOKENS) {
    balances[token.symbol] = await getTokenBalance(address, token.symbol);
  }

  return balances;
}

export async function sendNative({ signer, to, amount }) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidBscAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  return signer.sendTransaction({
    to,
    value: ethers.parseEther(String(amount)),
  });
}

export async function sendToken({ signer, tokenSymbol, to, amount }) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidBscAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const token = getToken(tokenSymbol);

  if (token.native) {
    return sendNative({ signer, to, amount });
  }

  const contract = getWriteContract(token.symbol, signer);
  const decimals = token.decimals || (await contract.decimals());
  const parsedAmount = ethers.parseUnits(String(amount), decimals);

  return contract.transfer(to, parsedAmount);
}

export async function swapBnbToToken({
  signer,
  tokenOutSymbol,
  walletAddress,
  amount,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidBscAddress(walletAddress)) throw new Error("Invalid wallet address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tokenOut = getToken(tokenOutSymbol);

  if (tokenOut.native) {
    throw new Error("BNB to BNB swap is not allowed.");
  }

  if (!tokenOut.address) {
    throw new Error(`${tokenOut.symbol} contract address missing.`);
  }

  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  return router.swapExactETHForTokensSupportingFeeOnTransferTokens(
    0,
    [getToken("BNB").address, tokenOut.address],
    walletAddress,
    deadline,
    { value: ethers.parseEther(String(amount)) }
  );
}

export async function swapTokenToBnb({
  signer,
  tokenInSymbol,
  walletAddress,
  amount,
}) {
  if (!signer) throw new Error("Exalt Wallet signer is required.");
  if (!isValidBscAddress(walletAddress)) throw new Error("Invalid wallet address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tokenIn = getToken(tokenInSymbol);

  if (tokenIn.native) {
    throw new Error("Token input cannot be native BNB.");
  }

  if (!tokenIn.address) {
    throw new Error(`${tokenIn.symbol} contract address missing.`);
  }

  const tokenContract = getWriteContract(tokenIn.symbol, signer);
  const decimals = tokenIn.decimals || (await tokenContract.decimals());
  const amountIn = ethers.parseUnits(String(amount), decimals);

  const approveTx = await tokenContract.approve(PANCAKE_ROUTER, amountIn);
  await approveTx.wait();

  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  return router.swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn,
    0,
    [tokenIn.address, getToken("BNB").address],
    walletAddress,
    deadline
  );
}

export async function waitForTransaction(tx) {
  if (!tx?.wait) throw new Error("Invalid transaction.");
  return tx.wait();
}

export function buildExplorerTx(hash) {
  if (!hash) return BSC_CHAIN.explorer;
  return `${BSC_CHAIN.explorer}/tx/${hash}`;
}

export function buildExplorerAddress(address) {
  if (!address) return BSC_CHAIN.explorer;
  return `${BSC_CHAIN.explorer}/address/${address}`;
}