/*
  Extracted from app.jsx so the real navigation-building logic used
  by the live shell is directly unit-testable, without needing to
  mount the entire ~2000-line App component (which makes real
  network calls, reads localStorage, etc. on mount).

  This does NOT introduce a second navigation data source - the
  menuItems/adminMenuItems/etc. tuples still live only in app.jsx
  and are passed in as arguments; this module only owns the pure
  transform (icon/label parsing + gating + shape conversion) that
  used to be four copy-pasted inline blocks.
*/

export const toNavItem = ([key, label], translate, onSelect) => {
  const firstSpaceIndex = label.indexOf(" ");
  const icon = firstSpaceIndex >= 0 ? label.slice(0, firstSpaceIndex) : "";
  const fallbackLabel =
    firstSpaceIndex >= 0 ? label.slice(firstSpaceIndex + 1) : label;

  return {
    key,
    icon,
    label: translate(key, fallbackLabel, "navigation"),
    onClick: () => onSelect(key),
  };
};

/*
  buildShellNavItems: combines the base menu with each
  access-gated menu (admin/owner/super-admin/moderator), in the
  exact same order and with the exact same gating as the original
  inline JSX did. `access` flags are booleans the caller already
  computes from the real user object (checkAdminAccess, etc.) -
  this function makes no authorization decisions of its own, it
  only decides whether to include a given menu's items based on
  the flag it's given.
*/
export const buildShellNavItems = ({
  menuItems,
  adminMenuItems = [],
  ownerMenuItems = [],
  superAdminMenuItems = [],
  moderatorMenuItems = [],
  access = {},
  translate,
  onSelect,
}) => {
  const convert = (tuples) =>
    tuples.map((tuple) => toNavItem(tuple, translate, onSelect));

  return [
    ...convert(menuItems),
    ...(access.admin ? convert(adminMenuItems) : []),
    ...(access.owner ? convert(ownerMenuItems) : []),
    ...(access.superAdmin ? convert(superAdminMenuItems) : []),
    ...(access.moderator ? convert(moderatorMenuItems) : []),
  ];
};

export default buildShellNavItems;
