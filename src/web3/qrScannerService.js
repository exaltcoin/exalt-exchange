import { BrowserMultiFormatReader } from "@zxing/browser";

let reader = null;

export function createScanner() {
  if (!reader) {
    reader = new BrowserMultiFormatReader();
  }

  return reader;
}

export async function startQRScanner(videoElement, onResult, onError) {
  try {
    const scanner = createScanner();

    await scanner.decodeFromVideoDevice(
      undefined,
      videoElement,
      (result, error) => {
        if (result) {
          onResult?.(result.getText());
        }

        if (error && error.name !== "NotFoundException") {
          onError?.(error);
        }
      }
    );

    return true;
  } catch (error) {
    console.log("QR Scanner Error:", error);
    onError?.(error);
    return false;
  }
}

export function stopQRScanner() {
  try {
    if (reader) {
      reader.reset();
    }
  } catch (error) {
    console.log(error);
  }
}

export function isWalletAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || ""));
}

export function parseQRCode(text) {
  const value = String(text || "").trim();

  if (isWalletAddress(value)) {
    return {
      type: "wallet",
      address: value,
    };
  }

  if (value.startsWith("ethereum:")) {
    const address = value.replace("ethereum:", "").split("?")[0];

    return {
      type: "wallet",
      address,
    };
  }

  if (value.startsWith("bitcoin:")) {
    return {
      type: "bitcoin",
      address: value.replace("bitcoin:", "").split("?")[0],
    };
  }

  if (value.startsWith("tron:")) {
    return {
      type: "tron",
      address: value.replace("tron:", "").split("?")[0],
    };
  }

  return {
    type: "text",
    value,
  };
}

export async function scanImage(file) {
  try {
    const scanner = createScanner();

    const result = await scanner.decodeFromImageUrl(
      URL.createObjectURL(file)
    );

    return parseQRCode(result.getText());
  } catch (error) {
    console.log(error);
    return null;
  }
}