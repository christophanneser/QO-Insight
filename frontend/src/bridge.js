import axios from 'axios';
import configData from './config.json';

export const getBenchmarks = (database) => axios.get(`${configData.baseURL}/${database}/benchmarks`);

export const getQueries = (database, benchmark = '') => axios.get(`${configData.baseURL}/${database}/queries?benchmark=${benchmark}`);

export const getOptimizerConfigsAndMeasurements = (database, query = '', includePlans = false) => axios.get(`${configData.baseURL}/${database}/configs-measurements?include_plans=${includePlans}&query=${query}`);

export const getGroupedHintSets = (database, benchmark) => axios.get(`${configData.baseURL}/${database}/group-hints?benchmark=${benchmark}`);

//export const getOptimizerConfigs = (database, query = '') => axios.get(`${configData.baseURL}/${database}/configs?${query}`);
//export const getMeasurement = (database, mid) => axios.get(`${configData.baseURL}/${database}/measurement/${mid}`);
//export const getQuerySpan = (database, query) => axios.get(`${configData.baseURL}/${database}/span/${query}`);
