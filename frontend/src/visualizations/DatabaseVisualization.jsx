import React from 'react'
import Barchart from '../graphs/barchart_db/Barchart';
import BenchmarkTable from '../graphs/BenchmarkTable';
import Divider from "@mui/material/Divider";
import BorderLinearProgress from "../components/BorderLinearProgress";

const DatabaseVisualization = ({ parentRef, benchmarkTableData }) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      {benchmarkTableData && parentRef && parentRef.current && parentRef.current.offsetWidth ?
        <Barchart
          data={benchmarkTableData}
          style={{ display: 'flex', justifyContent: 'center' }}
          parentRef={parentRef}
        /> :
        <BorderLinearProgress style={{ marginTop: 50 }} />
      }
      <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', marginTop: 4 }}>
        {benchmarkTableData ?
          <div>
            <Divider sx={{ borderBottomWidth: 5 }} />
            <BenchmarkTable benchmarkTableData={benchmarkTableData} />
          </div>
          :
          <BorderLinearProgress style={{ marginTop: 50 }} />
        }
      </div>
    </div>
  )
}

export default DatabaseVisualization