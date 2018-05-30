'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getToken;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _utils = require('./utils');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REQUEST_TOKEN_BASE = 'https://developer.health.nokia.com/account/request_token';

function getToken(cankadoUser, successCallback, errorCallback) {
    var defaultParams = (0, _utils.getDefaultParams)();
    var additionalParams = {
        callback: encodeURIComponent(_config2.default.CAN_NOKIA_DOMAIN + '/2/' + cankadoUser + '/')
    };
    var baseString = (0, _utils.getBaseString)(['GET', REQUEST_TOKEN_BASE, (0, _utils.genQueryString)(Object.assign(defaultParams, additionalParams))]);
    var oAuthSecret = _config2.default.SECRET + '&';

    defaultParams.signature = (0, _utils.getBaseSrtingSignature)(baseString, oAuthSecret);

    var requestUrl = REQUEST_TOKEN_BASE + '?' + (0, _utils.genQueryString)(defaultParams);
    var authUrl = '';
    _axios2.default.get(requestUrl).then(function (_ref) {
        var data = _ref.data;

        var token = _queryString2.default.parse(data);
        authUrl = (0, _utils.getAuthorizationURL)(token);
        successCallback({
            url: authUrl,
            token: token
        });
    }).catch(function (error) {
        errorCallback(error);
    });
    return authUrl;
}