/**
 * Module dependencies.
 */
// var rimraf = require("rimraf");
var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    cleanup = require('./cleanup');
//var methodOverride = require('method-override');
var session = require('express-session');
var app = express();
var mysql = require('mysql');
var bodyParser = require("body-parser");
var connection = mysql.createConnection({
    host: '192.168.1.119',
    // host     : 'localhost',
    user: 'comp5322',
    password: 'comp5322project',
    database: 'comp5322'
});

connection.connect();

global.db = connection;


//CK @ 2018-03-31, integrate with Shawn's code start
// First Integration Part
const url = require('url')
const fs = require('fs')
const util = require('util')
const events = require('events')

const template = require('art-template')
const formidable = require('formidable')
const WebSocket = require('ws')
const ffmpeg = require('fluent-ffmpeg')

function display_upload_file_html(request, response) {
    return new Promise((resolve, reject) => {
        let file_path = __dirname + '/views/upload_file.html'
        response.writeHead(200, {
            'Content-type': 'text/html'
        })
        response.end(template(file_path, {
            title: 'Upload File'
        }))
        resolve()
    })
}
global.display_upload_file_html = display_upload_file_html;

function display_my_video_html(request, response) {
    return new Promise((resolve, reject) => {
        let file_path = __dirname + '/views/my_video.html'
        response.writeHead(200, {
            'Content-type': 'text/html'
        })
        response.end(template(file_path, {
            title: 'My Meme'
        }))
        resolve()
    })
}
global.display_my_video_html = display_my_video_html;

function display_static_resoures(request, response) {
    return new Promise((resolve, reject) => {
        let pathname = url.parse(request.url, true).pathname
        let file_path = __dirname + pathname
        fs.readFile(file_path, (err, file_content) => {
            if (err) {
                reject(err)
                return
            }
            response.writeHead(200)
            response.end(file_content)
            resolve()
        })
    })
}
global.display_static_resoures = display_static_resoures;

function upload_process(request, response) {
    return new Promise((resolve, reject) => {
        if (request.method.toLowerCase() !== 'post') {
            return
        }
        let form = new formidable.IncomingForm()
        form.uploadDir = __dirname + '/static/uploaded'
        form.maxFileSize = 50 * 1024 * 1024
        form.keepExtensions = true
        form.parse(request, function(err, fields, files) {
            if (err) {
                reject(err)
            } else {
                let single_file = files.file
                resolve(single_file.path)
            }
        })
    })
}
global.upload_process = upload_process;

function insert_vid(file_path, request, response) {
    return new Promise((resolve, reject) => {
        if (request.method.toLowerCase() !== 'post') {
          console.log('return');
            return
        }
        var user = request.session.user, userId = request.session.userId;
        // if (userId == null) {
        //     console.log('User session not found, redirect to login page.');
        //     response.redirect("/login");
        //     return;
        // }
        var basename = path.basename(file_path);
        var filename = basename.split('.')[0];
        var ext = basename.split('.')[1];
        var sql = "INSERT INTO videos (`name`, `userid`) VALUES ('"+ filename +"',"+ userId +")";
        // console.log(sql);

        db.query(sql, function(err, results) {
          console.log("results: " + results);
           if (err) {
                reject(err)
            } else {
                resolve(results.affectedRows)
            }
        });
    })
}
global.insert_vid = insert_vid;

function call_ffmpeg(file_path) {
    var basename = path.basename(file_path);
    var filename = basename.split('.')[0];
    var ext = basename.split('.')[1];
    // console.log(basename);
    console.log(filename);
    console.log(ext);
    let ffmpeg_instance = ffmpeg(file_path)
    return new Promise((resolve, reject) => {
        ffmpeg_instance.addOptions([
                '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
                '-level 3.0',
                '-start_number 0', // start the first .ts segment at index 0
                '-hls_time 10', // 10 second segment duration
                '-hls_list_size 0', // Maxmimum number of playlist entries (0 means all entries/infinite)
                '-f hls' // HLS format
            ])
            .output('static/video/'+ filename +'.m3u8')
            .on('progress', progress => {
                eventEmit.emit('segmentation_process', progress.percent)
            })
            .on('error', (err, stdout, stderr) => {
                reject(err)
            })
            .on('end', () => {
                eventEmit.emit('segmentation_process', 100)
                resolve()
            })
            .run()
    })
}
global.call_ffmpeg = call_ffmpeg;
//Integrate with Shawn's code end

// all environments
app.set('port', process.env.PORT || 8081);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000
    }
}))



app.get('/', routes.index); //call for main index page
app.get('/signup', user.signup); //call for signup page
app.post('/signup', user.signup); //call for signup post 
app.get('/login', routes.index); //call for login page
app.post('/login', user.login); //call for login post
app.get('/home/dashboard', user.dashboard); //call for dashboard page after login
app.get('/home/logout', user.logout); //call for logout
app.get('/home/profile', user.profile); //to render users profile
app.get('/home/upload_video', user.uploadvideo); //to render upload_file.html
app.get('/home/vid_listing', user.vid_listing);
app.get('/home/my_video', user.myvideo); //to render my_video.html
app.get('/static/*', display_static_resoures); //static resources
app.post('/upload', async function(request, response) {
    let uploaded_file_path = await upload_process(request, response)
    await insert_vid(uploaded_file_path, request, response)
    await call_ffmpeg(uploaded_file_path);
});
//Middleware
// Second Integration Part of Shawn's code ( due to websocket )

let eventEmit = new events.EventEmitter()

let server = http.createServer(app)

let ws = new WebSocket.Server({
    server: server,
    path: '/test_api'
})

ws.on('connection', (socket) => {
    eventEmit.on('segmentation_process', percentage => {
        socket.send(percentage)
    })
})

// process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) {
        console.log('Cleaning up...');
        // console.log(typeof cleanup);
        cleanup([path.normalize(__dirname + './static/uploaded/*.mp4'),
            path.normalize(__dirname + './static/video/*.ts'),
            path.normalize(__dirname + './static/video/*.m3u8')
        ]);
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
    exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
    exit: true
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));

server.listen(8081, () => {
    console.log('http://localhost:8081')
})