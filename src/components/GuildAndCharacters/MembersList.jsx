import React from "react";

export const MembersList = ({ label, members }) => {
  return (
    <div className={`guild-${label}`}>
      <h4>
        Guild {label} ({members?.length})
      </h4>
      {members?.length > 0 &&
        members.map((member) => {
          return <div key={member.id}>{member.name}</div>;
        })}
    </div>
  );
};
