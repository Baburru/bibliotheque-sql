import { Button, MenuItem, Select, TextField } from '@mui/material';
import React, { useState } from 'react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('abonné'); // Par défaut, l'utilisateur est de type 'abonné'

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          type,
        }),
      });

      if (!response.ok) {
        // Gérer les erreurs, par exemple, afficher un message à l'utilisateur
        console.error('Erreur lors de l\'enregistrement');
        return;
      }
  
      const data = await response.json();
      console.log(data)
      // Manipuler la réponse du serveur si nécessaire
  
      console.log('Utilisateur enregistré avec succès!', data);
    } catch (error) {
      console.error('Erreur lors de la requête fetch :', error);
    }
  };
  

  return (
    <div>
      <h2>Créer un compte</h2>
      <h3>Afin que le code fonctionne correctement vous devez utiliser un nom d'utilisateur qui exite dans la base de donnée en tant que abonne.nom</h3>
      <form>
          <TextField label="Nom d'utilisateur:" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />

          <TextField label="Mot de passe:" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <label>
          Type d'utilisateur:
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <MenuItem value="abonné">Abonné</MenuItem>
            <MenuItem value="admin">Gestionnaire</MenuItem>
          </Select>
        </label>
        <br />
        <Button type="button" onClick={handleRegister}>Créer</Button>
      </form>
    </div>
  );
};

export default Register;
