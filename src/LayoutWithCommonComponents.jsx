import React from "react";
import { Outlet } from "react-router-dom";
import TitleBar from "./components/TitleBar/TitleBar";
import TopBar from "./components/TopBar/TopBar";
import TabBar from "./components/TabBar/TabBar";

function LayoutWithCommonComponents({ tabs, user }) {
  return (
    <>
      <TitleBar />
      <TopBar user={user} />
      <TabBar tabs={tabs} user={user} />
      <div className={`content`}>
        <Outlet />
      </div>
    </>
  );
}

export default LayoutWithCommonComponents;
