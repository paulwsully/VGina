import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RedirectToHome({ fileName }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (fileName) {
      navigate("/bids");
    } else {
      navigate("/");
    }
  }, [fileName]);

  return null;
}

export default RedirectToHome;
