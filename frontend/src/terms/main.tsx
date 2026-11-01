import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TermsPage } from "./TermsPage";
import "../styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from terms/index.html");

createRoot(root).render(
  <StrictMode>
    <TermsPage />
  </StrictMode>,
);
