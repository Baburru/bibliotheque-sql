const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
require('dotenv').config();
const app = express();
app.use(bodyParser.json());

const db_user = process.env.DB_USER
const db_password = process.env.DB_PASSWORD
const db_name = process.env.DB_NAME

// Database Configuration
const db = mysql.createConnection({
  host: "localhost",
  user: db_user,
  password: db_password,
  database: db_name,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database!");
});

// JWT and Bcrypt setup
const JWT_SECRET = process.env.JWT_SECRET; // This should ideally be stored in a secure environment variable

// Middleware for CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.status(204).end();
  } else {
    next();
  }
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, type: user.type, userID: user.abonne_id },
    "your-secret-key",
    { expiresIn: "1h" }
  );
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // No token present

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    // Ajouter une condition pour vérifier si le type dans le JWT est 'admin'
    if (user.type === "admin") {
      req.user = user;
      return next(); // L'utilisateur est un admin, autoriser sans autre vérification
    }

    // Si le type n'est pas 'admin', procéder avec les vérifications normales
    req.user = user;
    next(); // Proceed to the next middleware/route handler
  });
};

// Routes and Logic
// For example, handling the POST request to '/api/livres'
app.post("/api/livres", (req, res) => {
  const requestData = req.body;

  let livreFilterCondition = "";
  if (requestData.dispo === "on") {
    livreFilterCondition = "AND emprunt.date_retour IS NOT NULL";
  } else if (requestData.dispo === "off") {
    livreFilterCondition = "AND emprunt.date_retour IS NULL";
  }

  const query = `
      SELECT
        emprunt.id_livre AS livre_id,
        MAX(emprunt.date_emprunt) AS date_emprunt_recente,
        livre.titre,
        auteur.nom AS nom_auteur,
        editeur.nom AS nom_editeur,
        emprunt.date_retour
      FROM livre
      INNER JOIN auteur ON livre.id_auteur = auteur.id
      INNER JOIN editeur ON livre.id_editeur = editeur.id
      INNER JOIN emprunt ON livre.id = emprunt.id_livre
      WHERE LOWER(livre.titre) LIKE LOWER(?)
      AND LOWER(auteur.nom) LIKE LOWER(?)
      AND LOWER(editeur.nom) LIKE LOWER(?)
      ${livreFilterCondition}
      GROUP BY livre.id, livre.titre, auteur.nom, editeur.nom, emprunt.id_livre;
    `;

  db.query(
    query,
    [
      `%${requestData.titre}%`,
      `%${requestData.nom_auteur}%`,
      `%${requestData.nom_editeur}%`,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur");
      }
      res.json(result);
    }
  );
});

app.post("/api/abonnes", (req, res) => {
  const requestData = req.body;

  let abonneFilterCondition = "";
  if (requestData.abo === "on") {
    abonneFilterCondition = "AND abonne.date_fin_abo > CURRENT_DATE()";
  } else if (requestData.abo === "off") {
    abonneFilterCondition = "AND abonne.date_fin_abo < CURRENT_DATE()";
  }

  const query = `
      SELECT
        abonne.id,
        abonne.nom,
        abonne.prenom,
        abonne.ville,
        abonne.date_naissance AS naissance,
        abonne.date_fin_abo,
        CASE
          WHEN abonne.date_fin_abo > CURRENT_DATE() THEN 'Oui'
          ELSE 'Non'
        END AS abonnement_status
      FROM abonne
      WHERE LOWER(abonne.nom) LIKE LOWER(?)
      AND LOWER(abonne.prenom) LIKE LOWER(?)
      AND LOWER(abonne.ville) LIKE LOWER(?)
      ${abonneFilterCondition}
    `;

  db.query(
    query,
    [
      `%${requestData.nom}%`,
      `%${requestData.prenom}%`,
      `%${requestData.ville}%`,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur");
      }
      res.json(result);
    }
  );
});

// Similarly, other routes can be added
app.post("/api/abonnes/:id", authenticateToken, (req, res) => {
  const abonneId = req.params.id;
  const requestData = req.body;

  db.query(
    `SELECT nom FROM abonne WHERE id = ?`, 
    [abonneId], 
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur");
      }

      if (results.length > 0 && results[0].nom !== requestData.nom) {
        // Le nom a changé, mise à jour du nom dans 'abonne' et 'utilisateurs'
        updateAbonneAndUsername(abonneId, requestData, res);
      } else {
        // Seulement mise à jour de 'abonne'
        updateAbonneOnly(abonneId, requestData, res);
      }
    }
  );
});

function updateAbonneOnly(abonneId, requestData, res) {
  db.query(
    `UPDATE abonne
       SET
         nom = ?,
         prenom = ?,
         ville = ?,
         adresse = ?,
         code_postal = ?,
         date_naissance = ?,
         date_inscription = ?,
         date_fin_abo = ?
       WHERE id = ?`,
    [
      requestData.nom,
      requestData.prenom,
      requestData.ville,
      requestData.adresse,
      requestData.code_postal,
      requestData.naissance,
      requestData.inscription,
      requestData.date_fin_abo,
      abonneId,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur");
      }
      res.json(result);
    }
  );
}

function updateAbonneAndUsername(abonneId, requestData, res) {
  // Mise à jour du nom dans 'abonne'
  db.query(
    `UPDATE abonne
       SET
         nom = ?,
         prenom = ?,
         ville = ?,
         adresse = ?,
         code_postal = ?,
         date_naissance = ?,
         date_inscription = ?,
         date_fin_abo = ?
       WHERE id = ?`,
    [
      requestData.nom,
      requestData.prenom,
      requestData.ville,
      requestData.adresse,
      requestData.code_postal,
      requestData.naissance,
      requestData.inscription,
      requestData.date_fin_abo,
      abonneId,
    ],
    (err, resultAbonne) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur dans la mise à jour de 'abonne'");
      }

      // Mise à jour du nom dans 'utilisateurs'
      db.query(
        `UPDATE utilisateurs SET username = ? WHERE abonne_id = ?`,
        [requestData.nom, abonneId],
        (err, resultUtilisateurs) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erreur du serveur dans la mise à jour de 'utilisateurs'");
          }
          res.json({ resultAbonne, resultUtilisateurs });
        }
      );
    }
  );
}

app.get("/api/abonnes/:id", authenticateToken, (req, res) => {
  const abonneId = parseInt(req.params.id, 10);

  // Verify if the ID is a valid integer
  if (isNaN(abonneId)) {
    return res.status(400).send("ID d'abonné invalide");
  }

  db.query(
    `SELECT
                abonne.id,
                abonne.nom,
                abonne.prenom,
                abonne.ville,
                abonne.adresse,
                abonne.code_postal,
                abonne.date_inscription AS inscription,
                abonne.date_naissance AS naissance,
                abonne.date_fin_abo AS date_fin_abo,
                CASE
                    WHEN abonne.date_fin_abo > CURRENT_DATE THEN 'Oui'
                    ELSE 'Non'
                END AS abonnement_status
            FROM abonne
            WHERE abonne.id = ?`,
    [abonneId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end("Erreur du serveur");
      } else if (result.length === 0) {
        // Aucun abonné trouvé avec cet ID
        res.statusCode = 404;
        res.end("Abonné non trouvé");
      } else {
        const abonne = result[0];
        if (
          (req.user && req.user.userID === abonne.id) ||
          req.user.type === "admin"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } else {
          res.setHeader("Location", "/error");
          res.end();
        }
      }
    }
  );
});

app.post("/api/register", (req, res) => {
  const { username, password, type } = req.body;

  // Hacher le mot de passe
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur lors du hachage du mot de passe");
    }

    // Si l'utilisateur est 'admin', sautez la vérification dans 'abonne'
    if (type === "admin") {
      // Insérer directement dans 'utilisateurs' sans 'abonne_id'
      db.query(
        `INSERT INTO utilisateurs (username, password, type) VALUES (?, ?, ?)`,
        [username, hashedPassword, type],
        (err) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .send("Erreur lors de l'enregistrement de l'utilisateur");
          }
          res
            .status(201)
            .json({ message: "Utilisateur admin enregistré avec succès" });
        }
      );
    } else {
      // Pour les autres utilisateurs, vérifiez dans 'abonne'
      db.query(
        `SELECT id FROM abonne WHERE nom = ?`,
        [username],
        (err, users) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .send("Erreur lors de la vérification de l'utilisateur");
          }

          if (users.length === 0) {
            return res.status(404).send("Abonné non trouvé");
          }

          const abonneId = users[0].id;

          // Enregistrer l'utilisateur dans la table 'utilisateurs'
          db.query(
            `INSERT INTO utilisateurs (username, password, type, abonne_id) VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, type, abonneId],
            (err) => {
              if (err) {
                console.error(err);
                return res
                  .status(500)
                  .send("Erreur lors de l'enregistrement de l'utilisateur");
              }

              res
                .status(201)
                .json({ message: "Utilisateur enregistré avec succès" });
            }
          );
        }
      );
    }
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Vérifier si l'utilisateur existe dans la base de données
  db.query(
    "SELECT * FROM utilisateurs WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur du serveur");
      }

      if (results.length === 0) {
        return res
          .status(401)
          .send("Nom d'utilisateur ou mot de passe incorrect");
      }

      const user = results[0];

      // Vérifier si le mot de passe correspond
      bcrypt.compare(password, user.password, (err, passwordMatch) => {
        if (err || !passwordMatch) {
          return res
            .status(401)
            .send("Nom d'utilisateur ou mot de passe incorrect");
        }

        // Générer le token JWT et renvoyer au client
        const token = generateToken(user);
        res.cookie("token", token, { httpOnly: true });
        res.json({ token });
      });
    }
  );
});

app.get("/api/emprunts/:id", (req, res) => {
  const abonneId = req.params.id;

  const query = `
    SELECT
      e.id_abonne,
      l.titre,
      l.categorie,
      e.date_emprunt,
      e.date_retour,
      l.genre,
      abonne.nom,
      (
        SELECT categorie
        FROM livre AS l2
        JOIN emprunt AS e2 ON l2.id = e2.id_livre
        WHERE e2.id_abonne = e.id_abonne AND e2.date_retour IS NOT NULL AND e2.date_emprunt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
        AND l2.categorie IS NOT NULL
        GROUP BY categorie
        ORDER BY COUNT(e2.id_livre) DESC
        LIMIT 1
      ) AS bestCat
    FROM emprunt e
    JOIN abonne ON e.id_abonne = abonne.id
    JOIN livre l ON e.id_livre = l.id
    WHERE abonne.id = ?
    ORDER BY e.date_emprunt DESC`;

  db.query(query, [abonneId], (err, emprunts) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur du serveur");
    }
    
    // Vérifier si bestCat est disponible
    if (emprunts.length > 0 && emprunts[0].bestCat) {
      const bestCat = emprunts[0].bestCat;
      const subQuery = `
        SELECT
            l.id AS livre_id,
            l.titre,
            COUNT(e.id_livre) AS nombre_emprunts
        FROM
            livre l
        LEFT JOIN emprunt e ON l.id = e.id_livre
        WHERE
            l.categorie = ?
            AND e.date_retour IS NOT NULL
            AND e.date_emprunt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
        GROUP BY
            l.id, l.titre
        ORDER BY
            COUNT(e.id_livre) DESC
        LIMIT 5`;

      db.query(subQuery, [bestCat], (err, topLivres) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erreur du serveur");
        }
        res.json({ emprunts, topLivres });
      });
    } else {
      res.json({ emprunts, topLivres: [] });
    }
  });
});



app.get('/api/username', (req, res) => {

    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ').pop()
    if (token) {
      try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.username) {
              res.json({ username: decoded.username });
          } else {
              res.sendStatus(400); // Mauvaise requête si username n'est pas dans le token
          }
      } catch (error) {
          res.sendStatus(400); // Mauvaise requête si le token ne peut pas être décodé
      }
  } else {
      res.sendStatus(401); // Non autorisé si pas de token
  }
});


// app.post('/api/login', (req, res) => { /* ... */ });
// app.post('/api/register', (req, res) => { /* ... */ });
// ... and so on for other routes

// Starting the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
