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
        var seq = app.project.activeSequence;
        $.writeln('seq');
        if (seq !== null) {
            $.writeln('seq is not null, should export to ', path);
            // 1 says to suppress the UI
            seq.exportAsFinalCutProXML(path, 1);
        } else {
            alert('No active sequence');
        }
    },

    chooseOTIOExportLocation : function() {
        var myFile = new File('~/Desktop').saveDlg('Export OpenTimelineIO file');
        if (!myFile) {
            return;
        } else {
            return myFile.fsName;
        }
    },

    selectOTIOFileToImport : function() {
        var myFile = new File('~/Desktop').openDlg('Select OpenTimelineIO file to import')
        if (!myFile) {
            return;
        } else {
            return myFile.fsName;
        }
    }
};
