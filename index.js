const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const btoa = require('btoa');
const axios = require('axios');
const config = require('./config');
const queryString = require('query-string')
const uuid = require('uuid/v5');
const moment = require('moment');

let REQUEST_TOKEN_BASE = config.REQUEST_TOKEN_BASE;
let REQUEST_AUTHORIZATION_BASE = config.REQUEST_AUTHORIZATION_BASE;

let KEY = config.KEY;
let SECRET = config.SECRET;

function sortObject(o) {        
    var sorted = {}, key, a = [];
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

function genQueryString(input_params) {
    var params = sortObject(input_params);
    var query_string = "";
    for ( var param in params ) {
        if (    param.indexOf("action") == -1 && 
                param.indexOf("user_id") == -1 && 
                param.indexOf("callbackurl") == -1 && 
                //param.indexOf("comment") == -1 && 
                //param.indexOf("appli") == -1 && 
                param.indexOf("start") == -1 && 
                param.indexOf("end") == -1 //&& 
                //param.indexOf("type") == -1 //&&
                //param.indexOf("meastype") == -1 
            ) { 
            query_string += "oauth_" + param + "=" + params[param] + "&"; 
        } else {
            query_string += param + "=" + params[param] + "&";
        } 
    }
    return query_string.substring(0, query_string.length - 1);
}

function getDefaultParams() {
    return {
        nonce: crypto.randomBytes(16).toString('hex'),
        timestamp: Math.floor(new Date() / 1000),
        consumer_key: KEY,
        signature_method: "HMAC-SHA1",
        version: "1.0",
    }
}

function getBaseString(arr) {
    const arr1 = arr.map(x => require("querystring").escape(x))
    return arr1.join('&');
}

function getBaseSrtingSignature(baseString, oAuthSecret) {
    var hmac = CryptoJS.HmacSHA1(baseString, oAuthSecret);
    var oauth_signature = encodeURIComponent(CryptoJS.HmacSHA1(baseString, oAuthSecret).toString(CryptoJS.enc.Base64));
    return oauth_signature;
}


function getAuthorizationURL(token) {
    var default_params = getDefaultParams();
    default_params["token"] = token.oauth_token
    var baseString = getBaseString(['GET', REQUEST_AUTHORIZATION_BASE, genQueryString(default_params)])
    var oAuthSecret = SECRET + "&" + token.oauth_token_secret;
    
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_AUTHORIZATION_BASE + "?" + genQueryString(default_params);
    console.log("Go to this URL:")
    console.log(request_url)
}

function getToken() {
    var default_params = getDefaultParams();
    var additional_params = {
        callback: encodeURIComponent(config.CANKADO_AUTH + config.CANKADO_USER + '/')
    };

    var baseString = getBaseString(["GET", REQUEST_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    
    var oAuthSecret = SECRET + "&"
    

    
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    
    var request_url = REQUEST_TOKEN_BASE + "?" + genQueryString(default_params);
    //console.log(request_url)
    axios.get(request_url).then(function({ status, data }){
        const token = queryString.parse(data)
        console.log('Secret:', token.oauth_token_secret)
        getAuthorizationURL(token)
    }).catch(function (error) {
        console.log(error);
    });
};





function getoauth(token, token_secret) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token,
        userid: 15354048
    };

    var baseString = getBaseString(["GET", config.REQUEST_ACCESS_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    
    var oAuthSecret = SECRET + "&" + token_secret
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_ACCESS_TOKEN_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));

    axios.get(request_url).then(function({ status, data }){
        const token = queryString.parse(data)
        console.log(token, data)
        getmeasure(token)
        //notification(token)
    }).catch(function (error) {
        console.log(error);
    });
}


function getmeasure(token) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token.oauth_token,
        userid: token.userid,
        action: 'getmeas',
        meastype: '12'
    };

    var baseString = getBaseString(["GET", config.REQUEST_TEMP_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    
    var oAuthSecret = SECRET + "&" + token.oauth_token_secret
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_TEMP_TOKEN_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    //console.log(request_url)
    axios.get(request_url).then(function({ status, data }){
        console.log('Measures: ')
        // console.log(data.body.measuregrps)
        data.body.measuregrps.map(x => {
            const d = moment(x.date * 1000).format('llll')
            let v = null
            x.measures.map(y => {
                if(y.type === 12) {
                    console.log(y)
                    v = y.value * Math.pow(10, y.unit)
                    //v = v - 273.15
                }
            })
            if(v){
                console.log(d, v)
            }
        })

        //notification(token)
    }).catch(function (error) {
        console.log(error);
    });
}

function notification(token, action) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token.oauth_token,
        userid: token.userid,
        action: 'subscribe',
        callbackurl: encodeURIComponent(config.CANKADO_NOTIFY + config.CANKADO_USER + '/'),
        comment: 'test',
        //appli: 12
    };

    var baseString = getBaseString(["GET", config.REQUEST_NOTIFY_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    
    var oAuthSecret = SECRET + "&" + token.oauth_token_secret
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_NOTIFY_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    console.log(request_url)
    axios.get(request_url).then(function({ status, data }){
        console.log(data)
    }).catch(function (error) {
        console.log(error);
    });
}

//getToken();
//console.log(process.argv)
if (process.argv.length === 4) {
    getoauth(process.argv[2], process.argv[3]);
} else {
    getToken();
}







// oauth_token=148962e8250837829796cd60680d077d5259fc459d165033c5574b7f8d2e9e&
// oauth_token_secret=36b2bdb6cec882103bf4bc99e0cc43504c06db70d4d42d224332168372c17&
// userid=15354048&deviceid=0