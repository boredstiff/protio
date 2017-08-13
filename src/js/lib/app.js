console.log('starting app imports')
// const log = require('loglevel')
import * as log from 'loglevel'
let vs = require('fs')
let path = require('path')

// Debugging
log.setLevel(0)

export class App {
    constructor() {
        // log.debug('Building application')

        try {
            log.info('loading')
            this.load_jsx()
        } catch (err) {
            log.error(err)
        }
    }
    load_jsx() {
        // log.debug('Loading JSX')
        let cs = new CSInterface()
        let extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/'
        cs.evalScript('$.openTimelineIOTools.evalFiles("' + extensionRoot + '")')
    }
}

