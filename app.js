var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();



const usersRouter = require('./routes/users');
const uploadRouter = require('./routes/upload');
const taskRouter = require("./routes/task");
const app = express();
app.use(express.json());
app.use(logger('dev'));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

/*ROUTERS HERE*/
app.use('/user', usersRouter);
app.use('/files', uploadRouter);
app.use('/task',taskRouter);
app.use("/playback", require("./routes/playback"));

/*app.listen(process.env.PORT, function(){
  console.log('Server is running on port '+process.env.PORT);
});
 */

//websocket here...


// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  res.status(404).send({error:"Not found"});
});*/
// exit database
function exitdb(){
    const db = require('./models/db');
    console.log("Closing database connection");
    try{db.end();}catch (e) {
        console.log("Error closing database connection");
    }
    console.log("Database connection closed");
}
process.on('SIGINT', function() {
  console.log("Caught interrupt signal");
    exitdb();
  process.exit();
});
process.on('SIGTERM', function() {
    console.log("Caught termination signal");
    exitdb()
    process.exit();
});
process.on('exit', function() {
    console.log("Exiting...");
    exitdb();
    console.log("Exiting...");
});

module.exports = app;
