import React from "react";
import { Outlet } from "react-router-dom";
import RedirectToHome from "./RedirectToHome";
import TitleBar from "./components/TitleBar/TitleBar";
import TabBar from "./components/TabBar/TabBar";

function LayoutWithCommonComponents({ fileName, tabs }) {
  return (
    <>
      {fileName && <RedirectToHome fileName={fileName} />}
      <TitleBar fileName={fileName} />
      {fileName && <TabBar tabs={tabs} />}
      <div className={`content ${fileName ? "" : "no-file"}`}>
        <Outlet />
      </div>
    </>
  );
}

export default LayoutWithCommonComponents;
