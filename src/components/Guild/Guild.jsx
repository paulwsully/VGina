import React from "react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import "./Guild.scss";

function Guild({ user }) {
  const [guild, setguild] = useState(null);

  if (!user) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="guild-wrapper">
      <div className="guild-container">
        {guild ? (
          <div className="guild">
            <div className="guild-name">{guild.name}</div>
          </div>
        ) : (
          <div className="no-guild">
            <div className="null-message">It looks like you're not in a guild</div>
            <div className="guild-actions">
              <div className="pill">Join a Guild</div>
              <div className="pill">Create a Guild</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Guild;
