import axios from 'axios';
import { Client } from 'pg';
import uuid from 'uuid/v4'; 
import moment from 'moment';
import _ from 'lodash';

import { getToken, getAccessToken, getMeasure } from './nokia';
import config from './config';
import DB from './db';

let DB_AUTHS = null;

setTimeout(() => {
    DB_AUTHS = DB.getCollection('search');
}, 3000);


const client = new Client({
    user: 'postgres',
    host: 'ssh.kraftvoll.co',
    database: 'cankadoREST',
    password: '123456',
    port: 5432,
});
client.connect();

export const getAuthUrl = (req, res, cankadoUser) => {
    getToken(cankadoUser, ({ url, token }) => {
        let user = DB_AUTHS.findOne({ cankadoUser });
        if (!user) {
            user = DB_AUTHS.insert({ cankadoUser });
        }
        DB_AUTHS.update({ ...user, ...token, cankadoUser });
        res.redirect(url);
    }, () => {
        res.status(400);
        res.send('Error');
    });
};

export const getDataToken = (req, res, cankado_user) => {
    let user = DB_AUTHS.findOne({ cankado_user });
    const { oauth_token, oauth_verifier, userid } = req.query;
    if (!userid) {
        res.redirect(`${config.CANKADO_DOMAIN}/patient/#/patient/devices/nokia`);
        return;
    }
    user = DB_AUTHS.update({
        ...user,
        user_token: oauth_token,
        user_token_verifier: oauth_verifier,
        nokia_user: userid,
    });
    getAccessToken(
        oauth_token,
        user.oauth_token_secret,
        userid,
        ({ oauth_token, oauth_token_secret }) => {
            DB_AUTHS.update({
                ...user,
                access_token: oauth_token,
                access_token_secret: oauth_token_secret,

            });
            axios.get(`${config.CANKADO_AUTH}${user.cankado_user}/?userid=${userid}`).then((d) => {
                // const { nokia_user, cankado_user } = user
                // setNotification({access_token: oauth_token, access_token_secret: oauth_token_secret, userid: nokia_user, cankado_user})
                res.redirect(`${config.CANKADO_DOMAIN}/patient/#/patient/devices/nokia`);
                // res.send('OK');
            }).catch(() => {
                res.send('NOT OK');
            });
        },
    );
};

function updateDB(cankado_user, { timezone, results }) {
    if (results.length) {
        const inserts = [];
        results.map((r) => {
            const dateTime = `${moment(r.dateTime * 1000).format('YYYY-MM-DD HH:mm:ss')} ${timezone}`;
            const { value } = r;
            inserts.push(` (TIMESTAMP \'${dateTime}\', ${value}, \'${cankado_user}\', \'${String(uuid())}\', \'t\')`)
        });
        const q = `insert into nokia_nokiareading ("dateTime", value, patient_id, uuid, active) values ${inserts.join(',')}; delete from nokia_nokiareading na using nokia_nokiareading nb where "na"."patient_id" = "nb"."patient_id" and "na"."dateTime" = "nb"."dateTime" and "na"."uuid" < "nb"."uuid"`;
        client.query(
            q, [],
            (err) => { console.log(err ? err.stack : 'Inserted'); },
        );
    }
}


export const getTemperature = (req, res, cankado_user) => {
    const user = DB_AUTHS.findOne({ cankado_user });
    const {
        access_token,
        access_token_secret,
        nokia_user,
        lastupdate,
    } = user;
    getMeasure({
        access_token,
        access_token_secret,
        userid: nokia_user,
        lastupdate,
    }, (v) => {
        updateDB(cankado_user, v);
        DB_AUTHS.update({
            ...user,
            lastupdate: _.maxBy(v.results, 'dateTime').dateTime,
        });
    });
    res.send(`UPDATING DB ${new Date().getTime()}`);
};
