import React from 'react';
import Box from "@mui/material/Box";
import {DataGrid} from "@mui/x-data-grid";
import {renderProgress} from "./renderBar";

const QueryHintSetTable = ({data}) => {
  function formatHintSet(params) {
    if (params.row.disabled_rules.length === 0) {
      return 'Default Plan';
    } else {
      return '{' + params.row.disabled_rules.join(', ') + '}';
    }
  }

  let columns = [
    {field: 'id', headerName: 'ID', flex: 1},
    {field: 'disabled_rules', headerName: 'Hint-Set', flex: 1, valueGetter: formatHintSet},
    // Overall Score
    {field: 'score', headerName: 'Score', flex: 1, renderCell: renderProgress},
    // Latency
    {
      field: 'm_latency_median', headerName: 'Latency [ms]', flex: 1, valueGetter: (params) => {
        return Math.trunc(params.row.m_latency_median / 1000).toLocaleString();
      }
    },
    {field: 'latency_score', headerName: 'Latency Score', flex: 1, renderCell: renderProgress},
    // Rows
    {
      field: 'm_rows', headerName: 'Processed Rows', flex: 1, valueGetter: (params) => {
        return params.row.m_rows.toLocaleString();
      }
    },
    {field: 'rows_score', headerName: 'Rows Score', flex: 1, renderCell: renderProgress},
    // IO
    {
      field: 'm_ios', headerName: 'Accessed Pages', flex: 1, valueGetter: (params) => {
        return (params.row.m_io + params.row.m_io_hits).toLocaleString();
      }
    },
    {field: 'io_score', headerName: 'Accessed Pages Score', flex: 1, renderCell: renderProgress},
    // Spilled Pages
    {
      field: 'm_spills', headerName: 'Pages Spilled', flex: 1, valueGetter: (params) => {
        return params.row.m_tmp_spills.toLocaleString();
      }
    },
    {field: 'spills_score', headerName: 'Pages Score', flex: 1, renderCell: renderProgress},
  ]

  columns = columns.map(obj => ({...obj, align: 'center', headerAlign: 'center'}))
  return (
    <Box sx={{height: '90%', width: '100%'}}>
      <DataGrid
        disableRowSelectionOnClick
        sx={{
          '.MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '&.MuiDataGrid-root': {
            border: 'none',
          },
          '.super-app-theme--default': {
            backgroundColor: 'rgba(255,154,0, .7)',
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
        getRowClassName={(params) => {return `super-app-theme--${params.row.disabled_rules.length===0 ? 'default': "nothing"}`}}
      />
    </Box>
  );
}

export default QueryHintSetTable;
