'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getAccessToken;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _utils = require('./utils');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REQUEST_ACCESS_TOKEN_BASE = 'https://developer.health.nokia.com/account/access_token';

function getAccessToken(token, tokenSecret, nokiaUser, successCallback) {
    var defaultParams = (0, _utils.getDefaultParams)();
    var additionalParams = {
        userid: nokiaUser,
        token: token
    };

    var baseString = (0, _utils.getBaseString)(['GET', REQUEST_ACCESS_TOKEN_BASE, (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams))]);
    var oAuthSecret = _config2.default.SECRET + '&' + tokenSecret;
    defaultParams.signature = (0, _utils.getBaseSrtingSignature)(baseString, oAuthSecret);
    var requestUrl = REQUEST_ACCESS_TOKEN_BASE + '?' + (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams));
    _axios2.default.get(requestUrl).then(function (_ref) {
        var data = _ref.data;

        var aToken = _queryString2.default.parse(data);
        successCallback(aToken);
    }).catch(function (error) {
        console.log(error);
    });
}