import * as React from "react";
import { Outlet, Link } from "react-router-dom";
import { useState } from "react";

const Layout = () => {
  const [username, setUsername] = useState(null);
  const token = localStorage.getItem("token");
  console.log(token);

  fetch("http://localhost:3000/api/username", {
    method: "GET", // ou 'POST', 'PUT', 'DELETE', etc., selon le besoin
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      setUsername(data.username);
    })
    .catch((error) => {
      console.error("Erreur:", error);
    });

  return (
    <>
      <nav>
        <ul
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            listStyle: "none",
          }}
        >
          <li>
            <Link
              style={{
                textDecoration: "none",
                padding: "10px",
                border: " solid 1px grey",
                borderRadius: "10px",
                color: "black",
              }}
              to="/"
            >
              Accueil
            </Link>
          </li>
          <li>
            <Link
              style={{
                textDecoration: "none",
                padding: "10px",
                border: " solid 1px grey",
                borderRadius: "10px",
                color: "black",
              }}
              to="/livres"
            >
              Chercher Livres
            </Link>
          </li>
          <li>
            <Link
              style={{
                textDecoration: "none",
                padding: "10px",
                border: " solid 1px grey",
                borderRadius: "10px",
                color: "black",
              }}
              to="/abonnes"
            >
              Chercher Abonnés
            </Link>
          </li>
          <li>
            <Link
              style={{
                textDecoration: "none",
                padding: "10px",
                border: " solid 1px grey",
                borderRadius: "10px",
                color: "black",
              }}
              to="/register"
            >
              Créer un compte
            </Link>
          </li>
          <li>
            <Link
              style={{
                textDecoration: "none",
                padding: "10px",
                border: " solid 1px grey",
                borderRadius: "10px",
                color: "black",
              }}
              to="/login"
            >
              Se connecter
            </Link>
          </li>
          <li>
            <p
              style={{
                backgroundColor: "lightgrey",
                margin: "0px",
                textDecoration: "none",
                padding: "10px",
                border: "solid 1px grey",
                color: "black",
              }}
            >
              {username
                ? `Actuellement connecté en tant que ${username}`
                : "Veuillez vous connecter"}
            </p>
          </li>
        </ul>
      </nav>

      <Outlet />
    </>
  );
};

export default Layout;
