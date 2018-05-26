import axios from 'axios';
import queryString from 'query-string';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString } from './utils';
import config from '../config';

const REQUEST_ACCESS_TOKEN_BASE = 'https://developer.health.nokia.com/account/access_token';

export default function getAccessToken(token, tokenSecret, nokiaUser, successCallback) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        userid: nokiaUser,
        token,
    };

    const baseString = getBaseString(['GET', REQUEST_ACCESS_TOKEN_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&${tokenSecret}`;
    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);
    const requestUrl = `${REQUEST_ACCESS_TOKEN_BASE}?${genQueryString(Object.assign(defaultParams, additionalParams))}`;
    axios.get(requestUrl).then(({ data }) => {
        const aToken = queryString.parse(data);
        successCallback(aToken);
    }).catch((error) => {
        console.log(error);
    });
}