import * as React from "react";
import {
  TextField,
  Container,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface AbonneDetailsInterface {
  [key: string]: string;
}

interface Emprunt {
  id: string;
  id_abonne: string;
  titre: string;
  date_emprunt: string;
  date_retour: string;
  categorie: string;
  bestCat: string;
}

interface Suggestion {
  livre_id: string;
  titre: string;
  categorie: string;
  nombre_emprunts: number;
}

export default function AbonneDetails() {
  const [abonneDetail, setAbonneDetails] = useState<AbonneDetailsInterface | null>(null);
  const [emprunts, setEmprunts] = useState<Emprunt[] | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await getAbonne();
        await getEmprunts();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]); // 

  const getAbonne = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/abonnes/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/error";
        }
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      const abonneData = Array.isArray(data) ? data[0] : data;
      setAbonneDetails(abonneData);
    } catch (error) {
      setError("Erreur de récupération des données de l'abonné");
    }
  };

  const getEmprunts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/emprunts/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }

      const data = await response.json();
      console.log(data)
      setSuggestions(data.topLivres)
      setEmprunts(data.emprunts);
    } catch (error) {
      setError("Erreur lors de la mise à jour des données d'emprunts");
    }
  };

  const handleSave = async () => {
    const updatedAbonneData = { ...abonneDetail };

    try {
      const response = await fetch(
        `http://localhost:3000/api/abonnes/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedAbonneData),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP! Statut: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données :", error);
    }
  };

  // Rendu du composant
  return (
    <Container>
      <h1>Informations de l'abonné</h1>
      {loading ? (
        <p>Chargement en cours...</p>
      ) : (
        Object.keys(abonneDetail || {}).map((key) => (
          <TextField
            className="custom-text-field"
            key={key}
            variant="outlined"
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            value={abonneDetail?.[key] || ""}
            onChange={(e) =>
              setAbonneDetails({ ...abonneDetail, [key]: e.target.value })
            }
          />
        ))
      )}
      <Button variant="contained" onClick={handleSave}>
        Sauvegarder
      </Button>

      <Container>
        <h2>Livres recommandés</h2>
        {suggestions !== null
          ? suggestions.map((suggest, i) => (
              <Chip className="custom-chip" key={i} label={suggest.titre} />
            ))
          : null}
      </Container>

      <Container>
        <h2>Liste des précédents emprunts</h2>
        {emprunts !== null ? (
          <TableContainer
            sx={{ width: "80%", margin: "auto" }}
            component={Paper}
          >
            <Table
              sx={{ minWidth: 650, width: "100%" }}
              aria-label="simple table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell align="right">Date d'emprunt</TableCell>
                  <TableCell align="right">Date de retour</TableCell>
                  <TableCell align="right">Categorie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emprunts.map((emprunt, i) => (
                  <TableRow key={i}>
                    <TableCell>{emprunt.titre}</TableCell>
                    <TableCell align="right">{emprunt.date_emprunt}</TableCell>
                    <TableCell align="right">{emprunt.date_retour}</TableCell>
                    <TableCell align="right">{emprunt.categorie}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Container>
    </Container>
  );
}
