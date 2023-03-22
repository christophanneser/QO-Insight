import React from 'react';
import useStore from '../store';
import {DataGrid} from '@mui/x-data-grid';
import Box from "@mui/material/Box";
import {renderProgress} from "./renderBar";

function BenchmarkTable({benchmarkTableData}) {
  const store = useStore()

  function formatTimeDuration(time) {
    time /= 1000000;
    const sec_num = parseInt(time, 10); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
  }

  function formatTotalRuntimes(param) {
    return formatTimeDuration(param.row.totalRuntime)
  }

  function formatMeanRuntimes(param) {
    return (Math.round(param.row.meanRuntime / 1000 * 100) / 100).toFixed(2);
  }

  function formatMedianRuntimes(param) {
    return (Math.round(param.row.medianRuntime / 1000 * 100) / 100).toFixed(2);
  }

  const columns = [
    //{field: 'id', headerName: 'ID', flex: 1, status: false},
    {field: 'benchmark_name', headerName: 'Benchmark', flex: 1,},
    {field: 'numQueries', headerName: 'Number of Queries', flex: 1},
    {field: 'numAlternativePlans', headerName: 'Number of Explored Plans', flex: 1},
    {field: 'totalRuntime', headerName: 'Total Runtime [hh:mm:ss]', flex: 1, valueGetter: formatTotalRuntimes},
    {field: 'meanRuntime', headerName: 'Mean Runtime [ms]', flex: 1, valueGetter: formatMeanRuntimes},
    {field: 'medianRuntime', headerName: 'Median Runtime [ms]', flex: 1, valueGetter: formatMedianRuntimes},
    {field: 'benchmarkScore', headerName: 'Improvement Score', flex: 1, renderCell: renderProgress},
  ];

  return (
    <Box sx={{height: 400, width: '100%'}}>
      <DataGrid
        disableRowSelectionOnClick
        sx={{
          '.MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '&.MuiDataGrid-root': {
            border: 'none',
          },
          boxShadow: 2,
          border: 2,
          borderColor: 'primary.light',
          '& .MuiDataGrid-row:hover': {
            color: 'primary.main',
          },
        }}
        rows={benchmarkTableData}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        onRowDoubleClick={function (params, event, details) {
          store.setBenchmark(params.row.id)
          store.setMode('benchmark')
        }
        }
      />
    </Box>
  );
}

export default BenchmarkTable;
