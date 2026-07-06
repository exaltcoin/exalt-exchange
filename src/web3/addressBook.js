const ADDRESS_BOOK_KEY = "exalt_web3_address_book";

export function safeAddressBookParse(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getAddressBook() {
  return safeAddressBookParse(localStorage.getItem(ADDRESS_BOOK_KEY), []);
}

export function saveAddressBook(list = []) {
  const cleanList = Array.isArray(list) ? list : [];
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(cleanList));
  return cleanList;
}

export function addAddressBookContact({
  name = "",
  address = "",
  network = "BSC",
  note = "",
}) {
  if (!name.trim()) throw new Error("Contact name is required.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid BSC wallet address.");
  }

  const list = getAddressBook();
  const exists = list.some(
    (item) => item.address.toLowerCase() === address.toLowerCase()
  );

  if (exists) throw new Error("Address already exists.");

  const contact = {
    id: Date.now(),
    name: name.trim(),
    address,
    network,
    note,
    createdAt: new Date().toISOString(),
  };

  const updated = [contact, ...list];
  saveAddressBook(updated);

  return updated;
}

export function removeAddressBookContact(id) {
  const updated = getAddressBook().filter((item) => String(item.id) !== String(id));
  saveAddressBook(updated);
  return updated;
}

export function searchAddressBook(query = "") {
  const q = query.toLowerCase();

  return getAddressBook().filter((item) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q) ||
      String(item.note || "").toLowerCase().includes(q)
    );
  });
}