#include "json2.js";

if(typeof($) == 'undefined')
    $={};

$.OpenTimelineIOTools = {

    evalFile : function(path) {
        try {
            $.evalFile(path);
        } catch(err) {
            alert("Eval File Exception: " + err);
        }
    },

    evalFiles: function(jsxFolderPath) {
        var folder = new Folder(jsxFolderPath);
        if (folder.exists) {
            var jsxFiles = folder.getFiles("*.jsx");
            for (var i = 0; i < jsxFiles.length; i++) {
                var jsxFile = jsxFiles[i];
                this.evalFile(jsxFile);
            }
        }
    },

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
            // 1 says to suppress the UI
            seq.exportAsFinalCutProXML(path, 1);
        } else {
            alert('No active sequence');
        }
    },

    // importSequence : function(path) {
    //     $.writeln('Sequence to import: ' + path);
    //     if (path !== null) {
    //         $.writeln('Here we go');
    //         try {
    //             var result = app.project.importSequence(path);
    //             $.writeln(result);
    //         } catch(err) {alert('Error Importing: ' + err);}
    //     }
    // },

    importSequence : function(path) {
        // $.writeln('hello');
        $.writeln('path');
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
        var myFile = new File('~/Desktop').openDlg('Select OpenTimelineIO file to import');
        if (!myFile) {
            return;
        } else {
            return myFile.fsName;
        }
    },
};
