import axios from 'axios';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString } from './utils';
import config from '../config';
import moment from 'moment';

const REQUEST_MEASURE_BASE = 'http://api.health.nokia.com/measure';
const REQUEST_WORKOUT_BASE = 'https://api.health.nokia.com/v2/measure';

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
    //console.log(body.more)
    //console.log(body)
    const results = [];
    body.series.forEach((x) => {
        //     x.measures.forEach((y) => {
        //         const value = y.value * (10 ** y.unit);
        //         results.push({ dateTime: x.date, type: y.type, value });
        //     });
        const { category, data } = x;
        if (!(category in [1, 2, 3])) { // Not Walk, Run, Swim
            return;
        }
        const reading = {
            category,
            startdate: x.startdate * 1000,
            enddate: x.enddate * 1000,
        };

        if ('calories' in data) reading.calories = data.calories;
        if ('steps' in data) reading.steps = data.steps;
        if ('distance' in data) reading.distance = data.distance;

        console.log(reading);
    });
    // return results;
}

function getWorkout(token, successCallback, offset) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getworkouts',
        // meastype: '71',
    };
    if (offset) {
        additionalParams.offset = offset;
    }
    const baseString = getBaseString(['GET', REQUEST_WORKOUT_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&${token.access_token_secret}`;
    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);
    const requestUrl = `${REQUEST_WORKOUT_BASE}?${genQueryString(Object.assign(defaultParams, additionalParams))}`;

    axios.get(requestUrl).then(({ data }) => {
        const results = processWorkout(data);
        if (data.body.more) {
            getWorkout(token, successCallback, data.body.offset)
	    }
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





// 1 : Walk
// 2 : Run
// 3 : Hiking
// 4 : Staking
// 5 : BMX
// 6 : Bicycling
// 7 : Swim
// 8 : Surfing
// 9 : KiteSurfing
// 10 : Windsurfing
// 11 : Bodyboard
// 12 : Tennis
// 13 : Table Tennis
// 14: Squash
// 15 : Badminton
// 16 : Lift Weights
// 17 : Calisthenics
// 18 : Elliptical
// 19: Pilate
// 20 : Basketball
// 21 : Soccer
// 22 : Football
// 23 : Rugby
// 24 : VollyBall
// 25 : WaterPolo
// 26 : HorseRiding
// 27 : Golf
// 28 : Yoga
// 29 : Dancing
// 30 : Boxing
// 31 : Fencing
// 32 : Wrestling
// 33 : Martial Arts
// 34 : Skiing
// 35 : SnowBoarding
// 192 : Handball
// 29 : Dancing
// 186 : Base
// 187 : Rowing
// 188 : Zumba
// 191 : Baseball
// 192 : Handball
// 193 : Hockey
// 194 : IceHockey
// 195 : Climbing
// 196 : ICeSkating
