import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RedirectToHome({ fileName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileNameRef = useRef(fileName);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  useEffect(() => {
    if (location.pathname !== "/dkp-and-loot/overlay/bids") {
      if (fileNameRef.current) {
        window.electron.ipcRenderer
          .invoke("get-last-tab")
          .then((lastTab) => {
            navigate(lastTab || "/triggers");
          })
          .catch((error) => {
            console.error("Error getting last tab:", error);
            navigate("/");
          });
      } else {
        navigate("/");
      }
    }
  }, [location.pathname]);
  return null;
}

export default RedirectToHome;
