import axios from 'axios';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString } from './utils';
import config from '../config';

const REQUEST_MEASURE_BASE = 'http://api.health.nokia.com/measure';
const REQUEST_WORKOUT_BASE = 'http://api.health.nokia.com/measure';

function processMeasures({ body }) {
    const results = [];
    body.measuregrps.forEach((x) => {
        x.measures.forEach((y) => {
            const value = y.value * (10 ** y.unit);
            results.push({ dateTime: x.date, type: y.type, value });
        });
    });
    return results;
}

function processWorkout({ body }) {
    console.log(body.more)
    console.log(body.series)
    // const results = [];
    // body.measuregrps.forEach((x) => {
    //     x.measures.forEach((y) => {
    //         const value = y.value * (10 ** y.unit);
    //         results.push({ dateTime: x.date, type: y.type, value });
    //     });
    // });
    // return results;
}

function getWorkout(token, successCallback) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getworkouts',
        // meastype: '71',
    };
    const baseString = getBaseString(['GET', REQUEST_WORKOUT_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&${token.access_token_secret}`;
    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);
    const requestUrl = `${REQUEST_MEASURE_BASE}?${genQueryString(Object.assign(defaultParams, additionalParams))}`;

    axios.get(requestUrl).then(({ data }) => {
        const results = processWorkout(data);
        // console.log(results)
    }).catch((error) => {
        console.log(error);
    });
    
}


export default function getMeasure(token, successCallback) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getmeas',
        // meastype: '71',
    };
    const baseString = getBaseString(['GET', REQUEST_MEASURE_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&${token.access_token_secret}`;
    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);
    const requestUrl = `${REQUEST_MEASURE_BASE}?${genQueryString(Object.assign(defaultParams, additionalParams))}`;

    axios.get(requestUrl).then(({ data }) => {
        const results = processMeasures(data);
        successCallback({
            timezone: data.body.timezone,
            results,
        });
    }).catch((error) => {
        console.log(error);
    });
    getWorkout(token)
}
