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

        var cs = new CSInterface()
        this.extensionPath = cs.getSystemPath(SystemPath.EXTENSION)
        // This one should already be normalized.
        this.pythonScriptPath = [this.extensionPath, 'python', 'premiere-opentimelineio.py'].join('/').replace('\\', '/')
    }

    evalScript(command) {
        log.debug('Evalscript command: ', command)
        return new Promise(function(resolve, reject) {
            var cs = new CSInterface()
            return cs.evalScript(command, resolve)
        })
    }

    normalizePath(path) {
        log.debug('Inside normalizePath before running the replace: ', path)
        path = path.replace(/[\\/]+/g, '/');
        log.debug('After running the replace: ', path)
        return path
    }

    loadJSX() {
        log.info('Loading JSX')
        let cs = new CSInterface()
        let extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/opentimeline.jsx'
        log.debug('extensionRoot: ', extensionRoot)
        cs.evalScript('$.OpenTimelineIOTools.evalFile("' + extensionRoot + '")')
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
        console.log('starting runPython')

        function read(procID, stream, _array, callback) {
            console.log('reading...')
            let watch = true
            let data_function = function (data) {
                if (data !== null) {
                    let lines = data.split('\n').filter(function(n) { return n !== ''})
                    console.log('pushing: ', lines)
                    console.log('array: ', _array)
                    _array.push.apply(_array, lines)
                    if (callback) { callback(lines) }
                }
                if (!watch) { return }
                window.cep.process[stream](procID, this.bind(this))
            }

            data_function.bind(data_function)()
            return { stop: function() { watch = false }}
        }

        return new Promise(function(resolve, reject) {
            if (window.cep) {
                console.log('inside runPython promise')
                let cs = new CSInterface()
                let os = cs.getOSInformation()
                let find_python, bash, python
                if (os.indexOf('Windows') >= 0) {
                    bash = this.normalizePath("C:/Users/alexw/.babun/cygwin/bin/bash.exe")
                    // cmd = "C:/Windows/System32/cmd.exe"
                    python = this.normalizePath("C:/virtualenvs/otio/Scripts/python.exe")
                }
                // let pyArgs = [python, '-u'].concat(args)
                let pyArgs = [python, '-u', this.pythonScriptPath].concat(args)
                let _args = shellquote.quote(pyArgs)
                console.log('Python command: ', _args)
                // let fullArgs = [bash, '-lc', 'ls']
                let fullArgs = [bash, '-lc'].concat(_args)
                console.log('Full command: ', fullArgs)
                let proc = window.cep.process.createProcess.apply(this, fullArgs)
                let procID = proc.data
                console.log('procID: ', procID)
                let stdoutLines = []
                let stderrLines = []
                let stdoutWatch, stderrWatch

                if (stdout) {
                    console.log('stdout: going to read: ', stdout)
                    stdoutWatch = read(procID, 'stdout', stdoutLines, stdout)
                } else {
                    console.log(stdout)
                    console.log('else on stdout')
                    window.cep.process.stdout(procID, function(line) { stdoutLines.push(line); console.log('stdOutLines: ', stdoutLines) })
                }

                if (stderr) {
                    console.log('stderr: going to read: ', stderr)
                    stderrWatch = read(procID, 'stderr', stderrLines, stderr)
                } else {
                    console.log('else on stderr')
                    window.cep.process.stderr(procID, function(line) { stderrLines.push(line) })
                }

                function wait() {
                    console.log('waiting')
                    if (!proc.data) {
                        setTimeout(wait, 100)
                    } else {
                        console.log('inside else of wait')
                        let data = {
                            proc: proc,
                            stdout: stdoutLines.join('\n'),
                            stderr: stderrLines.join('\n')
                        }
                        if (stdoutWatch) { console.log('stdoutWatchStop'); stdoutWatch.stop() }
                        if (stderrWatch) { console.log('stderrWatchStop'); stderrWatch.stop() }
                        console.log('proc.err ', proc.err)
                        if (proc.err === 0) {
                            console.log('should be resolving')
                            console.log(resolve)
                            console.log('data: ', data)
                            resolve(data)
                        } else {
                            console.log('rejecting')
                            reject(data)
                        }
                    }
                }
                window.cep.process.onquit(procID, wait)
            } else {
                console.log('else at end of runPython')
                resolve('', '')
            }
        }.bind(this))
    }

}

