import React, { useEffect, useRef, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import "./Tabs.scss";

const TabBar = ({ tabs }) => {
  const underlineRef = useRef(null);
  const tabBarRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);
  const [hoverTab, setHoverTab] = useState(null);

  const updateUnderline = (tab) => {
    if (underlineRef.current && tab) {
      underlineRef.current.style.width = `${tab.offsetWidth}px`;
      underlineRef.current.style.left = `${tab.offsetLeft}px`;
    }
  };

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

  const handleMouseOver = useCallback((event) => {
    const targetTab = event.target.closest(".tab");
    if (targetTab) {
      setHoverTab(targetTab);
    }
  }, []);

  const handleMouseOut = useCallback(() => {
    setHoverTab(null);
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("get-last-tab")
      .then((lastTab) => {
        const lastActiveTabElement = lastTab ? tabBarRef.current.querySelector(`[href='${lastTab}']`) : null;

        if (hoverTab) {
          updateUnderline(hoverTab);
        } else if (activeTab) {
          updateUnderline(activeTab);
        } else if (lastActiveTabElement) {
          setActiveTab(lastActiveTabElement);
          updateUnderline(lastActiveTabElement);
        } else {
          const initialTab = tabBarRef.current.querySelector(".tab");
          if (initialTab) {
            setActiveTab(initialTab);
          }
        }
      })
      .catch((error) => {
        console.error("Error getting last tab:", error);
      });
  }, [hoverTab]);

  return (
    <div className="tab-bar" ref={tabBarRef} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      {tabs.map((tab) => (
        <NavLink key={tab.path} to={tab.path} className={getNavLinkClass} onClick={handleTabClick}>
          {tab.label}
        </NavLink>
      ))}
      <div id="underline" ref={underlineRef}></div>
    </div>
  );
};

export default TabBar;
