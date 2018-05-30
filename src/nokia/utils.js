import  crypto from 'crypto';
import CryptoJS from 'crypto-js';
import  config from '../config';

const {
    KEY,
    SECRET,
} = config;
console.log(KEY, SECRET, config)
const REQUEST_AUTHORIZATION_BASE = 'https://developer.health.nokia.com/account/authorize';

export function sortObject(o) {
    const sorted = {};
    let key = null;
    const a = [];
    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);    
        }
    }
    a.sort();
    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

export function genQueryString(input_params) {
    const params = sortObject(input_params);
    let query_string = [];
    for ( var param in params ) {
        if ( param.indexOf('action') == -1 && 
                param.indexOf('user_id') == -1 && 
                param.indexOf('callbackurl') == -1 && 
                param.indexOf('start') == -1 && 
                param.indexOf('lastupdate') == -1 && 
                param.indexOf('end') == -1 &&
                param.indexOf('offset') == -1
            ) { 
            query_string.push('oauth_' + param + '=' + params[param]); 
        } else {
            query_string.push(param + '=' + params[param]);
        } 
    }
    query_string = query_string.sort().join('&')
    return query_string
}



export function getBaseString(arr) {
    const arr1 = arr.map(x => require('querystring').escape(x))
    return arr1.join('&');
}

export function getBaseSrtingSignature(baseString, oAuthSecret) {
    var hmac = CryptoJS.HmacSHA1(baseString, oAuthSecret);
    var oauth_signature = encodeURIComponent(CryptoJS.HmacSHA1(baseString, oAuthSecret).toString(CryptoJS.enc.Base64));
    return oauth_signature;
}


export function getAuthorizationURL(token) {
    const default_params = getDefaultParams();
    default_params['token'] = token.oauth_token
    const baseString = getBaseString(['GET', REQUEST_AUTHORIZATION_BASE, genQueryString(default_params)])
    const oAuthSecret = SECRET + '&' + token.oauth_token_secret;
    
    default_params['signature'] = getBaseSrtingSignature(baseString, oAuthSecret);

    const request_url = REQUEST_AUTHORIZATION_BASE + '?' + genQueryString(default_params);
    console.log('Go to this URL:')
    console.log(request_url)
    return request_url;
}

export function getDefaultParams() {
    return {
        nonce: crypto.randomBytes(16).toString('hex'),
        timestamp: Math.floor(new Date() / 1000),
        consumer_key: KEY,
        signature_method: 'HMAC-SHA1',
        version: '1.0',
    }
}
