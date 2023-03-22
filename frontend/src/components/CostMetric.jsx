import {Button, Slider, Typography} from '@mui/material'
import React, {useState} from 'react'
import useStore from '../store'
import {Label} from "@mui/icons-material";
import Divider from "@mui/material/Divider";

const CostMetric = () => {
  const store = useStore()
  const [latency, setLatency] = useState(100)
  const [processedRows, setProcessedRows] = useState(0)
  const [io, setIO] = useState(0)
  const [spills, setSpills] = useState(0)

  const handleLatencyChange = (event, newValue) => {
    setLatency(newValue)
  }

  const handleProcessedRowsChange = (event, newValue) => {
    setProcessedRows(newValue)
  }

  const handleIOChange = (event, newValue) => {
    setIO(newValue)
  }

  const handleSpillsChange = (event, newValue) => {
    setSpills(newValue)
  }

  const applyValues = () => {
    store.setLatency(latency);
    store.setProcessedRows(processedRows);
    store.setIO(io);
    store.setSpills(spills);

    let numSlidersWithValue = 0;
    if (latency > 0) {
      numSlidersWithValue++;
    }
    if (processedRows > 0) {
      numSlidersWithValue++;
    }
    if (io > 0) {
      numSlidersWithValue++;
    }
    if (spills > 0) {
      numSlidersWithValue++;
    }

    if (numSlidersWithValue === 1) {
      if (latency > 0) {
        store.setLabelBarchart("Latency Improvement [%]");
      } else if (processedRows > 0) {
        store.setLabelBarchart("Processed Rows Decline [%]");
      } else if (io > 0) {
        store.setLabelBarchart("Accessed Pages Decline [%]");
      } else {
        store.setLabelBarchart("Spilled Pages Decline [%]");
      }
    } else {
      store.setLabelBarchart("Score");
    }
  }

  return (
    <div style={{"width": "85%", "margin": "0 auto"}}>
      <div align={'center'}>
        <Typography variant="h6">Performance Metric</Typography>
        <br/>
        Latency ({latency})
        <Slider value={latency} aria-label="Latency" onChange={handleLatencyChange} valueLabelDisplay="auto"/>
        Processed Rows ({processedRows})
        <Slider value={processedRows} aria-label="Processed Rows" onChange={handleProcessedRowsChange}
                valueLabelDisplay="auto"/>
        Accessed Pages ({io})
        <Slider value={io} aria-label="Page Accesses" onChange={handleIOChange} valueLabelDisplay="auto"/>
        Spilled Pages ({spills})
        <Slider value={spills} aria-label="Spilled Pages" onChange={handleSpillsChange} valueLabelDisplay="auto"/>
        <Button variant="contained" onClick={applyValues}>Apply</Button>
      </div>
    </div>
  )
}

export default CostMetric;
