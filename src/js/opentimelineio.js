import * as log from 'loglevel'
import path from 'path'
import {App} from 'lib/app'

import * as process from 'process'

log.setLevel(0)

export class OpenTimelineIO {
    constructor(app) {
        log.info('starting to attach app')
        this.app = app
        log.info('Attached the app')
    }

    init() {
        log.info('init run')
        $('#export-btn').click(function() {
            this.exportOpenTimelineIO()
        }.bind(this))
    }

    getActiveSequence() {
        log.debug('Getting Active Sequence')
        return this.app.evalScript('app.project.activeSequence')
    }

    getActiveSequenceName() {
        log.debug('Getting Active Sequence Name')
        return this.app.evalScript('app.project.activeSequence.name')
    }

    exportActiveSequenceAsFCP7XML(path) {
        return this.app.evalScript('$.OpenTimelineIOTools.exportActiveSequenceAsFCP7XML("' + path + '")')
    }

    chooseExportLocation() {
        return this.app.evalScript('$.OpenTimelineIOTools.chooseOTIOExportLocation()')
    }

    importFile() {
        return this.app.evalScript('$.OpenTimelineIOTools.selectOTIOFile()')
    }

    getTempFolder() {
        let folderPath
        let isWindows = process.platform === 'win32'
        let trailingSlashRegex = isWindows ? /[^:]\\$/ : /.\/$/
        if (isWindows) {
            folderPath = process.env.TEMP || process.env.TMP || (process.env.SystemRoot || process.env.windir ) + '\\temp'
        } else {
            folderPath = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp'
        }
        if (trailingSlashRegex.test(folderPath)) {
            folderPath = folderPath.slice(0, -1)
        }
        return folderPath
    }

    generateTempPath() {
        let now = new Date()
        let folderPath = this.getTempFolder()
        let fileName = [now.getYear(), now.getMonth(), now.getDate(), '-', process.pid, '-', (Math.random() * 0x100000000 + 1).toString(36), '.xml'].join('')
        return path.join(folderPath, fileName)
    }

    exportOpenTimelineIO() {
        // Get the export location
        return this.chooseExportLocation()
            .then(function(data) {
                // 'data' coming in should be a full path selected by the user.
                // TODO: Some validation on this path in here.
                // Is it possible for the UI to hand back a folder path?
                // Need to also populate with '.otio' if it doesn't exist.
                let temp_path = this.generateTempPath()
                let jsx_temp_path = this.app.makeJSXPath(temp_path)
                // Then export final cut pro xml with the temp path
                return this.exportActiveSequenceAsFCP7XML(jsx_temp_path)
                    .then(function() {
                        console.log('Sequence should be exported, calling python')
                        // Then run conversion on the temp path file to the user-selected
                        // output path

                        let python_args = [
                            'export-file',
                            '--input',
                            this.app.normalizePath(temp_path),
                            '--output',
                            this.app.normalizePath(data)
                        ]

                        log.debug('Export Python arguments before calling: ', python_args)
                        return this.app.runPython(python_args)
                            .then(function(python_output) {
                                console.log('Python output: ', python_output)
                            })
                    }.bind(this))
            }.bind(this))
    }
}

$(document).ready(function() {
    console.log('document ready')
    let application = new App()
    window.view = new OpenTimelineIO(application)
    window.view.init()
})