import axios from 'axios';
import { Client } from 'pg';
import uuid from 'uuid/v4'; 
import moment from 'moment';
import { getToken, getAccessToken, getMeasure, setNotification } from './nokia';
import config from './config';
import DB from './db';
import _ from 'lodash';
let DB_AUTHS = null;

setTimeout(()=>{
    DB_AUTHS = DB.getCollection('search');
}, 3000)


const client = new Client({
    user: 'postgres',
    host: 'iapi.kraftvoll.co',
    database: 'cankadoREST',
    password: '123456',
    port: 5432,
  })
  client.connect()

export const getAuthUrl = (req, res, cankado_user) => {
    // var cankado_user = config.CANKADO_USER;
    var token = getToken(cankado_user , ({url, token})=>{
        let user = DB_AUTHS.findOne({cankado_user})
        if(!user) {
            user = DB_AUTHS.insert({cankado_user});
        }
        DB_AUTHS.update({...user, ...token, cankado_user})
        var results = DB_AUTHS.find();
        res.redirect(url)
    }, () => {
        res.status(400);
        res.send('Error');
    });
}

export const getDataToken = (req, res, cankado_user) => {
    let user = DB_AUTHS.findOne({ cankado_user });
    const { oauth_token, oauth_verifier, userid} = req.query;
    user = DB_AUTHS.update({
        ...user,
        user_token: oauth_token,
        user_token_verifier: oauth_verifier,
        nokia_user: userid
    });

    getAccessToken(oauth_token, user.oauth_token_secret, ({oauth_token, oauth_token_secret})=>{
        DB_AUTHS.update({
            ...user,
            access_token: oauth_token,
            access_token_secret: oauth_token_secret,

        })
        axios.get(`${config.CANKADO_AUTH}${user.cankado_user}/?userid=${userid}`).then((d) => {
            const{ access_token, access_token_secret, nokia_user, cankado_user } = user
            setNotification({access_token, access_token_secret, userid: nokia_user, cankado_user})
            res.redirect('http://npat.kraftvoll.co/patient/#/patient/devices/nokia');
        }).catch(() => {
            res.send('NOT OK')
        })
    });
}

function updateDB(cankado_user, {timezone, results}) {
    results.map(r => {
        console.log(r.dateTime);
        const dateTime = `${moment(r.dateTime * 1000).format('YYYY-MM-DD HH:mm:ss')} ${timezone}`;
        const { value } = r;
        const q = `insert into nokia_nokiareading ("dateTime", value, patient_id, uuid, active) values (TIMESTAMP \'${dateTime}\', ${value}, \'${cankado_user}\', \'${String(uuid())}\', \'t\');`
        client.query(
            q,[],
            (err, res) => {
            console.log(err ? err.stack : 'Inserted')
        })
    })
    
    
}

export const getTemperature = (req, res, cankado_user) => {
    let user = DB_AUTHS.findOne({ cankado_user });
    console.log(user)
    const{ access_token, access_token_secret, nokia_user, lastupdate } = user
    getMeasure({access_token, access_token_secret, userid: nokia_user, lastupdate}, (v)=>{
        updateDB(cankado_user, v)
        DB_AUTHS.update({
            ...user, 
            lastupdate: _.maxBy(v.results, 'dateTime').dateTime
        })
    })
    res.send(`UPDATING DB`);
}
