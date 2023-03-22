import React from "react";
import Box from "@mui/material/Box";
import {DataGrid, GridToolbar} from "@mui/x-data-grid";
import {renderProgress} from "./renderBar";
import useStore from "../store";

const RulesHintSetTable = ({data}) => {
  const store = useStore();

  let columns = [
    {field: 'index', headerName: 'ID',},
    {
      field: 'disabled_rows', headerName: 'Hint-Set (disabled rules)', flex: 1, valueGetter: (params) => {
        return '{' + params.row.disabled_rules.join(', ') + '}';
      }
    },
    {field: 'num_queries', headerName: 'Number Queries', flex: 1},

    // Stats of best query
    {
      field: 'best_score', headerName: 'Overall Score', flex: 1, valueGetter: (params) => {
        return params.row.best_query.score;
      }, renderCell: renderProgress
    },
    {
      field: 'best_latency_score', headerName: 'Latency', flex: 1, valueGetter: (params) => {
        return params.row.best_query.individual_scores.latencyScore;
      }, renderCell: renderProgress
    },
    {
      field: 'best_rows_score', headerName: 'Rows', flex: 1, valueGetter: (params) => {
        return params.row.best_query.individual_scores.rowsScore;
      }, renderCell: renderProgress
    },
    {
      field: 'best_io_score', headerName: 'IO', flex: 1, valueGetter: (params) => {
        return params.row.best_query.individual_scores.ioScore;
      }, renderCell: renderProgress
    }, {
      field: 'best_spills_score', headerName: 'Spills', flex: 1, valueGetter: (params) => {
        return params.row.best_query.individual_scores.spillScore;
      }, renderCell: renderProgress
    },

    // Stats of worst query
    {
      field: 'worst_score', headerName: 'Overall Score', flex: 1, valueGetter: (params) => {
        return params.row.worst_query.score;
      }, renderCell: renderProgress
    },
    {
      field: 'worst_latency_score', headerName: 'Latency', flex: 1, valueGetter: (params) => {
        return params.row.worst_query.individual_scores.latencyScore;
      }, renderCell: renderProgress
    },
    {
      field: 'worst_rows_score', headerName: 'Rows', flex: 1, valueGetter: (params) => {
        return params.row.worst_query.individual_scores.rowsScore;
      }, renderCell: renderProgress
    },
    {
      field: 'worst_io_score', headerName: 'IO', flex: 1, valueGetter: (params) => {
        return params.row.worst_query.individual_scores.ioScore;
      }, renderCell: renderProgress
    }, {
      field: 'worst_spills_score', headerName: 'Spills', flex: 1, valueGetter: (params) => {
        return params.row.worst_query.individual_scores.spillScore;
      }, renderCell: renderProgress
    },
  ]
  columns = columns.map(obj => ({...obj, align: 'center', headerAlign: 'center'}))

  const columnGroupingModel = [
    {
      groupId: 'Best Case',
      description: 'Performance Scores of the best case.',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--best-case',
      children: [{field: 'best_score'}, {field: 'best_latency_score'}, {field: 'best_rows_score'}, {field: 'best_io_score'}, {field: 'best_spills_score'}],
    },
    {
      groupId: 'Worst Case',
      description: 'Performance Scores of the worst case.',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--worst-case',
      children: [{field: 'worst_score'}, {field: 'worst_latency_score'}, {field: 'worst_rows_score'}, {field: 'worst_io_score'}, {field: 'worst_spills_score'}],
    },
  ];

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
        experimentalFeatures={{columnGrouping: true}}
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
        getRowId={(row) => row.disabled_rules.join('')}
        columnGroupingModel={columnGroupingModel}
      />
    </Box>
  );
};

export default RulesHintSetTable;
