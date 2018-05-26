import axios from 'axios';
import queryString from 'query-string';
import { getDefaultParams, getBaseString, getBaseSrtingSignature, genQueryString, getAuthorizationURL } from './utils';
import config from '../config';

const REQUEST_TOKEN_BASE = 'https://developer.health.nokia.com/account/request_token';

export default function getToken(cankadoUser, successCallback, errorCallback) {
    const defaultParams = getDefaultParams();
    const additionalParams = {
        callback: encodeURIComponent(`${config.CAN_NOKIA_DOMAIN}/2/${cankadoUser}/`),
    };
    const baseString = getBaseString(['GET', REQUEST_TOKEN_BASE, genQueryString(Object.assign(defaultParams, additionalParams))]);
    const oAuthSecret = `${config.SECRET}&`;

    defaultParams.signature = getBaseSrtingSignature(baseString, oAuthSecret);

    const requestUrl = `${REQUEST_TOKEN_BASE}?${genQueryString(defaultParams)}`;
    let authUrl = '';
    axios.get(requestUrl).then(({ data }) => {
        const token = queryString.parse(data);
        authUrl = getAuthorizationURL(token);
        successCallback({
            url: authUrl,
            token,
        });
    }).catch((error) => {
        errorCallback(error);
    });
    return authUrl;
}
