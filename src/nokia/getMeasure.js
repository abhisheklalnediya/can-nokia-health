import axios from 'axios';
import { Client } from 'pg';
import moment from 'moment';
import uuid from 'uuid/v4';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString } from './utils';
import config from '../config';

const REQUEST_MEASURE_BASE = 'http://api.health.nokia.com/measure';
const REQUEST_WORKOUT_BASE = 'https://api.health.nokia.com/v2/measure';
const ACTIVITY = {
'1': 'Walk',
'2': 'Run',
'3': 'Hiking',
'4': 'Staking',
'5': 'BMX',
'6': 'Bicycling',
'7': 'Swim',
'8': 'Surfing',
'9': 'KiteSurfing',
'10': 'Windsurfing',
'11': 'Bodyboard',
'12': 'Tennis',
'13': 'Table Tennis',
'14': 'Squash',
'15': 'Badminton',
'16': 'Lift Weights',
'17': 'Calisthenics',
'18': 'Elliptical',
'19': 'Pilate',
'20': 'Basketball',
'21': 'Soccer',
'22': 'Football',
'23': 'Rugby',
'24': 'VollyBall',
'25': 'WaterPolo',
'26': 'HorseRiding',
'27': 'Golf',
'28': 'Yoga',
'29': 'Dancing',
'30': 'Boxing',
'31': 'Fencing',
'32': 'Wrestling',
'33': 'Martial Arts',
'34': 'Skiing',
'35': 'SnowBoarding',
'192': 'Handball',
'29': 'Dancing',
'186': 'Base',
'187': 'Rowing',
'188': 'Zumba',
'191': 'Baseball',
'192': 'Handball',
'193': 'Hockey',
'194': 'IceHockey',
'195': 'Climbing',
'196': 'ICeSkating',
}

const client = new Client({
    user: 'postgres',
    host: 'ssh.kraftvoll.co',
    database: 'cankadoREST',
    password: '123456',
    port: 5432,
});
client.connect();

function updateDBWorkout(cankado_user, results) {
    if (results.length) {
        const inserts = [];
        results.forEach((r) => {
            const startDateTime = `${moment(r.startdate).format('YYYY-MM-DD HH:mm:ss')} ${r.timezone}`;
            const endDateTime = `${moment(r.enddate).format('YYYY-MM-DD HH:mm:ss')} ${r.timezone}`;
            const { calories, distance, steps, category } = r;
            const catLabel = ACTIVITY[String(category)]
            inserts.push(` (TIMESTAMP '${startDateTime}', TIMESTAMP '${endDateTime}', ${category}, '${catLabel}', ${calories}, ${steps}, ${distance}, '${cankado_user}', '${String(uuid())}', 't')`);
console.log(category, startDateTime, r.startdate)
        });
        const q = `insert into nokia_nokiaworkoutreading
            ("startDateTime", "endDateTime", type, "typeLabel", calories, steps, distance, patient_id, uuid, active) values 
            ${inserts.join(',')};
            delete from nokia_nokiareading na using nokia_nokiareading nb where "na"."patient_id" = "nb"."patient_id" and "na"."dateTime" = "nb"."dateTime" and "na"."type" = "nb"."type" and "na"."uuid" < "nb"."uuid"`;
 console.log(q)
        client.query(
            q, [],
            (err) => { console.log(err ? err.stack : 'Inserted Workout'); },
        );
    }
}

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
    const results = [];
    body.series.forEach((x) => {
        //     x.measures.forEach((y) => {
        //         const value = y.value * (10 ** y.unit);
        //         results.push({ dateTime: x.date, type: y.type, value });
        //     });
        const { category, data, timezone } = x;
        if (!([1, 2, 7].includes(category))) { // Not Walk, Run, Swim
            return;
        }
        const reading = {
            category,
            timezone,
            startdate: x.startdate * 1000,
            enddate: x.enddate * 1000,
        };

        reading.calories = ('calories' in data) ? data.calories : null;
        reading.steps = ('steps' in data) ? data.steps : null;
        reading.distance = ('distance' in data) ? data.distance : null;
        results.push(reading);
    });
    return results;
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
        updateDBWorkout(token.cankado_user, results);
        if (data.body.more) {
            getWorkout(token, successCallback, data.body.offset);
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
