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

        this.localConfigurationPath = path.resolve(this.extensionPath, '.protio')
        this.localConfiguration = this.getConfiguration(this.localConfigurationPath)
        this.userConfigurationPath = path.resolve(this.getHomeDir(), '.protio')
        this.userConfiguration = this.getConfiguration(this.userConfigurationPath)
        this.configuration = this.validateConfiguration(this.setUpConfiguration())

        this.terminal = this.configuration['terminal']
        // May need to set these up
        this.terminal_args = this.configuration['terminal_args']
        this.python_interpreter = this.configuration['python_interpreter']
        this.python_args = this.configuration['python_args']
    }

    /**
     *
     * @param configuration
     * @returns {*}
     */
    static validateConfiguration(configuration) {
        // Need to find a good schema validator, but all the ones on npm are shit. Just like everything on npm.
        let required_keys = ['terminal', 'terminal_args', 'python_interpreter', 'python_args']
        for (let i = 0; i < required_keys.length(); i++) {
            if (!(configuration.hasOwnProperty(required_keys[i]))) {
                throw new Error('Missing required key in configuration: ', required_keys[i])
            }
        }
        return configuration
    }

    /**
     * Determine which configuration to use. If the configuration exists locally inside of the extension, then that
     * one should have information. If a configuration is inside of the extension, then this is an extension that
     * has shipped with a Python interpreter with it. In that case, we usually do not need to have a user configuration.
     * However, if the user configuration does exist, it should override the one stored locally inside of the extension.
     * @returns {*}
     */
    setUpConfiguration() {
        let configuration = this.localConfiguration
        if (this.userConfiguration !== {})
            configuration = this.userConfiguration
        return configuration
    }

    getConfiguration(path) {
        if (path === null) {
            throw new Error('Unable to continue loading the configuration without a path.')
        }
        let data = {}

        if (this.doesConfigExist(path))
            data = JSON.parse(fs.readFileSync(path, 'utf8'))
        return data
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

    static normalizePath(path) {
        log.debug('Inside normalizePath before running the replace: ', path)
        path = path.replace(/[\\/]+/g, '/');
        log.debug('After running the replace: ', path)
        return path
    }

    static makeJSXPath(path) {
        log.debug('Inside makeJSXPath before running the replace: ', path)
        path = path.replace(/[\\/]+/g, '\\\\');
        log.debug('After running the replace: ', path)
        return path
    }

    static getHomeDir(username) {
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

    static loadJSX() {
        log.info('Loading JSX')
        let cs = new CSInterface()
        let extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + '/jsx/opentimeline.jsx'
        log.debug('extensionRoot: ', extensionRoot)
        cs.evalScript('$.OpenTimelineIOTools.evalFile("' + extensionRoot + '")')
    }

    static openFileInBrowser(url) {
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

