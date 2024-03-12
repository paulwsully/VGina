import React, { useState } from "react";
import { signInWithGoogle, signOutUser } from "./../Utilities/googleAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import "./TopBar.scss";

const TopBar = ({ user }) => {
  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  const handleSignOut = () => {
    signOutUser(() => {
      setMenuActive(false);
    });
  };

  return (
    <div className="topbar">
      <div className="user-or-signin">
        {user ? (
          <span>{user.displayName}</span>
        ) : (
          <div className="pill" onClick={signInWithGoogle}>
            Sign in
          </div>
        )}
      </div>
      {user && (
        <div className="user-options">
          <FontAwesomeIcon icon={faEllipsisV} onClick={toggleMenu} />
          <div className={`user-options-menu ${menuActive ? "active" : ""}`}>
            <div className="user-options-menu-item" onClick={handleSignOut}>
              Sign out
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
