import * as log from 'loglevel'

import {App} from 'lib/app'

log.setLevel(0)

export class OpenTimelineIO {
    constructor(app) {
        console.log('starting to attach app')
        this.app = new App()
        console.log('attached the app')
        // log.info('Attached the app')
    }
}
