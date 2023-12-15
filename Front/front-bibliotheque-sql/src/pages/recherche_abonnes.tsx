import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TablePagination from "@mui/material/TablePagination";
import {
  FormControl,
  FormLabel,
  TextField,
  Button,
  Checkbox,
} from "@mui/material";

interface Abonne {
  id: number;
  nom: string;
  prenom: string;
  ville: string;
  abonnement_status: string;
  naissance: string;
}

export default function RechercheAbonnes() {
  const [abonnes, setAbonne] = useState<Abonne[]>([]);
  const [filtres, setFiltres] = useState({
    nom: "",
    prenom: "",
    ville: "",
    abo: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    fetch("http://localhost:3000/api/abonnes", {
      method: "POST",
      body: JSON.stringify(filtres),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data: Abonne[]) => {
        setAbonne(data);
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
    setPage(0);
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
        sx={{ width: "80%", margin: "auto" }}
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
          label="Nom de l'abonne"
          value={filtres.nom}
          onChange={(e) => setFiltres({ ...filtres, nom: e.target.value })}
        ></TextField>
        <TextField
          sx={{ marginBottom: "10px" }}
          label="Prénom de l'abonne"
          value={filtres.prenom}
          onChange={(e) => setFiltres({ ...filtres, prenom: e.target.value })}
        ></TextField>
        <TextField
          sx={{ marginBottom: "10px" }}
          label="Ville de l'abonne"
          value={filtres.ville}
          onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}
        ></TextField>
        <Checkbox
          checked={filtres.abo === "on"}
          onChange={(e) =>
            setFiltres({ ...filtres, abo: e.target.checked ? "on" : "off" })
          }
          inputProps={{ "aria-label": "controlled" }}
        />
        <Button type="submit">Envoyer</Button>
      </FormControl>
      <TableContainer sx={{ width: "80%", margin: "auto" }} component={Paper}>
        <Table sx={{ minWidth: 650, width: "100%" }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell align="right">Prénom</TableCell>
              <TableCell align="right">Ville</TableCell>
              <TableCell align="right">Date de Naissance</TableCell>
              <TableCell align="right">Abonné ?</TableCell>
              <TableCell align="right">ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {abonnes
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((abonne) => (
                <TableRow key={abonne.id}>
                  <TableCell>{abonne.nom}</TableCell>
                  <TableCell align="right">{abonne.prenom}</TableCell>
                  <TableCell align="right">{abonne.ville}</TableCell>
                  <TableCell align="right">{abonne.naissance}</TableCell>
                  <TableCell align="right">
                    {abonne.abonnement_status}
                  </TableCell>
                  <TableCell align="right">{abonne.id}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={abonnes.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}
