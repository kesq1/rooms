import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/auth";
async function enableMocking() {
  
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
});
