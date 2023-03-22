import React, { useEffect, useState } from 'react'
import { getOptimizerConfigsAndMeasurements } from '../bridge'
import QueryPlanTrees from '../components/QueryPlanTrees'
import Barchart from '../graphs/barchart_rules/Barchart'
import createModule from "../qpdiff.mjs"
import useStore from '../store'
import { getScore } from "../Score";
import Divider from "@mui/material/Divider";
import RulesQueryTable from "../graphs/RulesQueryTable";
import BorderLinearProgress from "../components/BorderLinearProgress";
import { Grid } from "@mui/material";
import Typography from "@mui/material/Typography";

function getQueryPlanMaxRows(database, plan) {
  if (database === "postgres") {
    let plannedRows = plan["Plan Rows"];
    let actualRows = plan["Actual Rows"];
    let currentRows = Math.max(plannedRows, actualRows);
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

const RulesVisualization = ({ data, parentRef }) => {
  const store = useStore()
  const [queriesAndConfigs, setQueriesAndConfigs] = useState(false)
  const [diffIsDone, setDiffIsDone] = useState(false)
  const [query1Info, setQuery1Info] = useState(null)
  const [query2Info, setQuery2Info] = useState(null)
  const [queryPlan1, setQueryPlan1] = useState();
  const [queryPlan2, setQueryPlan2] = useState();
  const [queryData, setQueryData] = useState();
  const [queryPlan1Diff, setQueryPlan1Diff] = useState();
  const [queryPlan2Diff, setQueryPlan2Diff] = useState();
  const [diffPostgresQueryPlans, setDiffPostgresQueryPlans] = useState();
  const [diffPrestoQueryPlans, setDiffPrestoQueryPlans] = useState();
  const [idOver, setIdOver] = React.useState('');
  const [showActualRows, setShowActualRows] = React.useState(false);


  const handleChangeShowActualRows = () => {
    setShowActualRows(!showActualRows)
  }

  // Get the new queries whenever the selected hint-set changes
  useEffect(() => {
    setQueriesAndConfigs(data.filter(d => d.index === store.rules)[0].queries.map(obj => ({
      ...obj,
      name: obj.query_path,
      id: obj.config_id,
      value: obj.score
    })).sort((a, b) => b.value - a.value))
  }, [store.rule, store.latency, store.processedRows, store.io, store.spills]);

  // Get the data for a single query here and fetch the query plans used to display later
  useEffect(() => {
    if (store.database && store.query) {
      getOptimizerConfigsAndMeasurements(store.database, store.query, true)
        .then((result) => {
          const queries = result.data; // .filter(obj => obj.m_latency_median !== 0)
          setQueryData(queries.map((obj) => ({
            id: obj.id,
            name: obj.query_path,
            value: getScore(obj, store),
            disabled_rules: obj.disabled_rules,
            query_plan: obj.query_plan,
          })).sort((a, b) => a.value - b.value));
        });
    }
  }, [store.query]);

  // Setup query plans for diff view
  useEffect(() => {
    if (store.query && queryData) {
      //console.log("here", store.selectedQueryForTree1, store.selectedQueryForTree2)
      // Todo share the max_rows number between both plans
      setDiffIsDone(false)
      if (store.database && store.selectedQueryForTree1) {
        console.log(store.selectedQueryForTree1);
        console.log(queryData);
        const selectedQuery = queryData.filter((d) => d.id === store.selectedQueryForTree1)[0]
        console.log('selectedQuery', selectedQuery);
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
    }
  }, [queryData, showActualRows]);

  useEffect(() => {
    console.log("query", store.query)
    if (store.database && store.query) {
      // Calculate the score for each object here
      getOptimizerConfigsAndMeasurements(store.database, store.query, true)
        .then((result) => {
          const queries = result.data; // .filter(obj => obj.m_latency_median !== 0)
          console.log("queries", queries)
          setQueryData(queries.map((obj) => ({
            id: obj.id,
            name: `ID ${obj.id}`,
            value: getScore(obj, store), //  Math.round(obj.m_latency_median / 10) / 100,
            disabled_rules: obj.disabled_rules,
            query_plan: obj.query_plan,
          })).sort((a, b) => a.value - b.value));
        });
    }
  }, [store, store.query]);

  // Wrapper for WASM diff tool
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
      console.log(result);
      setQueryPlan1Diff(result.planA)
      setQueryPlan2Diff(result.planB)
      setDiffIsDone(true)
    }
  }, [queryPlan1, queryPlan2, diffPostgresQueryPlans, diffPrestoQueryPlans, diffIsDone])

  const closeQueryPlanDiffView = () => {
    store.setQuery(null);
    setQuery1Info(null);
    setQuery2Info(null);
    setQueryPlan1Diff(null);
    setQueryPlan2Diff(null);
    setIdOver(null);
    setQueriesAndConfigs(queriesAndConfigs);
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {queriesAndConfigs && !store.query &&
        <>
          <Barchart
            data={queriesAndConfigs.filter(d => d.value > 0)}
            style={{ display: 'flex', justifyContent: 'center' }}
            parentRef={parentRef}
          />
          <Divider />
          <RulesQueryTable data={queriesAndConfigs} />
        </>
      }
      {
        store.query && (!queryPlan1Diff || !queryPlan2Diff) &&
        <Grid container spacing={3}>
          <Grid item xs>
          </Grid>
          <Grid item xs={6}>
            <br />
            <Typography align={'center'} variant={'h3'}>Comparing Query Plans ...</Typography>
            <br />
            <BorderLinearProgress />
          </Grid>
          <Grid item xs>
          </Grid>
        </Grid>
      }
      {query1Info && query2Info && queryPlan1Diff && queryPlan2Diff &&
        <QueryPlanTrees
          query1Info={query1Info}
          query2Info={query2Info}
          queryPlan1={queryPlan1Diff}
          queryPlan2={queryPlan2Diff}
          idOver={idOver}
          setIdOver={setIdOver}
          showActualRows={showActualRows}
          handleChangeShowActualRows={handleChangeShowActualRows}
          closeQueryPlanDiffView={closeQueryPlanDiffView}
          maxRows={Math.max(query1Info.max_rows, query2Info.max_rows)}
        />
      }
    </div>)
}

export default RulesVisualization
