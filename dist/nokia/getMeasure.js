'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getMeasure;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _pg = require('pg');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _utils = require('./utils');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REQUEST_MEASURE_BASE = 'http://api.health.nokia.com/measure';
var REQUEST_WORKOUT_BASE = 'https://api.health.nokia.com/v2/measure';
var ACTIVITY = {
    1: 'Walking',
    2: 'Running',
    3: 'Hiking',
    4: 'Staking',
    5: 'BMX',
    6: 'Bicycling',
    7: 'Swimming',
    8: 'Surfing',
    9: 'KiteSurfing',
    10: 'Windsurfing',
    11: 'Bodyboard',
    12: 'Tennis',
    13: 'Table Tennis',
    14: 'Squash',
    15: 'Badminton',
    16: 'Lift Weights',
    17: 'Calisthenics',
    18: 'Elliptical',
    19: 'Pilate',
    20: 'Basketball',
    21: 'Soccer',
    22: 'Football',
    23: 'Rugby',
    24: 'VollyBall',
    25: 'WaterPolo',
    26: 'HorseRiding',
    27: 'Golf',
    28: 'Yoga',
    29: 'Dancing',
    30: 'Boxing',
    31: 'Fencing',
    32: 'Wrestling',
    33: 'Martial Arts',
    34: 'Skiing',
    35: 'SnowBoarding',
    192: 'Handball',
    186: 'Base',
    187: 'Rowing',
    188: 'Zumba',
    191: 'Baseball',
    193: 'Hockey',
    194: 'IceHockey',
    195: 'Climbing',
    196: 'ICeSkating'
};

var client = new _pg.Client({
    user: 'postgres',
    host: 'ssh.kraftvoll.co',
    database: 'cankadoREST',
    password: '123456',
    port: 5432
});
client.connect();

function updateDBWorkout(cankado_user, results) {
    if (results.length) {
        var inserts = [];
        results.forEach(function (r) {
            var startDateTime = (0, _moment2.default)(r.startdate).format('YYYY-MM-DD HH:mm:ss') + ' ' + r.timezone;
            var endDateTime = (0, _moment2.default)(r.enddate).format('YYYY-MM-DD HH:mm:ss') + ' ' + r.timezone;
            var calories = r.calories,
                distance = r.distance,
                steps = r.steps,
                category = r.category;

            var catLabel = ACTIVITY[String(category)];
            inserts.push(' (TIMESTAMP \'' + startDateTime + '\', TIMESTAMP \'' + endDateTime + '\', ' + category + ', \'' + catLabel + '\', ' + calories + ', ' + steps + ', ' + distance + ', \'' + cankado_user + '\', \'' + String((0, _v2.default)()) + '\', \'t\')');
        });
        var q = 'insert into nokia_nokiaworkoutreading\n            ("startDateTime", "endDateTime", type, "typeLabel", calories, steps, distance, patient_id, uuid, active) values \n            ' + inserts.join(',') + ';\n            delete from nokia_nokiaworkoutreading na using nokia_nokiaworkoutreading nb where "na"."patient_id" = "nb"."patient_id" and "na"."startDateTime" = "nb"."startDateTime" and "na"."type" = "nb"."type" and "na"."uuid" < "nb"."uuid"';
        client.query(q, [], function (err) {
            console.log(err ? err.stack : 'Inserted Workout');
        });
    }
}

function processMeasures(_ref) {
    var body = _ref.body;

    var results = [];
    body.measuregrps.forEach(function (x) {
        x.measures.forEach(function (y) {
            var value = y.value * Math.pow(10, y.unit);
            results.push({ dateTime: x.date, type: y.type, value: value });
        });
    });
    return results;
}

function processWorkout(_ref2) {
    var body = _ref2.body;

    var results = [];
    body.series.forEach(function (x) {
        var category = x.category,
            data = x.data,
            timezone = x.timezone;

        if (![1, 2, 7].includes(category)) {
            // Not Walk, Run, Swim
            return;
        }
        var reading = {
            category: category,
            timezone: timezone,
            startdate: x.startdate * 1000,
            enddate: x.enddate * 1000
        };

        reading.calories = 'calories' in data ? data.calories : null;
        reading.steps = 'steps' in data ? data.steps : null;
        reading.distance = 'distance' in data ? data.distance : null;
        results.push(reading);
    });
    return results;
}

function getWorkout(token, successCallback, offset) {
    var defaultParams = (0, _utils.getDefaultParams)();
    var additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getworkouts'
    };
    if (offset) {
        additionalParams.offset = offset;
    }
    var baseString = (0, _utils.getBaseString)(['GET', REQUEST_WORKOUT_BASE, (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams))]);
    var oAuthSecret = _config2.default.SECRET + '&' + token.access_token_secret;
    defaultParams.signature = (0, _utils.getBaseSrtingSignature)(baseString, oAuthSecret);
    var requestUrl = REQUEST_WORKOUT_BASE + '?' + (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams));

    _axios2.default.get(requestUrl).then(function (_ref3) {
        var data = _ref3.data;

        var results = processWorkout(data);
        updateDBWorkout(token.cankado_user, results);
        if (data.body.more) {
            getWorkout(token, successCallback, data.body.offset);
        }
    }).catch(function (error) {
        console.log(error);
    });
}

function getMeasure(token, successCallback) {
    var defaultParams = (0, _utils.getDefaultParams)();
    var additionalParams = {
        token: token.access_token,
        userid: token.userid,
        action: 'getmeas'
        // meastype: '71',
    };
    var baseString = (0, _utils.getBaseString)(['GET', REQUEST_MEASURE_BASE, (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams))]);
    var oAuthSecret = _config2.default.SECRET + '&' + token.access_token_secret;
    defaultParams.signature = (0, _utils.getBaseSrtingSignature)(baseString, oAuthSecret);
    var requestUrl = REQUEST_MEASURE_BASE + '?' + (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams));

    _axios2.default.get(requestUrl).then(function (_ref4) {
        var data = _ref4.data;

        console.log(data);
        var results = processMeasures(data);
        successCallback({
            timezone: data.body.timezone,
            results: results
        });
    }).catch(function (error) {
        console.log(error);
    });
    getWorkout(token);
}