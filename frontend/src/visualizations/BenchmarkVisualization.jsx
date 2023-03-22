import React, { useEffect } from 'react';
import Barchart from '../graphs/barchart_benchmark/Barchart';
import QuerySummaryTable from '../graphs/QuerySummaryTable';
import useStore from '../store';
import Divider from "@mui/material/Divider";
import BorderLinearProgress from "../components/BorderLinearProgress";

const BenchmarkVisualization = ({ parentRef, aggregatedQueries }) => {
    const store = useStore();
    const [benchmarkData, setBenchmarkData] = React.useState({})


    useEffect(() => {
        if (aggregatedQueries && store.benchmark) {
            let r = Object.values(aggregatedQueries).filter(d => d.best_score.config.score > 0 && store.benchmark === d.benchmark_id).sort((a, b) => b.best_score.config.score - a.best_score.config.score);
            setBenchmarkData(r);
        }
    }, [store.benchmark, aggregatedQueries])

    return (
        <div style={{ height: '100%', width: '100%', marginBottom: 10 }}>
            {Object.values(benchmarkData).length && parentRef && parentRef.current && parentRef.current.offsetWidth ?
                <Barchart
                    data={benchmarkData.slice(0,50)}
                    style={{ height: '100%' }}
                    parentRef={parentRef}
                /> :
                <BorderLinearProgress style={{ marginTop: 50 }} />
            }
            <div style={{ height: '100%', width: '100%', marginBottom: 10 }}>
                <Divider sx={{ borderBottomWidth: 10 }} />
                <div style={{
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 10,
                    height: '50%'
                }}>
                    <QuerySummaryTable queryData={benchmarkData} />
                </div>
            </div>
        </div>
    )
}

export default BenchmarkVisualization;
