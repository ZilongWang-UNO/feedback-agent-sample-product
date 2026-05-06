import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReportsPage } from "./reports/ReportsPage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReportsPage />
  </StrictMode>
);
