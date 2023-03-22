/* eslint-disable camelcase */
import React, {useEffect, useState, useRef} from 'react';
import {Grid} from '@mui/material';
import useStore from '../store';
import {getOptimizerConfigsAndMeasurements} from '../bridge';
import Barchart from '../graphs/barchart_query/Barchart';
import createModule from "../qpdiff.mjs"
import QueryPlanTrees from '../components/QueryPlanTrees';
import Divider from "@mui/material/Divider";
import QueryHintSetTable from "../graphs/QueryHintSetTable";
import {getIndividualScores, getScore} from "../Score";
import Typography from "@mui/material/Typography";
import BorderLinearProgress from "../components/BorderLinearProgress";

function getQueryPlanMaxRows(database, plan) {
  if (database === "postgres") {
    let actual_rows = plan['Actual Rows'];
    let plan_rows = plan['Plan Rows'];
    let currentRows = Math.max(actual_rows, plan_rows);

    if ("Plans" in plan) {
      for (let i = 0; i < plan["Plans"].length; i++) {
        let child_max = getQueryPlanMaxRows(database, plan["Plans"][i]);
        currentRows = child_max > currentRows ? child_max : currentRows;
      }
    }
    return currentRows;
  } else {
    return 1;
  }
}

function QueryVisualization({parentRef}) {
  const store = useStore();
  const [queryData, setQueryData] = useState();
  const [queryPlan1, setQueryPlan1] = useState();
  const [queryPlan2, setQueryPlan2] = useState();
  const [queryPlan1Diff, setQueryPlan1Diff] = useState();
  const [queryPlan2Diff, setQueryPlan2Diff] = useState();
  const [sameJoinOrder, setSameJoinOrder] = useState();
  const [idOver, setIdOver] = React.useState('');
  const [diffPostgresQueryPlans, setDiffPostgresQueryPlans] = useState();
  const [diffPrestoQueryPlans, setDiffPrestoQueryPlans] = useState();
  const [query1Info, setQuery1Info] = useState(null)
  const [query2Info, setQuery2Info] = useState(null)
  const [showActualRows, setShowActualRows] = React.useState(false);
  const [diffIsDone, setDiffIsDone] = useState(false)


  const handleChangeShowActualRows = () => {
    setShowActualRows(!showActualRows)
  }


  useEffect(() => {
    if (store.database && store.query) {
      getOptimizerConfigsAndMeasurements(store.database, store.query, true)
        .then((result) => {
          const queries = result.data.filter(obj => obj.m_latency_median !== 0);
          setQueryData(queries.map(obj => ({
            ...obj,
            name: `ID ${obj.id}`,
            value: obj.m_latency_median / 1000,
            score: getScore(obj, store),
            latency_score: getIndividualScores(obj).latencyScore,
            rows_score: getIndividualScores(obj).rowsScore,
            io_score: getIndividualScores(obj).ioScore,
            spills_score: getIndividualScores(obj).spillScore,
          })).sort((a, b) => a.m_latency_median - b.m_latency_median));
        });
    }
  }, [store.query, store.latency, store.processedRows, store.io, store.spills]);

  useEffect(() => {
    setDiffIsDone(false)
    if (store.selectedQueryForTree1) {
      const selectedQuery = queryData.filter((d) => d.id === store.selectedQueryForTree1)[0]
      setQuery1Info({
        query: store.query,
        id: selectedQuery.id,
        disabled_rules: selectedQuery.disabled_rules,
        max_rows: getQueryPlanMaxRows(store.database, selectedQuery.query_plan)
      })
      setQueryPlan1(selectedQuery.query_plan);
    } else {
      setQueryPlan1(false)
    }
    if (store.selectedQueryForTree2) {
      const selectedQuery = queryData.filter((d) => d.id === store.selectedQueryForTree2)[0]
      setQuery2Info({
        query: store.query,
        id: selectedQuery.id,
        disabled_rules: selectedQuery.disabled_rules,
        max_rows: getQueryPlanMaxRows(store.database, selectedQuery.query_plan)
      })
      setQueryPlan2(selectedQuery.query_plan);
    } else {
      setQueryPlan2(false)
    }
  }, [store.selectedQueryForTree1, store.selectedQueryForTree2, showActualRows]);

  useEffect(
    () => {
      createModule().then((Module) => {
        setDiffPostgresQueryPlans(() => Module.cwrap("diffPostgresQueryPlans", "string", ["string", "string"]));
        setDiffPrestoQueryPlans(() => Module.cwrap("diffPrestoQueryPlans", "string", ["string", "string"]));
      });
    },
    []
  );

  useEffect(() => {
    if (queryPlan1 && queryPlan2 && diffPostgresQueryPlans && diffPrestoQueryPlans && !diffIsDone) {
      console.log("queryPlan1", queryPlan1, "queryPlan2", queryPlan2)
      let result = JSON.parse(store.database === "postgres" ? diffPostgresQueryPlans(JSON.stringify(queryPlan1), JSON.stringify(queryPlan2)) : diffPrestoQueryPlans(JSON.stringify(queryPlan1), JSON.stringify(queryPlan2)))
      //console.log(result);
      setQueryPlan1Diff(result.planA);
      setQueryPlan2Diff(result.planB);
      setSameJoinOrder(result.sameJoinOrder);
      setDiffIsDone(true);
    }
  }, [queryPlan1, queryPlan2, diffPostgresQueryPlans, diffPrestoQueryPlans, diffIsDone])

  const closeQueryPlanDiffView = () => {
    setQueryPlan1Diff(null);
    setQueryPlan2Diff(null);
    store.setSelectedQueryForTree1(null);
    store.setSelectedQueryForTree2(null);
    setQuery1Info(null);
    setQuery2Info(null);
  }

  return (
    <div style={{height: '100%', width: '100%', marginBottom: 10}}>
      {queryData
        && (
          <h2 style={{textAlign: 'center'}}>
            Query
            {' '}
            {store.queryOptions.filter(function (option) {
              return option.value === store.query;
            })[0].label}
          </h2>
        )}

      {queryData && !(store.selectedQueryForTree1 && store.selectedQueryForTree2 && (!queryPlan1Diff || !queryPlan2Diff))
        && (
          <div style={{height: '100%', width: '100%', marginBottom: 10}}>
            <Barchart
              data={queryData}
              style={{height: '100%'}}
              parentRef={parentRef}
            />
            <Divider/>
            <div style={{
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              marginTop: 10,
              height: '50%'
            }}>
              <QueryHintSetTable data={queryData}/>
            </div>
          </div>)}
      {
        store.selectedQueryForTree1 && store.selectedQueryForTree2 && (!queryPlan1Diff || !queryPlan2Diff) &&
        <Grid container spacing={3}>
          <Grid item xs>
          </Grid>
          <Grid item xs={6}>
            <br/>
            <Typography align={'center'} variant={'h3'}>Comparing Query Plans ...</Typography>
            <br/>
            <BorderLinearProgress/>
          </Grid>
          <Grid item xs>
          </Grid>
        </Grid>
      }
      {queryPlan1Diff && queryPlan2Diff &&
        <QueryPlanTrees
          query1Info={query1Info}
          query2Info={query2Info}
          queryPlan1={queryPlan1Diff}
          queryPlan2={queryPlan2Diff}
          idOver={idOver}
          setIdOver={setIdOver}
          sameJoinOrder={sameJoinOrder}
          closeQueryPlanDiffView={closeQueryPlanDiffView}
          showActualRows={showActualRows}
          handleChangeShowActualRows={handleChangeShowActualRows}
          maxRows={Math.max(query1Info.max_rows, query2Info.max_rows)}
        />
      }
    </div>
  );
}

export default QueryVisualization;
