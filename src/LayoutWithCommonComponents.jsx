import React from "react";
import { Outlet } from "react-router-dom";
import RedirectToHome from "./RedirectToHome";
import TitleBar from "./components/TitleBar/TitleBar";
import TopBar from "./components/TopBar/TopBar";
import TabBar from "./components/TabBar/TabBar";

function LayoutWithCommonComponents({ fileName, tabs, user }) {
  return (
    <>
      {fileName && <RedirectToHome fileName={fileName} />}
      <TitleBar fileName={fileName} />
      <TopBar user={user} />
      {fileName && <TabBar tabs={tabs} user={user} />}
      <div className={`content ${fileName ? "" : "no-file"}`}>
        <Outlet />
      </div>
    </>
  );
}

export default LayoutWithCommonComponents;
