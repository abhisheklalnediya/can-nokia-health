import axios from 'axios';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString } from './utils';
import config from '../config';

const REQUEST_MEASURE_BASE = 'http://api.health.nokia.com/measure';
export default function getMeasure(token, successCallback) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getmeas',
        meastype: '71',
    };
    const baseString = getBaseString(['GET', REQUEST_MEASURE_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&${token.access_token_secret}`;
    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);
    const requestUrl = `${REQUEST_MEASURE_BASE}?${genQueryString(Object.assign(defaultParams, additionalParams))}`;

    axios.get(requestUrl).then(({ data }) => {
        const results = [];
        data.body.measuregrps.forEach((x) => {
            x.measures.forEach((y) => {
                let v = null;
                if (y.type === 71) {
                    v = y.value * Math.pow(10, y.unit);
                }
                results.push({ dateTime: x.date, type: y.type, value: v });
            });
        });
        successCallback({
            timezone: data.body.timezone,
            results,
        });
    }).catch((error) => {
        console.log(error);
    });
}
