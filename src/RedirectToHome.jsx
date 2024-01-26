import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RedirectToHome({ fileName }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (fileName) {
      window.electron.getLastTab().then((lastTab) => {
        navigate(lastTab || "/triggers");
      });
    } else {
      navigate("/");
    }
  }, [fileName, navigate]);

  return null;
}

export default RedirectToHome;
