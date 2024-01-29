import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function RedirectToHome({ fileName }) {
  const navigate = useNavigate();
  const fileNameRef = useRef(fileName);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  useEffect(() => {
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
  }, []);
  return null;
}

export default RedirectToHome;
