var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
window.__API_BASE_URL__ = isLocal ? "http://localhost:8000/api" : "https://kitchenos-deployment.onrender.com/api";
window.__APP_NAME__ = "KitchenOS";
window.__BACKEND_URL__ = window.__API_BASE_URL__.replace("/api", "");
