import React, { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import "./Tabs.scss";

const TabBar = ({ tabs, user }) => {
  const [activeTab, setActiveTab] = useState(null);

  const handleTabClick = useCallback((event) => {
    const targetTab = event.target.closest(".tab");
    if (targetTab) {
      setActiveTab(targetTab);
      window.electron.ipcRenderer.send("set-last-tab", targetTab.getAttribute("href"));
    }
  }, []);

  const getNavLinkClass = useCallback(({ isActive }) => {
    return isActive ? "tab active" : "tab";
  }, []);

  useEffect(() => {
    // This effect is for initializing the active tab based on the last tab or defaults.
    window.electron.ipcRenderer
      .invoke("get-last-tab")
      .then((lastTab) => {
        const lastActiveTabElement = lastTab ? document.querySelector(`[href='${lastTab}']`) : null;
        if (lastActiveTabElement) {
          setActiveTab(lastActiveTabElement);
        } else {
          const initialTab = document.querySelector(".tab");
          if (initialTab) {
            setActiveTab(initialTab);
          }
        }
      })
      .catch((error) => {
        console.error("Error getting last tab:", error);
      });
  }, []);

  return (
    <div className="tabbar">
      {tabs.map((tab) => {
        if (!user && tab.label === "DKP & Loot") {
          return null;
        }
        return (
          <NavLink key={tab.path} to={tab.path} className={getNavLinkClass} onClick={handleTabClick}>
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
};

export default TabBar;
