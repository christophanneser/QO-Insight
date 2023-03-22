/// Calculate a score for an individual query configuration (qc)
/// Positive Scores are good, negative scores are bad

const getIndividualScores = (qc) => {
  return {
     latencyScore : (qc.m_default_latency_median - qc.m_latency_median) / qc.m_default_latency_median,
     rowsScore : (qc.m_default_rows - qc.m_rows) / qc.m_default_rows,
     ioScore : ((qc.m_default_io + qc.m_default_io_hits) - (qc.m_io + qc.m_io_hits)) / (qc.m_default_io + qc.m_default_io_hits),
     spillScore : (qc.m_default_tmp_spills - qc.m_tmp_spills) / Math.max(1, qc.m_default_tmp_spills),
  }
}

const getScore = (qc, store) => {
  let latencyScore = (qc.m_default_latency_median - qc.m_latency_median) / qc.m_default_latency_median;
  let rowsScore = (qc.m_default_rows - qc.m_rows) / qc.m_default_rows;
  let ioScore = ((qc.m_default_io + qc.m_default_io_hits) - (qc.m_io + qc.m_io_hits)) / (qc.m_default_io + qc.m_default_io_hits);
  let spillScore = (qc.m_default_tmp_spills - qc.m_tmp_spills) / Math.max(1, qc.m_default_tmp_spills);

  return (latencyScore * store.latency + rowsScore * store.processedRows + ioScore * store.io + spillScore * store.spills) /
    (store.latency + store.processedRows + store.io + store.spills);
}

/// Calculate the aggregated score for a list of query configs
const getAggregatedScore = (qc_list, store) => {
  const latencyDefaultSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_default_latency_median, 0);
  const latencySum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_latency_median, 0);
  const rowsDefaultSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_default_rows, 0);
  const rowsSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_rows, 0);
  const ioDefaultSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_default_io, 0);
  const ioSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_io, 0);
  const ioHitsDefaultSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_default_io_hits, 0);
  const ioHitsSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_io_hits, 0);
  const spillDefaultSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_default_tmp_spills, 0);
  const spillSum = qc_list.reduce((accumulator, qc) => accumulator + qc.m_tmp_spills, 0);

  const aggregated_query_config = {
    m_default_latency_median: latencyDefaultSum,
    m_latency_median: latencySum,
    m_default_rows: rowsDefaultSum,
    m_rows: rowsSum,
    m_default_io: ioDefaultSum,
    m_io: ioSum,
    m_default_io_hits: ioHitsDefaultSum,
    m_io_hits: ioHitsSum,
    m_default_tmp_spills: spillDefaultSum,
    m_tmp_spills: spillSum,
  };

  return getScore(aggregated_query_config, store);
}

export {getScore, getAggregatedScore, getIndividualScores};
