function segmentation_modal(){
    $('#uploaded_modal').modal({
        backdrop:'static'
    })
    let ws = new WebSocket('ws://localhost:8081/test_api')
    ws.onmessage = function(e){
        let progress_percentage = parseInt(e.data,10)
        if(isNaN(progress_percentage) === false){
            $('#segmentation_progress').width(`${progress_percentage}%`)

            if(progress_percentage === 100)
            {
                $("#my_video_link").removeClass('d-none')
            }
        }else{
            alert('The data from server is wrong, its value:',progress_percentage)
        }
    }
// only for debug
    ws.onclose = function(event){
        console.log('Was clean?',event.wasClean)
        console.log('Code=',event.code)
        console.log('Reason=',event.reason)
    }
}
let uploader = new plupload.Uploader({
    url : '/upload',
    // 一定要有browse_button哦
    browse_button : 'browse',
    drop_element:'drag-area',
    filters:{
        mime_types:[
            {title:"Video files",extensions:"mov,mp4,m4a"}
        ]
    }
})
uploader.init()
uploader.bind('FilesAdded',function(uploader,files){
    uploader.start()
})
uploader.bind('UploadProgress',function(uploader,file){
    $('#uploading_progress').css('width',`${file.percent}%`)
    if(file.percent === 100){
        segmentation_modal();
    }
})