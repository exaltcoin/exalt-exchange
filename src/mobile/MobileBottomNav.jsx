import { NavLink } from "react-router-dom";

export default function MobileBottomNav() {
  return (
    <div className="mobile-bottom-nav">

      <NavLink to="/mobile">
        Home
      </NavLink>

      <NavLink to="/mobile/markets">
        Markets
      </NavLink>

      <NavLink to="/mobile/trade">
        Trade
      </NavLink>

      <NavLink to="/mobile/wallets">
        Wallets
      </NavLink>

      <NavLink to="/mobile/profile">
        Profile
      </NavLink>

    </div>
  );
}