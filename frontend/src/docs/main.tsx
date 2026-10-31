import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DocsPage } from "./DocsPage";
import "../styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from docs/index.html");

createRoot(root).render(
  <StrictMode>
    <DocsPage />
  </StrictMode>,
);
