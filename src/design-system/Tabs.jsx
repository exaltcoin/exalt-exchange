import { useId, useRef } from "react";
import "./Tabs.css";

/*
  tabs: [{ id, label, disabled? }]
  Controlled component - the caller owns `activeId` and receives
  onChange(id). This component does not decide what content to
  show for a tab; the caller renders that from real state.
*/
export const Tabs = ({
  tabs,
  activeId,
  onChange,
  className = "",
  ariaLabel = "Tabs",
}) => {
  const groupId = useId();
  const tabRefs = useRef({});

  const enabledIds = tabs.filter((t) => !t.disabled).map((t) => t.id);

  const focusAndSelect = (id) => {
    onChange(id);
    tabRefs.current[id]?.focus();
  };

  const handleKeyDown = (event) => {
    const currentIndex = enabledIds.indexOf(activeId);
    if (currentIndex === -1) return;

    let nextIndex = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledIds.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + enabledIds.length) % enabledIds.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledIds.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      focusAndSelect(enabledIds[nextIndex]);
    }
  };

  return (
    <div
      className={`ex2-tabs ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            id={`${groupId}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${groupId}-panel-${tab.id}`}
            disabled={tab.disabled}
            tabIndex={selected ? 0 : -1}
            className={`ex2-tabs__tab ${selected ? "ex2-tabs__tab--active" : ""}`}
            onClick={() => !tab.disabled && onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export const TabPanel = ({ id, activeId, groupId, children }) => {
  if (id !== activeId) return null;

  return (
    <div
      role="tabpanel"
      id={groupId ? `${groupId}-panel-${id}` : undefined}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

export default Tabs;
