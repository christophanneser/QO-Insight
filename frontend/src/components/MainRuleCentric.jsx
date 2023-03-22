import React, { useEffect } from 'react'
import { getGroupedHintSets } from '../bridge'
import useStore from '../store'
import AggregatedRulesVisualization from '../visualizations/AggregatedRulesVisualization'
import IndividualRulesVisualization from '../visualizations/RulesVisualization'
import { getAggregatedScore, getIndividualScores, getScore } from "../Score";
import BorderLinearProgress from "./BorderLinearProgress";

const MainRuleCentric = () => {
  const store = useStore()
  const [data, setData] = React.useState(null)
  const [aggregatedHintSets, setAggregatedHintSets] = React.useState(null)
  const parentRef = React.useRef(null)
  const [width, setWidth] = React.useState(null)
  const [height, setHeight] = React.useState(null)

  const updateDimensions = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }

  // Re-render this page when window dimensions are changed
  useEffect(() => {
    window.addEventListener('resize', updateDimensions);
  })

  // Fetch raw data from backend
  useEffect(() => {
    updateDimensions();
    getGroupedHintSets(store.database)
      .then(res => {
        setData(res.data)
      })
      .catch(err => console.log(err))
  }, [store.database])

  // Calculate scores for every query plan configuration
  useEffect(() => {
    if (data) {
      let data_copy = [...data]
      // 1. Calculate the score for each individual query_config
      data_copy.forEach((hint_set_results, idx, result) => {
        hint_set_results.queries = hint_set_results.queries.map(config => ({
          ...config, score: getScore(config, store), individual_scores: getIndividualScores(config),
        }));
        result[idx] = hint_set_results;
      })

      // 2. Aggregate scores for every hint-set
      data_copy.map((hint_set_results, idx) => {
        const modified = hint_set_results;
        modified.index = idx;
        // Calculate most important stats here, e.g. num of queries
        modified.num_queries = hint_set_results.queries.length;

        // The best-scoring and worst-scoring queries
        modified.best_query = hint_set_results.queries.reduce((Qa, Qb) => Qa.score > Qb.score ? Qa : Qb);
        modified.worst_query = hint_set_results.queries.reduce((Qa, Qb) => Qa.score < Qb.score ? Qa : Qb);
        // The best latency score
        modified.best_latency_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.latencyScore > Qb.individual_scores.latencyScore ? Qa : Qb).individual_scores.latencyScore;
        modified.worst_latency_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.latencyScore < Qb.individual_scores.latencyScore ? Qa : Qb).individual_scores.latencyScore;
        // The best rows score
        modified.best_rows_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.rowsScore > Qb.individual_scores.rowsScore ? Qa : Qb).individual_scores.rowsScore;
        modified.worst_rows_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.rowsScore < Qb.individual_scores.rowsScore ? Qa : Qb).individual_scores.rowsScore;
        // The best io score
        modified.best_io_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.ioScore > Qb.individual_scores.ioScore ? Qa : Qb).individual_scores.ioScore;
        modified.worst_io_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.ioScore < Qb.individual_scores.ioScore ? Qa : Qb).individual_scores.ioScore;
        // The best spills score
        modified.best_spills_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.spillScore > Qb.individual_scores.spillScore ? Qa : Qb).individual_scores.spillScore;
        modified.worst_spills_score = hint_set_results.queries.reduce((Qa, Qb) => Qa.individual_scores.spillScore < Qb.individual_scores.spillScore ? Qa : Qb).individual_scores.spillScore;

        return modified;
      });

      store.setRuleOptions(data_copy.map(config => {
        const options = {};
        options.value = config.index;
        options.label = config.disabled_rules.join(' + ');
        return options;
      }))
      setAggregatedHintSets(data_copy);
    }
  }, [data, store.latency, store.processedRows, store.io, store.spills])

  return (
    <div
      ref={parentRef}
      style={{
        height: '100vh',
        width: '100hh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {parentRef && parentRef.current && parentRef.current.offsetWidth && store.mode === "database" &&
        <AggregatedRulesVisualization parentRef={parentRef} data={aggregatedHintSets} />}
      {parentRef && parentRef.current && parentRef.current.offsetWidth && store.mode === "rules" &&
        <IndividualRulesVisualization parentRef={parentRef} data={aggregatedHintSets} />}
    </div>
  )
}

export default MainRuleCentric