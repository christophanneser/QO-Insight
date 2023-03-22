import React, { useState } from 'react';
import {Icon, Paper} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import SideBar from '../components/SideBar';
import MainQueryCentric from '../components/MainQueryCentric';
import { Button } from '@mui/material';
import ConnectModal from '../login/ConnectModal';
import configData from '../config.json';
import { blue, green } from "@mui/material/colors";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import useStore from '../store';
import MainRuleCentric from '../components/MainRuleCentric';
import IntroductionDialog from "./Introduction";

const darkTheme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: green[500],
    },
    neutral: {
      main: '#FFFFFF'
    }
  },
});
const drawerWidth = 240;

function Home() {
  const [authenticated, setAuthenticated] = useState(true);
  const [open, setOpen] = React.useState(true);
  // const [showInfo, setShowInfo] = React.useState(false);
  const store = useStore();

  const handleConnectClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAuthenticated(true);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <IntroductionDialog open={open} setOpen={setOpen}/>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              QO Insight
              <Button
                startIcon={<DescriptionIcon/>}
                variant="outlined"
                color="neutral"
                onClick={() => setOpen(true)}
                style={{ position: 'absolute', right: 15 }}
              >
                HELP
              </Button>
              {configData.showConnect && authenticated && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setAuthenticated(false)}
                  style={{ position: 'absolute', right: 15 }}
                >
                  Logout
                </Button>
              )}
              {configData.showConnect && !authenticated && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleConnectClick}
                  style={{ position: 'absolute', right: 15, }}
                >
                  Connect
                </Button>
              )}

            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ m: '0.5em', marginTop: 4 }}>
            <SideBar></SideBar>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3, height: '50vh' }}>
          <Toolbar />
          <div style={{ height: "100vh", overflow: "hidden" }}>
            {store.visualizationMode === "query-centric" ? <MainQueryCentric /> : <MainRuleCentric />}
          </div>
        </Box>
      </Box>
      {/*<ConnectModal open={open} handleClose={handleClose} />*/}
    </ThemeProvider>);
}

export default Home;
