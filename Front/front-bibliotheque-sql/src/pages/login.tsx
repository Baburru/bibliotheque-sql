import { Button, TextField } from '@mui/material';
import React, { useState } from 'react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
  
      if (!response.ok) {
        // Gérer les erreurs, par exemple, afficher un message à l'utilisateur
        console.error('Erreur lors de l\'enregistrement');
        return;
      }
  
      const data = await response.json();
      localStorage.setItem("token", data.token);
      // Manipuler la réponse du serveur si nécessaire
  
      console.log('Utilisateur enregistré avec succès!', data);
    } catch (error) {
      console.error('Erreur lors de la requête fetch :', error);
    }
  };
  

  return (
    <div>
      <h2>Se connecter</h2>
      <form>
          <TextField label="Nom d'utilisateur"type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />
          <TextField label="Mot de passe:" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <Button type="button" onClick={handleLogin}>Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
