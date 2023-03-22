import { Divider } from '@mui/material'
import React from 'react'
import Barchart from '../graphs/barchart_database_rules/Barchart'
import RulesHintSetTable from '../graphs/RulesHintSetTable'
import BorderLinearProgress from "../components/BorderLinearProgress";

const AggregatedRulesVisualization = ({ data, parentRef }) => {
  return (
    <div style={{ height: '100%', width: '100%', marginBottom: 1 }}>
      {data ?
        <div style={{ height: '100%', width: '100%', marginBottom: 1 }}>
          <Barchart
            data={data.map((hint_set, index) => ({
              id: hint_set.index,
              name: hint_set.disabled_rules.join(", "),
              value: hint_set.best_query.score,
            })).sort((a, b) => b.value - a.value).filter(d => d.value > 0)}
            style={{ display: 'flex', justifyContent: 'center' }}
            parentRef={parentRef}
          />
          <Divider sx={{ borderBottomWidth: 5 }} />
          <div style={{
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            marginTop: 10,
            height: '50%'
          }}>
            <RulesHintSetTable data={data} />
          </div>
        </div> :
        <BorderLinearProgress />
      }
    </div>
  )
}

export default AggregatedRulesVisualization