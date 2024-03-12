import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RedirectToHome({ logDirectory }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logDirectoryRef = useRef(logDirectory);
  const lastNavigationPath = useRef(location.pathname);

  useEffect(() => {
    logDirectoryRef.current = logDirectory;
  }, [logDirectory]);

  useEffect(() => {
    if (location.pathname !== "/dkp-and-loot/overlay/bids" && logDirectoryRef.current) {
      window.electron.ipcRenderer
        .invoke("get-last-tab")
        .then((lastTab) => {
          if (location.pathname !== lastTab && lastNavigationPath.current !== lastTab) {
            navigate(lastTab || "/triggers");
            lastNavigationPath.current = lastTab || "/triggers";
          }
        })
        .catch((error) => {
          console.error("Error getting last tab:", error);
          if (location.pathname !== "/") {
            navigate("/");
            lastNavigationPath.current = "/";
          }
        });
    }
  }, [location.pathname, navigate, logDirectory]);

  return null;
}

export default RedirectToHome;
