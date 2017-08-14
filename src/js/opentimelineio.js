import * as log from 'loglevel'
import path from 'path'
import {App} from 'lib/app'

import * as process from 'process'

log.setLevel(0)

export class OpenTimelineIO {
    constructor(app) {
        log.info('starting to attach app')
        this.app = new App()
        log.info('Attached the app')
    }

    init() {
        log.info('init run')
        $('#export-btn').click(function() {
            log.info('Hello button press')
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

    exportActiveSequenceAsFCP7XML() {
        return this.app.evalScript('$.OpenTimelineIOTools.exportActiveSequenceAsFCP7XML')
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
        log.info(now)
        let folderPath = this.getTempFolder()
        log.info(folderPath)
        let fileName = [now.getYear(), now.getMonth(), now.getDate(), '-', process.pid, '-', (Math.random() * 0x100000000 + 1).toString(36), '.xml'].join('')
        log.info(fileName)
        let finalName = path.join(folderPath, fileName)
        log.info(finalName)
        return finalName
    }

    exportOpenTimelineIO() {
        // Get the export location
        return new Promise(function(resolve, reject) {
            console.log('started promise')
            let tempPath = this.generateTempPath()
            console.log('tempPath inside exportOpenTimelineIO', tempPath)
            return this.app.runPython()
                .then(function() {
                    console.log('inside function after calling runPython')
                }.bind(this))
        }.bind(this))
    }
}

$(document).ready(function() {
    console.log('document ready')
    window.view = new OpenTimelineIO()
    window.view.init()
})