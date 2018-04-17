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

let $file_name = $('#file_name')
let $uploading_progress = $('#uploading_progress')
let $body = $('body')

let uploader = new plupload.Uploader({
    url : '/upload',
    // 一定要有browse_button哦
    browse_button : 'browse',
    multi_selection:false,
    drop_element:'drag-area',
    filters:{
        max_file_size:`${50*1024}kb`,
        mime_types:[
            {title:"Video files",extensions:"mp4,mov"}
        ]
    },
    init:{
        FilesAdded:function(uploader,files){
            let max_files = 1
            if(uploader.files.length > max_files){
                plupload.each(files,function(file){
                    uploader.removeFile(file)
                })
                alert(`You are allowed to add only ${max_files} files.`)
                return false
            }
            $file_name.text(files[0].name)
            uploader.start()
        },

        UploadProgress: function(up, file){
            // console.log('The percentage information: ', file.percent)
            $uploading_progress.width(`${file.percent}%`)
        },

        UploadComplete: function(up, files){
            segmentation_modal()
        },

        Error: function(up, err) {
            let errorMsg = err.message
            if(err.code === plupload.FILE_SIZE_ERROR){
                errorMsg = `The file size of "${err.file.name}" is not allowed.`
            }else if(err.code === plupload.FILE_EXTENSION_ERROR){
                errorMsg = `The file extension of "${err.file.name}" is not allowed.`
            }
            let originalString =
                `<div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>${errorMsg}</strong>
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>`
            $body.prepend(originalString)
        }
    }
})
uploader.init()