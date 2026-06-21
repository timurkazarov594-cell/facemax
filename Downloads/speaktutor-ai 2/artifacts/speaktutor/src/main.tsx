import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Wire the JWT stored in localStorage into every generated React Query hook.
// The getter is called before each fetch — always returns the current token.
setAuthTokenGetter(() => {
  try { return localStorage.getItem("speaktutor_jwt"); } catch { return null; }
});

createRoot(document.getElementById("root")!).render(<App />);
