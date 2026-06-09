import { Outlet } from "react-router-dom";
import MobileBottomNav from "./MobileBottomNav";
import "./Mobile.css";

export default function MobileLayout() {
  return (
    <div className="mobile-layout">
      <div className="mobile-content">
        <Outlet />
      </div>

      <MobileBottomNav />
    </div>
  );
}