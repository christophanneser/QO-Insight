import React from "react";
import Box from "@mui/material/Box";
import {DataGrid, GridToolbar} from "@mui/x-data-grid";
import {renderProgress} from "./renderBar";
import useStore from "../store";

const RulesQueryTable = ({data}) => {
  const store = useStore();

  const [sortModel, setSortModel] = React.useState([
    {
      field: 'score',
      sort: 'desc',
    },
  ]);

  let columns = [
    {field: 'config_id', headerName: 'ID',},
    {field: 'benchmark_name', headerName: 'Benchmark',},
    {field: 'query_path', headerName: 'Query',},
    {field: 'score', headerName: 'Score', renderCell: renderProgress},
    // Latency
    {
      field: 'm_latency_median', headerName: 'Latency [ms]', valueGetter: (params) => {
        return (params.row.m_latency_median / 1000).toLocaleString();
      }
    },
    {
      field: 'latency_score', headerName: 'Latency Score', valueGetter: (params) => {
        return (params.row.individual_scores.latencyScore).toLocaleString();
      }, renderCell: renderProgress
    },
    // Rows
    {
      field: 'm_rows', headerName: '#Rows', valueGetter: (params) => {
        return (params.row.m_rows).toLocaleString();
      }
    },
    {
      field: 'rows_score', headerName: 'Rows Score', valueGetter: (params) => {
        return (params.row.individual_scores.rowsScore).toLocaleString();
      }, renderCell: renderProgress
    },
    // IO
    {
      field: 'm_io', headerName: 'IO [#pages]', valueGetter: (params) => {
        return (params.row.m_io + params.row.m_io_hits).toLocaleString();
      }
    },
    {
      field: 'io_score', headerName: 'IO Score', valueGetter: (params) => {
        return (params.row.individual_scores.ioScore).toLocaleString();
      }, renderCell: renderProgress
    },
    // Spills
    {
      field: 'm_spills', headerName: 'Spills [#pages]', valueGetter: (params) => {
        return params.row.m_tmp_spills.toLocaleString();
      }
    },
    {
      field: 'spill_score', headerName: 'Spill Score', valueGetter: (params) => {
        return (params.row.individual_scores.spillScore).toLocaleString();
      }, renderCell: renderProgress
    },
  ]
  columns = columns.map(obj => ({...obj, align: 'center', headerAlign: 'center', flex: 1}))

  return (
    <Box sx={{
      height: '100%', width: '100%',
      '& .super-app-theme--best-case': {
        backgroundColor: 'rgba(2, 100, 0, 0.1)',
      },
      '& .super-app-theme--worst-case': {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
      },
    }}>
      <DataGrid
        disableRowSelectionOnClick
        slots={{
          toolbar: GridToolbar,
        }}
        onRowDoubleClick={function (params, event, details) {
          store.setRules(params.row.index)
          store.setMode('rules')
        }
        }
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
        columns={columns}
        rows={data}
        getRowId={(row) => row.config_id}
        sortModel={sortModel}
        onSortModelChange={(model) => setSortModel(model)}
      />
    </Box>
  );
};

export default RulesQueryTable;
