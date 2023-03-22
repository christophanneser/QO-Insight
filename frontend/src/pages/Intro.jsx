import { Button, Typography } from '@mui/material';
import { useState } from 'react';
import ConnectModal from '../login/ConnectModal';
import IntroductionDialog from "./Introduction";

function Intro() {
  const [authenticated, setAuthenticated] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConnectClick = () => {
    setOpen(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
  }

  const handleClose = () => {
    setOpen(false);
    setAuthenticated(true);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to QO-Insight!
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        This is the intro page.
      </Typography>
      <Button variant="outlined" onClick={handleClickOpen}>
        Open max-width dialog
      </Button>
      <IntroductionDialog open={open} setOpen={setOpen}/>
    </div>
  );
}

export default Intro;


/*
 <div style={{ marginTop: '50px' }}>
        {authenticated ? (
          <Button variant="contained" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleConnectClick}>
            Connect
          </Button>
        )}
      </div>
      <ConnectModal open={open} handleClose={handleClose} />
 */