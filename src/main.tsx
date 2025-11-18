import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerServiceWorker";

// Register service worker for offline support and push notifications
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
