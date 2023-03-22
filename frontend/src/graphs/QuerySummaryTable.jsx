import React from 'react';
import useStore from '../store';
import Box from "@mui/material/Box";
import {DataGrid} from "@mui/x-data-grid";
import {renderProgress} from "./renderBar";
import BorderLinearProgress from "../components/BorderLinearProgress";


const QuerySummaryTable = ({queryData}) => {
  const store = useStore()

  let columns = [
    // {field: 'query_id', headerName: 'ID'},
    {field: 'query_path', headerName: 'Query'},
    {
      field: 'best_score', headerName: 'Best Score [%]', flex: 1, valueGetter: (params) => {
        return params.row.best_score.config.score;
      }, renderCell: renderProgress
    },
    {
      field: 'best_hint_set', headerName: 'Best Hint-Set', flex: 1, valueGetter: (params) => {
        return '{' + params.row.best_score.config.disabled_rules.join(', ') + '}';
      }
    },
    {
      field: 'default_time', headerName: 'Default Plan Latency [ms]', flex: 1, valueGetter: (params) => {
        return Math.trunc(params.row.best_score.config.m_default_latency_median / 1000);
      }
    },
    {
      field: 'best_time', headerName: 'Best Latency [ms]', flex: 1, valueGetter: (params) => {
        return Math.trunc(params.row.best_score.config.m_latency_median / 1000);
      }
    },
    {
      field: 'best_time_change', headerName: 'Lowest Latency Change [%] ', flex: 1, valueGetter: (params) => {
        let latency = params.row.best_score.config.m_latency_median;
        let default_latency = params.row.best_score.config.m_default_latency_median;
        return ((default_latency - latency) / default_latency)
      }, renderCell: renderProgress
    },
    {
      field: 'worst_time', headerName: 'Highest Latency [ms]', flex: 1, valueGetter: (params) => {
        return Math.trunc(params.row.worst_score.config.m_latency_median / 1000);
      }
    },
    {
      field: 'worst_time_change', headerName: 'Highest Latency Slowdown', flex: 1, valueGetter: (params) => {
        let latency = params.row.worst_score.config.m_latency_median;
        let default_latency = params.row.worst_score.config.m_default_latency_median;
        return ((default_latency - latency) / default_latency)
      }, renderCell: renderProgress
    },
  ]

  columns = columns.map(obj => ({...obj, align: 'center', headerAlign: 'center'}))

  return (queryData ?
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
            boxShadow: 2,
            border: 2,
            borderColor: 'primary.light',
            '& .MuiDataGrid-row:hover': {
              color: 'primary.main',
            },
          }}
          rows={queryData}
          columns={columns}
          onRowDoubleClick={function (params, event, details) {
            store.setQuery(params.row.id)
            store.setMode('query')
          }
          }
        />
      </Box> : <BorderLinearProgress/>
  );
}

export default QuerySummaryTable;
