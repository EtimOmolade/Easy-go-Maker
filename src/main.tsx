import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerServiceWorker";

// Register service worker for offline support
// TEMPORARILY DISABLED - Uncomment when ready to test offline mode
// registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
