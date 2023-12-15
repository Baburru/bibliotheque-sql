import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TablePagination from "@mui/material/TablePagination";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";

interface Livre {
  id: number;
  titre: string;
  nom_auteur: string;
  nom_editeur: string;
  date_emprunt_recente: string;
  dispo: string;
  date_retour: string;
}

export default function RechercheLivres() {
  const [livres, setLivres] = useState<Livre[]>([]);
  const [filtres, setFiltres] = useState({
    titre: "",
    nom_auteur: "",
    nom_editeur: "",
    dispo: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    fetch("http://localhost:3000/api/livres", {
      method: "POST",
      body: JSON.stringify(filtres),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data: Livre[]) => {
        setLivres(data);
        setPage(0); // Réinitialise la page lorsque les données changent
      })
      .catch((error) => {
        console.error("Erreur de récupération des données :", error);
      });
  };

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 20));
    setPage(0); // Réinitialise la page lorsque les lignes par page changent
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <FormControl
        sx={{ width: "80%", margin: "auto", marginBottom: "20px" }}
        component="form"
        onSubmit={handleFormSubmit}
      >
        <FormLabel
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            marginBottom: "20px",
          }}
        >
          Filtres de recherche
        </FormLabel>
        <TextField
          sx={{ marginBottom: "10px" }}
          label="Titre du livre"
          value={filtres.titre}
          onChange={(e) => setFiltres({ ...filtres, titre: e.target.value })}
        ></TextField>
        <TextField
          sx={{ marginBottom: "10px" }}
          label="Nom de l'auteur"
          value={filtres.nom_auteur}
          onChange={(e) =>
            setFiltres({ ...filtres, nom_auteur: e.target.value })
          }
        ></TextField>
        <TextField
          sx={{ marginBottom: "10px" }}
          label="Nom de l'éditeur"
          value={filtres.nom_editeur}
          onChange={(e) =>
            setFiltres({ ...filtres, nom_editeur: e.target.value })
          }
        ></TextField>
        <Checkbox
          checked={filtres.dispo === "on"}
          onChange={(e) =>
            setFiltres({ ...filtres, dispo: e.target.checked ? "on" : "off" })
          }
          inputProps={{ "aria-label": "controlled" }}
        />

        <Button type="submit">Envoyer</Button>
      </FormControl>
      <TableContainer
        sx={{
          minWidth: 650,
          width: "80%",
          margin: "auto",
        }}
        component={Paper}
      >
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell align="right">Auteur</TableCell>
              <TableCell align="right">Éditeur</TableCell>
              <TableCell align="right">Disponible</TableCell>
              <TableCell align="right">Dernier emprunt</TableCell>
              <TableCell align="right">ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {livres
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((livre) => (
                <TableRow
                  key={livre.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {livre.titre}
                  </TableCell>
                  <TableCell align="right">{livre.nom_auteur}</TableCell>
                  <TableCell align="right">{livre.nom_editeur}</TableCell>
                  <TableCell align="right">
                    {livre.date_retour != null ? "Oui" : "Non"}
                  </TableCell>

                  <TableCell align="right">
                    {livre.date_emprunt_recente}
                  </TableCell>
                  <TableCell align="right">{livre.id}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={livres.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}
