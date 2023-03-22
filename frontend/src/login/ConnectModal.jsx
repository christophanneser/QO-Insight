import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from '@mui/material';
import QueryUpload from './QueryUpload';

function ConnectModal({ open, handleClose, handleFileUpload }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleConnect = () => {
    console.log(`Connecting with username ${username} and password ${password}`);
    setLoggedIn(true);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Connect to Database</DialogTitle>
      <DialogContent>
        {loggedIn ? (
          <QueryUpload handleFileUpload={handleFileUpload} handleClose={handleClose} />
        ) : (
          <>
            <DialogContentText>
              Enter your username and password to connect to the database:
            </DialogContentText>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              variant="outlined"
              fullWidth
            />
            <TextField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              type="password"
              fullWidth
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {loggedIn ? (
          <Button onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleConnect} variant="contained" disabled={!username || !password}>Connect</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ConnectModal;
