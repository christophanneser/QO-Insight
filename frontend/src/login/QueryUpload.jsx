import React, { useState } from 'react';
import { Button, DialogContentText, LinearProgress, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function QueryUpload({ handleClose }) {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    setProgress(0);
    setShowProgress(true);
    const step = 1;
    const numSteps = 50;
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      const delay = (1 - progress / 100) * 500 + Math.floor(Math.random() * 200);
      setTimeout(() => {
        setProgress((count * step * 100) / numSteps);
        if (count >= numSteps) {
          clearInterval(intervalId);
          setTimeout(() => {
            handleClose();
            setTimeout(() => {
              setShowProgress(false);
              navigate('/home'); // redirect to home
            }, 100);
          }, 1000);
        }
      }, delay);
    }, 100);
  };


  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <>
      {showProgress ? (
        <LinearProgress variant="determinate" value={progress} />
      )
        :
        <>
          <DialogContentText>
            Upload a file with SQL queries:
          </DialogContentText>
          <input
            type="file"
            accept=".sql"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-input"
          />
          <TextField
            label="Select File"
            value={file ? file.name : ''}
            margin="normal"
            variant="outlined"
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <>
                  <label htmlFor="file-input">
                    <Button variant="contained" component="span">
                      Browse
                    </Button>
                  </label>
                  {file && (
                    <Button onClick={() => setFile(null)}>
                      Clear
                    </Button>
                  )}
                </>
              ),
            }}
          />
          {file && (
            <Button onClick={handleUpload} variant="contained">
              Upload
            </Button>
          )}
        </>
      }
    </>
  );
}

export default QueryUpload;
