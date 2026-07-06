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

export function getToken(symbol = "BNB") {
  return (
    DEFAULT_TOKENS.find(
      (token) => token.symbol.toUpperCase() === String(symbol).toUpperCase()
    ) || DEFAULT_TOKENS[0]
  );
}

export function getReadContract(tokenSymbol) {
  const token = getToken(tokenSymbol);

  if (token.native) return null;

  return new ethers.Contract(token.address, TOKEN_ABI, getBscProvider());
}

export function getWriteContract(tokenSymbol, signer) {
  const token = getToken(tokenSymbol);

  if (token.native) return null;

  return new ethers.Contract(token.address, TOKEN_ABI, signer);
}

export async function getNativeBalance(address) {
  if (!address) return 0;

  const provider = getBscProvider();
  const raw = await provider.getBalance(address);

  return Number(ethers.formatEther(raw));
}

export async function getTokenBalance(address, tokenSymbol) {
  if (!address) return 0;

  const token = getToken(tokenSymbol);

  if (token.native) {
    return getNativeBalance(address);
  }

  const contract = getReadContract(tokenSymbol);
  const raw = await contract.balanceOf(address);
  const decimals = token.decimals || (await contract.decimals());

  return Number(ethers.formatUnits(raw, decimals));
}

export async function getAllBalances(address) {
  const balances = {};

  for (const token of DEFAULT_TOKENS) {
    try {
      balances[token.symbol] = await getTokenBalance(address, token.symbol);
    } catch {
      balances[token.symbol] = 0;
    }
  }

  return balances;
}

export async function sendNative({ signer, to, amount }) {
  if (!signer) throw new Error("Signer is required.");
  if (!ethers.isAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(String(amount)),
  });

  return tx;
}

export async function sendToken({ signer, tokenSymbol, to, amount }) {
  if (!signer) throw new Error("Signer is required.");
  if (!ethers.isAddress(to)) throw new Error("Invalid receiver address.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const token = getToken(tokenSymbol);

  if (token.native) {
    return sendNative({ signer, to, amount });
  }

  const contract = getWriteContract(tokenSymbol, signer);
  const decimals = token.decimals || (await contract.decimals());

  const tx = await contract.transfer(to, ethers.parseUnits(String(amount), decimals));

  return tx;
}

export async function swapBnbToToken({ signer, tokenOutSymbol, walletAddress, amount }) {
  if (!signer) throw new Error("Signer is required.");
  if (!walletAddress) throw new Error("Wallet address is required.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tokenOut = getToken(tokenOutSymbol);

  if (tokenOut.native) {
    throw new Error("BNB to BNB swap is not allowed.");
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

export async function swapTokenToBnb({ signer, tokenInSymbol, walletAddress, amount }) {
  if (!signer) throw new Error("Signer is required.");
  if (!walletAddress) throw new Error("Wallet address is required.");
  if (!amount || Number(amount) <= 0) throw new Error("Invalid amount.");

  const tokenIn = getToken(tokenInSymbol);

  if (tokenIn.native) {
    throw new Error("Token input cannot be native BNB.");
  }

  const tokenContract = getWriteContract(tokenInSymbol, signer);
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