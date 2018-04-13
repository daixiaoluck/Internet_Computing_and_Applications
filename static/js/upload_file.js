function segmentation_modal(){
    $('#uploaded_modal').modal({
        backdrop:'static'
    })
    let websocket = io.connect()
    let $segmentation_progress = $('#segmentation_progress')
    websocket.on('push_from_server',data=>{
        if($.isNumeric(data)){
            let progress_percentage = Math.round(data)
            $segmentation_progress.width(`${progress_percentage}%`)
            if(progress_percentage === 100){
                $("#my_video_link").removeClass('d-none')
            }
        }else{
            alert('The data from server is wrong, the data value is: ',data)
        }
    })
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
    },
    init:{
        FilesAdded:function(uploader,files){
            let $file_name = $('#file_name')
            $file_name.text(files[0].name)
            uploader.start()
        },

        UploadProgress: function(up, file) {
            if(file.percent === 100){
                segmentation_modal()
            }
        }
    }
})
uploader.init()