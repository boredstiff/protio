if(typeof($) === 'undefined')
    $ = {};

$.OpenTimelineIOTools = {

    exportActiveSequenceAsFCP7XML : function(path) {

        /**
         * Export the active sequence as a Final Cut Pro XML.
         * IMPORTANT: Has to be a local path, cannot be a server path.
         * You can move the file afterward, but Premiere will not export
         * this file to a server path.
         */
        let seq = app.project.activeSequence
        if (seq !== null) {
            // 1 says to suppress the UI
            seq.exportAsFinalCutProXML(path, 1)
        } else {
            alert('No active sequence')
        }
    },
};
