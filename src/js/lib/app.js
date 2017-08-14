console.log('starting app imports')
// const log = require('loglevel')
import * as log from 'loglevel'
import * as shellquote from 'shell-quote'
// let vs = require('fs')
// let path = require('path')

// Debugging
log.setLevel(0)

export class App {
    constructor() {
        // log.debug('Building application')

        try {
            log.info('loading')
            this.loadJSX()
        } catch (err) {
            log.error(err)
        }
    }
    loadJSX() {
        // log.debug('Loading JSX')
        let cs = new CSInterface()
        let extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/'
        cs.evalScript('$.openTimelineIOTools.evalFiles("' + extensionRoot + '")')
    }

    openFileInBrowser(url) {
        log.debug('Opening file url in system browser: ', url)
        if (window.cep) {
            window.cep.process.createProcess('/usr/bin/open', url)
        } else {
            window.open(url, '_blank')
        }
    }
    runPython(args, stdout, stderr) {
        let self = this
        console.log('starting runPython')
        return new Promise(function(resolve, reject) {
            console.log('inside runPython promise')
            let cs = new CSInterface()
            let os = cs.getOSInformation()
            let find_python
            if (os.indexOf('Windows') >= 0) {
                find_python = ['which', 'python']
            } else {
                find_python = ['where', 'python']
            }
            console.log('before shellquote', find_python)
            let find_python_str = shellquote.quote(find_python)
            console.log('after shellquote', find_python_str)
            let python_path = window.cep.process.createProcess(find_python_str)

            console.log('python_path: ', python_path)


        })
    }

}

