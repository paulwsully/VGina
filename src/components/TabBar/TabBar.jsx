import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Tabs.scss";

const TabBar = ({ tabs }) => {
  const underlineRef = useRef(null);
  const tabBarRef = useRef(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(null);

  const updateUnderline = () => {
    if (underlineRef.current && (activeTab || location.pathname === "/")) {
      const target = activeTab || tabBarRef.current.querySelector(".tab");
      underlineRef.current.style.width = `${target.offsetWidth}px`;
      underlineRef.current.style.left = `${target.offsetLeft}px`;
    }
  };

  const handleTabClick = (event) => {
    setActiveTab(event.target);
  };

  useEffect(() => {
    const initialTab = tabBarRef.current.querySelector(".tab");
    if (initialTab) {
      setActiveTab(initialTab);
    }
    updateUnderline();
  }, []);

  useEffect(() => {
    updateUnderline();
  }, [activeTab, location]);

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? "tab active" : "tab";
  };

  const handleMouseOver = (event) => {
    if (event.target.classList.contains("tab")) {
      setActiveTab(event.target);
    }
  };

  const handleMouseOut = () => {
    if (activeTab) {
      updateUnderline();
    }
  };

  return (
    <div className="tab-bar" ref={tabBarRef} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      {tabs.map((tab) => (
        <NavLink
          data-text={tab.label}
          key={tab.path}
          to={tab.path}
          className={getNavLinkClass}
          onClick={handleTabClick}
        >
          {tab.label}
        </NavLink>
      ))}
      <div id="underline" ref={underlineRef}></div>
    </div>
  );
};

export default TabBar;
