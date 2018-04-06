const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const util = require('util')
const events = require('events')

const template = require('art-template')
const formidable = require('formidable')
const WebSocket = require('ws')
const ffmpeg = require('fluent-ffmpeg')

function display_upload_file_html(request,response){
    return new Promise((resolve,reject)=>{
        let file_path = __dirname+'/views/upload_file.html'
        response.writeHead(200,{
            'Content-type':'text/html'
        })
        response.end(template(file_path,{title:'Upload File'}))
        resolve()
    })
}

function display_my_video_html(request,response){
    return new Promise((resolve,reject)=>{
        let file_path = __dirname+'/views/my_video.html'
        response.writeHead(200,{
            'Content-type':'text/html'
        })
        response.end(template(file_path,{title:'My Meme'}))
        resolve()
    })
}

function display_static_resoures(request,response){
    return new Promise((resolve,reject)=>{
        let pathname = url.parse(request.url,true).pathname
        let file_path = __dirname + pathname
        fs.readFile(file_path,(err,file_content)=>{
            if(err){
                reject(err)
                return
            }
            response.writeHead(200)
            response.end(file_content)
            resolve()
        })
    })
}

function upload_process(request,response){
    return new Promise((resolve,reject)=>{
        if(request.method.toLowerCase() !== 'post'){
            return
        }
        let form = new formidable.IncomingForm()
        form.uploadDir = __dirname+'/static/uploaded'
        form.maxFileSize = 50 * 1024 * 1024
        form.keepExtensions = true
        form.parse(request, function(err, fields, files) {
            if(err){
                reject(err)
            }else{
                let single_file = files.file
                resolve(single_file.path)
            }
        })
    })
}

function call_ffmpeg(file_path){
    let ffmpeg_instance = ffmpeg(file_path)
    return new Promise((resolve,reject)=>{
        ffmpeg_instance.addOptions([
            '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
            '-level 3.0',

            '-start_number 0',     // start the first .ts segment at index 0
            '-hls_time 10',        // 10 second segment duration
            '-hls_list_size 0',    // Maxmimum number of playlist entries (0 means all entries/infinite)
            '-f hls'               // HLS format
        ])
        .output('static/video/output.m3u8')
        .on('progress',progress=>{
            eventEmit.emit('segmentation_process', progress.percent)
        })
        .on('error',(err, stdout, stderr)=>{
            reject(err)
        })
        .on('end',()=>{
            eventEmit.emit('segmentation_process', 100)
            resolve()
        })
        .run()
    })
}

async function main(request,response){
    try{
        let pathname = url.parse(request.url,true).pathname
        if(pathname !== '/favicon.ico'){
            if(pathname === '/upload_file.html'){
                await display_upload_file_html(request,response)
            }
            else if(pathname === '/my_video.html'){
                await display_my_video_html(request,response)
            }
            else if(pathname.startsWith('/static')){
                await display_static_resoures(request,response)
            }
            else if(pathname === '/upload'){
                let uploaded_file_path = await upload_process(request,response)
                await call_ffmpeg(uploaded_file_path)
            }
            else{
                response.writeHead(404,{
                    'Content-type':'text/plain'
                })
                response.end('Please verify your input url.')
            }
        }
    }catch(err){
        response.writeHead(500,{
            'Content-type':'text/plain'
        })
        response.end('Server has got a problem: ',err)
        console.log(err)
    }
}

let server = http.createServer(main)

let eventEmit = new events.EventEmitter()

let ws = new WebSocket.Server({
    server:server,
    path:'/test_api'
})

ws.on('connection',(socket)=>{
    eventEmit.on('segmentation_process',percentage=>{
        socket.send(percentage)
    })
})

server.listen(8000,()=>{
    console.log('http://localhost:8000/upload_file.html')
})