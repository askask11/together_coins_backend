const router = require('express').Router();
const verify = require('../models/verify');
const db = require('../models/db');
const ResponseJson = require('../models/responseJson');
//a map of list-id to user-id
const listMap = new Map();

router.use(verify.checkLogin);

async function checkIfListBelongsToUser(req, resp, next)
{
    async function checkDbIsUserInList(list_id, userId) {
        return db.query("SELECT * FROM music_lists WHERE list_id=? AND user_id=?", [list_id, userId]);
    }
    const userId = verify.getUserId(req);
    const list_id = req.params.list_id;
    if(isNaN(list_id))
    {
        resp.status(400).send(ResponseJson.noParamMsg("list_id has to be integer"));
        return;
    }
    try{
    if(listMap.get(list_id)!==userId&&!(await checkDbIsUserInList(list_id, userId))[0].length)
    {
        return resp.status(403).send(ResponseJson.error("This list does not belong to you"));
    }
    }catch (e) {
        console.log(e);
        return resp.status(500).send(ResponseJson.sqlError());
    }
    next();
}

/**
 * 🔑/playback/init_page
 * GET Request parameter:
 * image_list_id: the last list user played on
 * music_list_id: the last music list user played on
 * Response JSON
 * image_lists
 * music_lists
 * images_from_list
 * musics_from_list
 */
router.get("/init_page", async function (req, resp, next) {
    const userId = verify.getUserId(req);
    const image_list_id = req.query.image_list_id;
    const music_list_id = req.query.music_list_id;
    const jsonr = {
        image_lists:[],
        music_lists:[],
        images_from_list:[],
        musics_from_list:[]
    };
    try{
         jsonr.image_lists = (await db.query("SELECT * FROM image_lists WHERE user_id=?",userId))[0];
         for(let i=0;i<jsonr.image_lists.length;i++)
            {
                listMap.set(jsonr.image_lists[i].list_id,userId);
            }
         jsonr.music_lists = (await db.query("SELECT * FROM music_lists WHERE user_id=?",userId))[0];
            for(let i=0;i<jsonr.music_lists.length;i++)
            {
                listMap.set(jsonr.music_lists[i].list_id,userId);
            }
        if(jsonr.image_lists.length!==0)
        {
            jsonr.images_from_list = (await db.query("SELECT * FROM images WHERE list_id=?", image_list_id||jsonr.image_lists[0].list_id))[0]
        }
        if(jsonr.music_lists.length!==0)
        {
            jsonr.musics_from_list = (await db.query("SELECT * FROM musics WHERE list_id=?", music_list_id||jsonr.music_lists[0].list_id))[0];
        }
        resp.status(200).send(ResponseJson.ok(jsonr));
    }catch (e) {
        console.log(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
    });
router.get("/image/lists/:list_id/get_images", async function (req, resp, next) {
    async function checkDbIsUserInList(list_id, userId) {
        return db.query("SELECT * FROM image_lists WHERE list_id=? AND user_id=?", [list_id, userId]);
    }
    const list_id = req.params.list_id;
    const userId = verify.getUserId(req);
    //list id has to be int
    if(isNaN(list_id))
    {
        resp.status(400).send(ResponseJson.noParamMsg("list_id has to be integer"));
        return;
    }
    try{
        //check if this list belongs to user
        if(listMap.get(list_id)!==userId&&!(await checkDbIsUserInList(list_id, userId))[0].length)
        {
            return resp.status(403).send(ResponseJson.error("This list does not belong to you"));
        }
        //get images from list
        const images = (await db.query("SELECT * FROM images WHERE list_id=?", list_id))[0];
        resp.status(200).send(ResponseJson.ok(images));
    }catch (e) {
        console.log(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

router.get("/music/lists/:list_id/get_musics",checkIfListBelongsToUser, async function (req, resp, next) {
    const list_id = req.params.list_id;
    try{
        //get images from list
        const musics = (await db.query("SELECT * FROM musics WHERE list_id=?", list_id))[0];
        resp.status(200).send(ResponseJson.ok(musics));
    }catch (e) {
        console.log(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

//image
async function addOrEditImage(req, resp, next) {
    //either 0. list of paths 1. list of urls
    // const isExternal = req.body.external||1;
    const paths = req.body.paths;
    if(!(paths instanceof Array))
    {
        return resp.status(400).send(ResponseJson.err("paths has to be an array"));
    }
    const list_id = req.params.list_id;
    const values = paths.map((path)=>[list_id, path]);
    try{
        await db.query("INSERT INTO images (list_id, path) VALUES ?", [values]);
        resp.status(200).send(ResponseJson.ok("Aha!"));
    }catch (e) {
        console.log(e);
        resp.status(500).send(ResponseJson.sqlError());
    }

}
router.post("/image/lists/:list_id/add_images",verify.cleanUpBody,checkIfListBelongsToUser, addOrEditImage);


//music
async function addOrEditMusic(req, resp, next){
    const list_id = req.params.list_id;
    const title = req.body.title;
    const author = req.body.author;
    const path = req.body.path;
    const album_path = req.body.album_path;
    const lyric_path = req.body.lyric_path;
    if(!title||!author||!path)
    {
        return resp.status(400).send(ResponseJson.noParamMsg("Missing required fields"));
    }
    try{
        await db.query("INSERT INTO musics (list_id, title, author, path, album_path, lyric_path) VALUES (?,?,?,?,?,?)", [list_id, title, author, path, album_path, lyric_path]);
        resp.status(200).send(ResponseJson.ok("Aha!"));
    }catch (e) {
        console.log(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
}
router.post("/music/lists/:list_id/add_music",verify.cleanUpBody,checkIfListBelongsToUser, addOrEditMusic);



module.exports=router;