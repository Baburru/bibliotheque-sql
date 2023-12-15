import "./App.css";
import ReactDOM from "react-dom/client";
import RechercheAbonnes from "./pages/recherche_abonnes.tsx";
import RechercheLivres from "./pages/recherche_livres.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout.tsx";
import AbonneDetails from "./pages/abonne.details.tsx";
import Register from "./pages/register.tsx";
import Login from "./pages/login.tsx";
import Error from "./pages/error.tsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="livres" element={<RechercheLivres />} />
          <Route path="abonnes" element={<RechercheAbonnes />} />
          <Route path='/abonnes/:id' element={<AbonneDetails />} />
          <Route path="/register" element={<Register/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/error" element={<Error />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
