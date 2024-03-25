import React from "react";
import { MembersList } from "./MembersList";

export const CurrentGuild = ({ currentGuild }) => {
  return (
    <div className="guild-wrapper">
      <h2>{currentGuild.name}</h2>
      <div className="guild-details">
        <div className="members">
          <div className="guild-invite">
            <div className="pill">Invite Members</div>
          </div>
          {console.log(currentGuild)}
          <MembersList label="leaders" members={currentGuild.leaders} />
          <MembersList label="officers" members={currentGuild.officers} />
          <MembersList label="members" members={currentGuild.members} />
        </div>
      </div>
    </div>
  );
};
