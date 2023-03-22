import React from 'react';
import './App.css';
import { Helmet } from 'react-helmet';
import Home from './pages/Home';
import useStore from './store';
import configData from './config.json';
import { getBenchmarks } from './bridge'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './pages/Intro';

function App() {
  const store = useStore();

  // Things here run only once
  React.useEffect(() => {
    let benchmarks = {};
    Promise.all(configData.databases.map(db => getBenchmarks(db))).then((results) => {
      results.forEach((result, index) => {
        benchmarks[configData.databases[index]] = result.data;
      });
      store.setBenchmarks(benchmarks)
    });
  }, [])

  return (
    <div>
      <Helmet>
        <style>{'body { background-color: #FFFFFF; }'}</style>
      </Helmet>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          {/*<Route path="/home" element={<Home />} />*/}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
