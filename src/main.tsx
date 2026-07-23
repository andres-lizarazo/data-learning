import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
// Initialize the theme store before first paint so the correct palette is applied
// immediately (no flash of the wrong theme).
import "./store/themeStore";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* basename = Vite base, so routes work under a subpath on GitHub Pages and at "/" locally. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
