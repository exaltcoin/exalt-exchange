const ADDRESS_BOOK_KEY = "exalt_address_book_v1";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getAddressBook() {
  const list = safeJsonParse(localStorage.getItem(ADDRESS_BOOK_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveAddressBook(list = []) {
  const clean = Array.isArray(list) ? list : [];
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(clean));
  return clean;
}

export function addAddressBookContact({
  name = "",
  address = "",
  network = "BSC",
  chainKey = "bsc",
  note = "",
  favorite = false,
}) {
  const cleanName = String(name || "").trim();
  const cleanAddress = String(address || "").trim();

  if (!cleanName) throw new Error("Contact name is required.");
  if (!cleanAddress) throw new Error("Wallet address is required.");

  const list = getAddressBook();

  const exists = list.some(
    (item) =>
      String(item.address || "").toLowerCase() === cleanAddress.toLowerCase() &&
      String(item.chainKey || "").toLowerCase() === String(chainKey).toLowerCase()
  );

  if (exists) {
    throw new Error("This address is already saved for this network.");
  }

  const contact = {
    id: makeId(),
    name: cleanName,
    address: cleanAddress,
    network,
    chainKey,
    note,
    favorite: Boolean(favorite),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [contact, ...list];
  saveAddressBook(updated);
  return updated;
}

export function updateAddressBookContact(id, updates = {}) {
  const list = getAddressBook();

  const updated = list.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveAddressBook(updated);
  return updated;
}

export function deleteAddressBookContact(id) {
  const updated = getAddressBook().filter((item) => item.id !== id);
  saveAddressBook(updated);
  return updated;
}

export function toggleAddressFavorite(id) {
  const list = getAddressBook();

  const updated = list.map((item) =>
    item.id === id
      ? {
          ...item,
          favorite: !item.favorite,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveAddressBook(updated);
  return updated;
}

export function searchAddressBook(query = "", chainKey = "") {
  const q = String(query || "").toLowerCase();
  const chain = String(chainKey || "").toLowerCase();

  return getAddressBook()
    .filter((item) => {
      const matchChain = !chain || String(item.chainKey || "").toLowerCase() === chain;
      const text = `${item.name || ""} ${item.address || ""} ${item.network || ""} ${item.note || ""}`.toLowerCase();
      const matchQuery = !q || text.includes(q);
      return matchChain && matchQuery;
    })
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
}

export default {
  getAddressBook,
  saveAddressBook,
  addAddressBookContact,
  updateAddressBookContact,
  deleteAddressBookContact,
  toggleAddressFavorite,
  searchAddressBook,
};