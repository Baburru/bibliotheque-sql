const http = require("http");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "coursmysql",
});

db.connect(function (err) {
  if (err) throw err;
  console.log("Connecté à la base de données MySQL!");
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, type: user.type, userID: user.abonne_id },
    "your-secret-key",
    { expiresIn: "1h" }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Token not provided");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("error");
      return res.status(403).send("Token is invalid");
    }
    req.user = user;
    next();
  });
};

const handleOptionsRequest = (res) => {
  res.writeHead(204, { "Access-Control-Allow-Methods": "GET, POST" });
  res.end();
};

const handleNotFound = (res) => {
  res.status(404).end("Not Found");
};

const handleServerError = (res, err) => {
  console.error(err);
  res.status(500).end("Server Error");
};

const server = http.createServer((req, res) => {
  // Gérer les en-têtes CORS
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type , Authorization");

  if (req.method === "OPTIONS") {
    handleOptionsRequest(res);
    return;
  }

  // Afficher la liste des livres en fonction des filtres
  if (req.method === "POST" && req.url === "/api/livres") {
    let requestBody = "";

    req.on("data", (chunk) => {
      requestBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const requestData = JSON.parse(requestBody);

        livreFilterCondition = "";
        if (requestData.dispo === "on") {
          livreFilterCondition = "AND emprunt.date_retour IS NOT NULL";
        } else if (requestData.dispo === "off") {
          livreFilterCondition = "AND emprunt.date_retour IS NULL";
        } else if (requestData.dispo === "") {
          livreFilterCondition = "";
        }

        db.query(
          `SELECT
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
      `,
          [
            `%${requestData.titre}%`,
            `%${requestData.nom_auteur}%`,
            `%${requestData.nom_editeur}%`,
          ],
          (err, result) => {
            if (err) {
              console.error(err);
              res.statusCode = 500;
              res.end("Erreur du serveur");
            } else {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            }
          }
        );
      } catch (error) {
        res.statusCode = 400;
        res.end("Requête JSON mal formée");
      }
    });
  }

  // Afficher la liste des abonnés en fonction des filtres
  else if (req.method === "POST" && req.url === "/api/abonnes") {
    let requestBody = "";

    req.on("data", (chunk) => {
      requestBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const requestData = JSON.parse(requestBody);

        abonneFilterCondition = "";
        if (requestData.abo === "on") {
          abonneFilterCondition = "AND abonne.date_fin_abo > CURRENT_DATE()";
        } else if (requestData.abo === "off") {
          abonneFilterCondition = "AND abonne.date_fin_abo < CURRENT_DATE()";
        }

        db.query(
          `SELECT
          abonne.id,
          abonne.nom,
          abonne.prenom,
          abonne.ville,
          abonne.date_naissance AS naissance,
          abonne.date_fin_abo,
          CASE
              WHEN abonne.date_fin_abo > CURRENT_DATE THEN 'Oui'
              ELSE 'Non'
          END AS abonnement_status
      FROM abonne
      WHERE LOWER(abonne.nom) LIKE LOWER(?)
      AND LOWER(abonne.prenom) LIKE LOWER(?)
      AND LOWER(abonne.ville) LIKE LOWER(?)
      ${abonneFilterCondition}
      `,
          [
            `%${requestData.nom}%`,
            `%${requestData.prenom}%`,
            `%${requestData.ville}%`,
          ],
          (err, result) => {
            if (err) {
              console.error(err);
              res.statusCode = 500;
              res.end("Erreur du serveur");
            } else {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            }
          }
        );
      } catch (error) {
        res.statusCode = 400;
        res.end("Requête JSON mal formée");
      }
    });
  }
  //Afficher toutes les informations d'un abonné en particulier
  else if (req.method === "GET" && req.url.startsWith("/api/abonnes/")) {
    // Extraire l'ID de l'URL
    const abonneId = req.url.split("/").pop();

    // Vérifier si l'ID est un nombre entier
    if (!isNaN(abonneId) && Number.isInteger(parseFloat(abonneId))) {
      // Effectuer la requête SQL pour récupérer les informations de l'abonné par son ID
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
            if (req.user && req.user.userID === abonne.id) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } else {
              res.setHeader("Location", "/error");
              res.end();
            }
          }
        }
      );
    } else {
      // L'ID n'est pas un nombre entier
      res.statusCode = 400;
      res.end("ID d'abonné invalide");
    }
  }
  //Changer les informations de l'abonné
  else if (req.method === "POST" && req.url.startsWith("/api/abonnes/")) {
    const abonneId = req.url.split("/").pop();

    let requestBody = "";

    req.on("data", (chunk) => {
      requestBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const requestData = JSON.parse(requestBody);
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
              res.statusCode = 500;
              res.end("Erreur du serveur");
            } else {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            }
          }
        );
      } catch (error) {
        res.statusCode = 400;
        res.end("Requête JSON mal formée");
      }
    });
  }
  //Récupérer la liste de tout les emprunts d'un abonné
  else if (req.method === "GET" && req.url.startsWith("/api/emprunts/")) {
    const abonneId = req.url.split("/").pop();

    db.query(
      `SELECT
      livre.titre,
      abonne.nom,
      emprunt.date_emprunt,
      emprunt.date_retour,
      livre.categorie,
      emprunt.id_abonne,
      livre.genre,
      (
      SELECT
          categorie
      FROM
          livre AS l
      JOIN emprunt AS e
      ON
          l.id = e.id_livre
      WHERE
          e.id_abonne = abonne.id AND e.date_retour IS NOT NULL AND e.date_emprunt >= DATE_SUB(NOW(), INTERVAL 1 YEAR) AND l.categorie IS NOT NULL
      GROUP BY
          categorie
      ORDER BY
          COUNT(categorie)
      DESC
  LIMIT 1) AS bestCat
      FROM
          emprunt
      JOIN abonne ON emprunt.id_abonne = abonne.id
      JOIN livre ON emprunt.id_livre = livre.id
      WHERE
          abonne.id = 25
      ORDER BY
          emprunt.date_emprunt
      DESC
          
    
  `,
      [abonneId],
      (err, result) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end("Erreur du serveur");
        } else {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        }
      }
    );
  }
  //Récupérer des suggestions de livres en fonction du genre préféré
  else if (req.method === "GET" && req.url.startsWith("/api/suggestions/")) {
    let categorie = req.url.split("/").pop();
    if (categorie === "r%C3%A9aliste") {
      categorie = "réaliste";
    }

    db.query(
      `WITH ClassementEmprunts AS (
        SELECT
            l.id AS livre_id,
            l.titre,
            l.categorie,
            COUNT(e.id_livre) AS nombre_emprunts,
            ROW_NUMBER() OVER (ORDER BY COUNT(e.id_livre) DESC) AS classement
        FROM
            livre l
        LEFT JOIN emprunt e ON l.id = e.id_livre
        WHERE
            l.categorie = ?
            AND e.date_retour IS NOT NULL
            AND e.date_emprunt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
        GROUP BY
            l.id, l.titre, l.categorie
    )
    
    SELECT
        livre_id,
        titre,
        categorie,
        nombre_emprunts
    FROM
        ClassementEmprunts
    WHERE
        classement <= 5;   
  `,
      [categorie],
      (err, result) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end("Erreur du serveur");
        } else {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        }
      }
    );
  }
  //Méthode de connexion
  else if (req.method === "POST" && req.url === "/api/login") {
    let requestBody = "";

    req.on("data", (chunk) => {
      requestBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(requestBody);

        // Vérifier si l'utilisateur existe dans la base de données
        db.query(
          "SELECT * FROM utilisateurs WHERE username = ?",
          [username],
          (err, results) => {
            if (err) {
              console.error(err);
              res.statusCode = 500;
              res.end("Erreur du serveur");
              return;
            }

            if (results.length === 0) {
              res.statusCode = 401;
              res.end("Nom d'utilisateur ou mot de passe incorrect");
              return;
            }

            const user = results[0];

            // Vérifier si le mot de passe correspond
            bcrypt.compare(password, user.password, (err, passwordMatch) => {
              if (err || !passwordMatch) {
                res.statusCode = 401;
                res.end("Nom d'utilisateur ou mot de passe incorrect");
                return;
              }

              // Générer le token JWT et renvoyer au client
              const token = generateToken(user);
              res.setHeader("Set-Cookie", `token=${token}; HttpOnly`);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ token }));
            });
          }
        );
      } catch (error) {
        res.statusCode = 400;
        res.end("Requête JSON mal formée");
      }
    });
  }
  //Enregistrement
  else if (req.method === "POST" && req.url === "/api/register") {
    // Route pour l'enregistrement (register)
    let requestBody = "";

    req.on("data", (chunk) => {
      requestBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password, type } = JSON.parse(requestBody);

        // Hacher le mot de passe avant de l'enregistrer dans la base de données
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end("Erreur du serveur");
            return;
          }

          // Enregistrer l'utilisateur dans la base de données
          // Assuming `username` is the name of the person in the abonne table
          db.query(
            `SELECT abonne.id FROM abonne WHERE abonne.nom = ?`,
            [username], // or the actual name of the abonne
            (err, result) => {
              if (err) {
                console.error(err);
                return;
              }

              if (result.length === 0) {
                return;
              }

              const abonneId = result[0].id;

              // Now insert into utilisateurs table with the retrieved abonneId
              db.query(
                `INSERT INTO utilisateurs (username, password, type, abonne_id) VALUES (?, ?, ?, ?)`,
                [username, hashedPassword, type, abonneId],
                (err, result) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                }
              );
            }
          );
        });
      } catch (error) {
        res.statusCode = 400;
        res.end("Requête JSON mal formée");
      }
    });
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Le serveur fonctionne sur le port ${port}`);
});
