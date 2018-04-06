var cleanup = function(paths) {

    const path = require('path');
    const rimraf = require('rimraf');
    // console.log(paths);
    // console.log(__dirname + '/static/video/*.ts');
    var i = 0;
    for (i = 0; i < paths.length; i++) {
        console.log(paths[i]);
        rimraf(paths[i],
        function(e) {
            console.log(e)
        });
    }

}

module.exports = cleanup;