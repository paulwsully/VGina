import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RedirectToHome({ fileName }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (fileName) {
      window.electron.ipcRenderer
        .invoke("get-last-tab")
        .then((lastTab) => {
          navigate(lastTab || "/triggers");
        })
        .catch((error) => {
          console.error("Error getting last tab:", error);
        });
    } else {
      navigate("/");
    }
  }, [fileName, navigate]);

  return null;
}

export default RedirectToHome;
