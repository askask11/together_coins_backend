
const SECRET_KEY=process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const responseJson = require("./responseJson");
//require ('dotenv').config();



class TokenBody {
    constructor(user_id) {
        this.user_id = user_id;
    }
}


class Verify
{
    constructor() {
        //this.SECRET_KEY = process.env.SECRET_KEY;
    }
    checkLogin(req, res, next) {
        if(process.env.BYPASS_AUTH){return next();}
        if (!req.headers["authorization"]) {
            return res.status(403).send(responseJson.noLogin());
        }
        const token = req.headers["authorization"].split(' ')[1];
        if (!token) {
            return res.status(403).send(responseJson.noLogin());
        }
        //verify jwt
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) return res.status(403).send(responseJson.noLogin());
            req.user = user;
            next();
        });
    }
    //
    generateToken(tokenBody) {
        //console.log("secret key: "+SECRET_KEY);
        return jwt.sign(tokenBody, SECRET_KEY, { expiresIn: '15m' });//change
    }

    getUserId(requestObject)
    {
        return requestObject.user.user_id;
    }

    getBindUserId(req)
    {
        return req.user.bind_user;
    }

    cleanUpBody(req, resp, next)
    {
        if(!req.body){req.body={};}
        return next();
    }

    skippedAuth() {
        return process.env.BYPASS_AUTH;
    }
}



module.exports = Verify.prototype;

