var express = require('express');
var router = express.Router();
const verify = require('../models/verify');
const db = require('../models/db');
const ResponseJson = require('../models/responseJson');
// require('dotenv').config();

/**
 * @swagger
 * /user/login:
 *  post:
 *  summary: Login
 *  description: Login to the system
 *  requestBody:
 *  required: true
 *  content:
 *    application/json:
 *    schema:
 *      type: object
 *      properties:
 *      username:
 *      type: string
 *      password:
 *      type: string
 *      required:
 *      - username
 *      - password
 *      example:
 *      username: user
 *      password: password
 *      responses:
 *      200:
 *      description: A successful response
 *      400:
 *      description: Invalid username or password
 *      401:
 *      description: Invalid username or password
 *      500:
 *      description: Internal server error
 *      content:
 *      application/json:
 *
 */
router.post('/login', function(req, res, next) {
    //const { username, password } = req.body;
    let jsonr = {};
    if(!req.body){
        return res.status(401).send(ResponseJson.noParamMsg("bro, you are not sending anything. use www-form-urlencoded"));
    }
    const username = req.body["username"]||false;
    const password = req.body["password"]||false;
    if (!username || !password) {
        return res.status(400).send(new ResponseJson("invalid_login","Invalid username or password, they are EMPTY!!!"));
    }

    const query = `SELECT * FROM users LEFT JOIN statuses ON users.status=statuses.status_id WHERE email = ? AND password = ?`;
    try{
        // check for username and password
        db.query(query, [username, password])
            .then(([result]) => {
                //check if the username/pwd match
                if (result.length === 0) {
                    return res.status(401).send(new ResponseJson("invalid_login", "Invalid username or password"));
                }
                //fill data to json return
                result[0].password = undefined; // don't send password back to client
                jsonr.token = verify.generateToken({user_id: result[0].user_id, bind_user: result[0].bind_user});
                jsonr.user = result[0];
                jsonr.bind_user=null;

                //find his/her lover's information, i.e. if this user has binded another user.
                if(!result[0].bind_user){
                    return res.send(ResponseJson.ok(jsonr)); // the user didn't bind someone else
                }

                // Fetch the information of his/her partner
                db.query("SELECT * FROM users LEFT JOIN statuses ON users.status=statuses.status_id WHERE user_id=?",result[0].bind_user).then(([result2])=>{

                    //bind user has deleted their account
                    if(result2.length===0)
                    {
                        db.query("UPDATE users SET bind_user=null WHERE user_id=?", result[0].user_id);
                        return res.send(ResponseJson.ok(jsonr));
                    }

                    //return the current user information with bind user
                    result2[0].password=undefined;
                    result2[0].coin_balance=undefined;
                    result2[0].token="";

                    //send data back to client
                    jsonr.bind_user=result2[0];
                    return res.send(ResponseJson.ok(jsonr));
                }).catch((err)=>{
                    console.log(err);
                    return req.status(500).send(ResponseJson.sqlError());
                });
            }).catch((err) => {
                console.log(err);
                return res.status(500).send(ResponseJson.sqlError());
            });
    }catch (e) {
        //print error
        console.log(e);
        return res.status(500).send(ResponseJson.sqlError())
    }
});

router.get("/getHomepageData", verify.checkLogin, function(req, resp, next){
    const userId = verify.getUserId(req);
})

router.post('/register',function(req, res, next){
   res.send("bruh!")
})

router.get('/getCoins',verify.checkLogin, function(req, resp, next){
    const userId = verify.getUserId(req);
    db.query("SELECT coin_balance FROM users WHERE user_id=?",userId).then(([result])=>{
        if(result.length===0){
            return resp.status(404).send(ResponseJson.err("User not found"));
        }
        return resp.send(ResponseJson.ok(result[0]));
    }).catch((err)=>{
        console.log(err);
        return resp.status(500).send(ResponseJson.sqlError());
    });
})

router.get('/logout', function(req, res, next) {
    res.send(ResponseJson.err("Not implemented"));
});



router.get('/protected', verify.checkLogin, function(req, res, next) {
    res.send('You are logged in');
});

module.exports = router;
