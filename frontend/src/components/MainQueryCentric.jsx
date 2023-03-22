import React, { useEffect, useState } from 'react'
import QueryVisualization from '../visualizations/QueryVisualization'
import useStore from '../store';
import DatabaseVisualization from '../visualizations/DatabaseVisualization';
import BenchmarkVisualization from '../visualizations/BenchmarkVisualization';
import { getOptimizerConfigsAndMeasurements, getQueries } from '../bridge';
import { getAggregatedScore, getScore } from "../Score";

const MainQueryCentric = () => {
  const store = useStore();
  const [allConfigsAndMeasurements, setAllConfigsAndMeasurements] = useState();
  const [aggregatedQueries, setAggregatedQueries] = useState();
  const [aggregatedBenchmarks, setAggregatedBenchmarks] = useState(null)
  const parentRef = React.useRef(null)

  useEffect(() => {
    if (store.database) {
      getOptimizerConfigsAndMeasurements(store.database)
        .then((result) => {
          setAllConfigsAndMeasurements(result.data); // filter later depending on score? .filter(obj => obj.m_latency_median > 0)
          const distinctQueriesDict = {}
          result.data.forEach(element => {
            distinctQueriesDict[element.query_id] = element.query_path;
          })
          let distinctQueries = Object.entries(distinctQueriesDict).map(([key, value]) => ([parseInt(key), value]))
          distinctQueries.sort(function (a, b) {
            return a[1] < b[1];
          });
          const queryOp = distinctQueries.map((query) => {
            const options = {};
            options.value = query[0];
            options.label = `Q${query[1]}`;
            return options;
          });

          store.setQueryOptions(queryOp);
        });
    }
  }, [store.database]);

  useEffect(() => {
    if (allConfigsAndMeasurements) {
      // 1. Calculate the score for each individual query_config
      allConfigsAndMeasurements.map((query_config) => {
        const queryWithScore = query_config;
        queryWithScore.score = getScore(query_config, store);
        return queryWithScore;
      });

      // 2. Aggregate on a query level (show highest and lowest score)
      const grouped = allConfigsAndMeasurements.reduce((groups, obj, index) => {
        const id = obj.query_id;
        if (!groups[id]) {
          groups[id] = [];
        }
        groups[id].push(obj);
        return groups;
      }, {});

      const query_aggregates = {};
      for (const id in grouped) {
        const objects = grouped[id];
        const best = objects.reduce((a, b) => a.score > b.score ? a : b);
        const worst = objects.reduce((a, b) => a.score < b.score ? a : b);
        query_aggregates[id] = {
          id: objects[0].query_id,
          query_id: objects[0].query_id,
          query_path: objects[0].query_path,
          benchmark_id: objects[0].benchmark_id,
          benchmark_name: objects[0].benchmark_name,
          best_score: { config: best },
          worst_score: { config: worst }
        };
      }

      setAggregatedQueries(query_aggregates);

      // 3. Aggregate on the benchmark level (show highest and lowest score)
      let benchmarkAggregates = {};
      for (const [_, query] of Object.entries(query_aggregates)) {
        const key = query.benchmark_id;
        if (!benchmarkAggregates[key]) {
          benchmarkAggregates[key] = [];
        } else {
          benchmarkAggregates[key].push(query.best_score.config);
        }
      }

      let benchmarkScores = {}
      Object.keys(benchmarkAggregates).forEach((benchmarkId) => {
        benchmarkScores[benchmarkId] = getAggregatedScore(benchmarkAggregates[benchmarkId], store);
      });

      const benchmarkDataMap = new Map();
      const queryIdMap = new Map();
      allConfigsAndMeasurements.forEach(query_config => {
        const benchmarkScore = benchmarkScores[query_config.benchmark_id];
        const benchmark_id = query_config.benchmark_id;
        const benchmark_name = query_config.benchmark_name;

        // Performance Metrics of this plan
        const latencyMean = query_config.m_latency_mean;
        const latencyMedian = query_config.m_latency_median;
        const IO = query_config.m_io + query_config.m_io_hits;
        const memoryToDiskSpills = query_config.m_tmp_spills;
        const numRows = query_config.m_rows;
        const numRowsWidths = query_config.m_rows_width;

        const queryIdSet = queryIdMap.get(benchmark_id) || new Set();
        const numQueries = queryIdSet.size;
        const existingBenchmarkAggregates = benchmarkDataMap.get(benchmark_id) ||
        {
          benchmark_id,
          benchmark_name,
          numQueries,
          benchmarkScore,
          totalRuntime: 0,
          meanRuntime: 0,
          medianRuntime: 0,
          numAlternativePlans: 0,
        };

        // Aggregate data for each benchmark here
        const aggregatedBenchmarkStats = {
          benchmark_id,
          benchmark_name,
          meanRuntime: (existingBenchmarkAggregates.meanRuntime * existingBenchmarkAggregates.numQueries + latencyMean) / (existingBenchmarkAggregates.numQueries + 1),
          medianRuntime: (existingBenchmarkAggregates.medianRuntime * existingBenchmarkAggregates.numQueries + latencyMedian) / (existingBenchmarkAggregates.numQueries + 1),
          totalRuntime: existingBenchmarkAggregates.totalRuntime + latencyMedian,
          benchmarkScore,
          numAlternativePlans: existingBenchmarkAggregates.numAlternativePlans + 1,
          numQueries,
          IO,
          memoryToDiskSpills,
          numRows,
          numRowsWidths
        };
        benchmarkDataMap.set(benchmark_id, aggregatedBenchmarkStats);
        queryIdSet.add(query_config.query_id);
        queryIdMap.set(benchmark_id, queryIdSet);
      });
      // Convert the benchmark data map to an array and sort it by benchmark ID
      const benchmarkData = Array.from(benchmarkDataMap, ([id, data]) => ({ id, ...data }));
      benchmarkData.sort((a, b) => a.id - b.id);
      setAggregatedBenchmarks(benchmarkData);
    }
  }, [allConfigsAndMeasurements, store.latency, store.processedRows, store.io, store.spills])

  useEffect(() => {
    if (store.database && store.benchmark) {
      getQueries(store.database, store.benchmark)
        .then((result) => {
          const queryOp = result.data.filter(q => q.fingerprint).map((query) => {
            const options = {};
            options.value = query.query_id;
            options.label = `Q${query.query_path}`;
            return options;
          });
          store.setQueryOptions(queryOp);
        });

    }
  }, [store.database, store.benchmark])

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
        <DatabaseVisualization parentRef={parentRef} benchmarkTableData={aggregatedBenchmarks} />}
      {parentRef && parentRef.current && parentRef.current.offsetWidth && store.mode === "benchmark" &&
        <BenchmarkVisualization parentRef={parentRef} aggregatedQueries={aggregatedQueries} />}
      {parentRef && parentRef.current && parentRef.current.offsetWidth && store.mode === "query" &&
        <QueryVisualization parentRef={parentRef} />}
    </div>
  )
}

export default MainQueryCentric