import React from 'react';
import {
  Select, MenuItem, Grid, Box, FormControl, InputLabel, Switch, Typography, Divider,
} from '@mui/material';
import useStore from '../store';
import CostMetric from './CostMetric';

const databaseOptions = [
  {value: 'postgres', label: 'Postgres'},
  {value: 'presto', label: 'Presto'},
];


function SideBar() {
  const store = useStore();

  const handleDatabaseChange = (event) => {
    store.setDatabase(event.target.value);
    store.setMode("database")
  };

  const handleBenchmarkChange = (event) => {
    store.setBenchmark(event.target.value);
    store.setMode(event.target.value ? "benchmark" : "database")
  };

  const handleQueryChange = (event) => {
    store.setQuery(event.target.value);
    store.setMode(event.target.value ? "query" : "benchmark")
  };

  const handleRuleChange = (event) => {
    store.setQuery('')
    store.setRules(event.target.value)
    store.setMode(event.target.value ? "rules" : "database")
  }

  const handleSwitch = () => {
    store.setVisualizationMode(store.visualizationMode === 'query-centric' ? 'rule-centric' : 'query-centric')
    store.setBenchmark('')
    store.setQuery('')
    store.setMode('database')
  }

  if (store.visualizationMode === "query-centric") {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{minWidth: 80, alignItems: 'center'}}>
            <div align={'center'}>
              <Typography variant="h6">Exploration Mode</Typography>
              <br/>
              <Grid container spacing={0}>
                <Grid item xs>
                  <Typography variant="subtitle2" sx={{ml: 1}}>Query Centric</Typography>
                </Grid>
                <Grid item xs>
                  <Switch checked={store.visualizationMode === 'rule-centric'} onChange={handleSwitch}/>
                </Grid>
                <Grid item xs>
                  <Typography variant="subtitle2" sx={{ml: 1}}>Rule Centric</Typography>
                </Grid>
              </Grid>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{minWidth: 80, alignItems: 'center'}}>
            <div align={'center'}>
              <Typography variant="h6">Data Selection</Typography>
              <br/>
              <FormControl fullWidth variant="outlined" key={store.database}>
                <InputLabel id="database-input-label">Database</InputLabel>
                <Select value={store.database || 'postgres'} onChange={handleDatabaseChange} label="database">
                  {databaseOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{minWidth: 100}}>
            <div align={'center'}>
              <FormControl fullWidth>
                <InputLabel>Workload</InputLabel>
                <Select value={store.benchmark || ''} onChange={handleBenchmarkChange} disabled={!store.database}
                        label="Benchmark">
                  <MenuItem key={'none'} value={''}>
                    None
                  </MenuItem>
                  {Object.entries(store.benchmarks).length && store.benchmarks[store.database].map((option) => (
                    <MenuItem key={option.benchmark_id} value={option.benchmark_id}>
                      {option.name.split('/').pop()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{minWidth: 100}}>
            <div align={'center'}>
              <FormControl fullWidth>
                <InputLabel>Query</InputLabel>
                <Select value={store.query || ''} onChange={handleQueryChange} disabled={!store.benchmark}
                        label="Query">
                  <MenuItem key={'none'} value={''}>
                    None
                  </MenuItem>
                  {store.queryOptions && store.queryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        <Grid item xs={12}>
          <CostMetric/>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
      </Grid>
    );
  } else {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <div align={'center'}>
              <Typography variant="h6">Exploration Mode</Typography>
              <br/>
              <Grid container spacing={0}>
                <Grid item xs>
                  <Typography variant="subtitle2" sx={{ml: 1}}>Query Centric</Typography>
                </Grid>
                <Grid item xs>
                  <Switch checked={store.visualizationMode === 'rule-centric'} onChange={handleSwitch}/>
                </Grid>
                <Grid item xs>
                  <Typography variant="subtitle2" sx={{ml: 1}}>Rule Centric</Typography>
                </Grid>
              </Grid>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{minWidth: 80}}>
            <div align={'center'}>
              <Typography variant="h6">Data Selection</Typography>
              <br/>
              <FormControl fullWidth variant="outlined" key={store.database}>
                <InputLabel id="database-input-label">Database</InputLabel>
                <Select value={store.database || 'postgres'} onChange={handleDatabaseChange} label="database">
                  {databaseOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{minWidth: 100}}>
            <div align={'center'}>
              <FormControl fullWidth>
                <InputLabel>Rules</InputLabel>
                <Select value={store.rules || ''} onChange={handleRuleChange} disabled={!store.database} label="Rules">
                  <MenuItem key={'none'} value={''}>
                    None
                  </MenuItem>
                  {store.ruleOptions && store.ruleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.value}: {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
        <Grid item xs={12}>
          <CostMetric/>
        </Grid>
        <Grid item xs={12}>
          <Divider/>
        </Grid>
      </Grid>
    );
  }
}

export default SideBar;
