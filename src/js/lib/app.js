console.log('starting app imports')
// const log = require('loglevel')
import * as log from 'loglevel'
import * as shellquote from 'shell-quote'

import * as process from 'process'

let fs = require('fs')
let path = require('path')

// Debugging
log.setLevel(0)

/**
 * The main application class.
 */
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
        this.configuration = null

        this.whereExecutable = this.normalizePath('C:/Windows/System32/where.exe')
        log.info('this.whereExecutable: ', this.whereExecutable)

        this.cmdExecutable = 'C:/Windows/System32/cmd.exe'
        this.loadConfiguration()
    }

    /**
     * Perform a csInterface evalScript as a Promise.
     * @param {string} command - An Extendscript command to perform. 
     */
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

    makeJSXPath(path) {
        log.debug('Inside makeJSXPath before running the replace: ', path)
        path = path.replace(/[\\/]+/g, '\\\\');
        log.debug('After running the replace: ', path)
        return path
    }

    getHomeDir(username) {
        let home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
        return username ? path.resolve(path.dirname(home), username) : home
    }

    doesConfigExist(configPath) {
        try {
            fs.stat(configPath, function(err, stat) {
                if (err === 'ENOENT') {
                    return false
                } else {
                    return true
                }
            }.bind(this))
        } catch(err) {
            if (err.code === 'ENOENT') {
                return false
            }
        }
    }

    tempRemoveFile(configPath) {
        if (this.doesConfigExist(configPath)) {
            fs.unlink(configPath)
        }
    }

    readConfiguration(configPath) {
        return fs.readFileSync(configPath)
            .then(function(data) {
                console.log('data in readConfiguration: ', data)
            })
    }

    getDefaultConfigForOS() {
        let cs = new CSInterface()
        let osInfo = cs.getOSInformation()
        let user_shell
        console.log('osinfo: ', osInfo)
        if (osInfo.startsWith('Windows')) {
            console.log('starts with')
            try {
                let args = [this.cmdExecutable, 'where', 'bash']
                console.log('args: ', args)
                // ["C:/Windows/System32/where.exe", 'find']
                // Try to get bash first
                // let proc = window.cep.process.createProcess.apply(this, args)
                // let procID = proc.id
                return this.stream(args)
                    .then(function(data) {
                        console.log('data')
                    }.bind(this))

                console.log('proc: ', proc)
            } catch(err) {
                console.log('uh-oh')
            }
        }
    }

    writeConfiguration(configPath) {
        let defaultConfig = this.getDefaultConfigForOS()
        fs.writeFile(configPath, defaultConfig, 'utf8')
        return defaultConfig
    }

    loadConfiguration() {
        let home = this.getHomeDir()
        console.log('homeDir: ', home)
        let configPath = path.resolve(home, '.protio')
        // Temporary deletion upon initialization. I don't want the file to actually exist if it does.
        console.log('Should remove the file')
        this.tempRemoveFile(configPath)
        console.log('File should be gone')

        let fileExists, loadedConfiguration
        if (this.doesConfigExist(configPath)) {
            log.debug('Configuration file exists')
            this.configuration = this.readConfiguration(configPath)
        } else {
            log.debug('Configuration file does not exist')
            this.configuration = this.writeConfiguration(configPath)
        }
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
        let python, bash
        let cs = new CSInterface()
        let os = cs.getOSInformation()
        if (os.indexOf('Windows') >= 0) {
            bash = this.normalizePath('C:/Windows/System32/cmd.exe')
            python = this.normalizePath("C:/virtualenvs/otio/Scripts/python.exe")
        }

        let pythonArgs = [bash, python, '-u', this.pythonScriptPath].concat(args)

        return this.stream(pythonArgs, stdout, stderr)
    }

    stream(args, stdout, stderr) {
        console.log('starting runPython')

        function read(procID, stream, _array, callback) {
            console.log('reading...')
            let watch = true
            let data_function = function (data) {
                console.log('data inside data_function: ', data)
                if (data != null) {
                    let lines = data.split('\n').filter(function(n) { return n != ''})
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
                console.log('args: ', args)
                let proc = window.cep.process.createProcess.apply(this, args)
                let procID = proc.data
                console.log('procID: ', procID)
                let stdoutLines = []
                let stderrLines = []
                let stdoutWatch, stderrWatch

                if (stdout) {
                    console.log('stdout: going to read: ', stdout)
                    stdoutWatch = read(procID, 'stdout', stdoutLines, stdout)
                } else {
                    console.log('stdout inside of else: ', stdout)
                    window.cep.process.stdout(procID, function(line) { stdoutLines.push(line); console.log('stdOutLines: ', stdoutLines) })
                }

                if (stderr) {
                    console.log('stderr: going to read: ', stderr)
                    stderrWatch = read(procID, 'stderr', stderrLines, stderr)
                } else {
                    console.log('stderr inside of else: ', stderr)
                    window.cep.process.stderr(procID, function(line) { stderrLines.push(line); console.log('stdErrLines: ', stderrLines) })
                }

                function respond() {
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
                        resolve(data)
                    } else {
                        reject(data)
                    }
                }

                function waitForStuff() {
                    console.log('waiting')
                    if (!proc.data) {
                        setTimeout(waitForStuff, 1000)
                    } else {
                        respond()
                    }
                }
                window.cep.process.onquit(procID, waitForStuff)
            } else {
                console.log('else at end of runPython')
                resolve('', '')
            }
        }.bind(this))
    }

}

