import { getToken, getAccessToken, getMeasure } from './nokia';
import config from './config';
import DB from './db';

let DB_AUTHS = null;
setTimeout(()=>{
    DB_AUTHS = DB.getCollection('search');
}, 3000)



export const getAuthUrl = (req, res, cankado_user) => {
    // var cankado_user = config.CANKADO_USER;
    var token = getToken(cankado_user , ({url, token})=>{
        res.send(`Got to ${url}`)

        let user = DB_AUTHS.findOne({cankado_user})
        if(!user) { 
            user = DB_AUTHS.insert({cankado_user}) 
        }
        DB_AUTHS.update({...user, ...token, cankado_user})
        var results = DB_AUTHS.find();
        console.log(results);
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
    //    DB_AUTHS.update({...results, })
        DB_AUTHS.update({
            ...user,
            access_token: oauth_token,
            access_token_secret: oauth_token_secret,
        })
    });
    res.send(`OK`);
}

export const getTemperature = (req, res, cankado_user) => {
    let user = DB_AUTHS.findOne({ cankado_user });
    console.log(user)
    // var results = DB_AUTHS.find();
    // console.log(results);
    const{ access_token, access_token_secret, nokia_user } = user 
    getMeasure({access_token, access_token_secret, userid: nokia_user})
    res.send(`OK`);
}