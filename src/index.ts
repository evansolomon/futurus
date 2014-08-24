///<reference path="../declarations/node.d.ts"/>

import events = require('events')

export class Queue extends events.EventEmitter {
  private concurrency:number
  private worker:Worker
  private buffer:Job[]
  private inFlightCount:number

  constructor(concurrency:number, worker:Worker) {
    super()

    this.concurrency = concurrency
    this.worker = worker

    this.inFlightCount = 0
    this.buffer = []
  }

  push(data:any, callback?:Errback) : void {
    var job = new Job(data, callback)
    if (this.isReady()) {
      this.processJob(job)
    } else {
      this.bufferJob(job)
    }
  }

  isReady() : boolean{
    return (this.running() + this.length()) < this.concurrency
  }

  running() : number {
    return this.inFlightCount
  }

  length() : number {
    return this.buffer.length
  }

  private bufferJob(job:Job) : void {
    this.emit('buffer', job.data)
    this.buffer.push(job)
  }

  private processJob(job:Job) : void {
    this.emit('process', job)
    this.inFlightCount++

    // Make sure jobs do not block due to sync workers/errors
    setImmediate(() => {
      try {
        this.worker(job.data, (err) => {
          this.nextJob(job, err)
        })
      } catch (e) {
        this.nextJob(job, e)
      }
    })
  }

  private nextJob(job:Job, err?:Error) : void {
    this.inFlightCount--
    job.callback(err)

    if (this.length()) {
      return this.processJob(this.buffer.shift())
    }

    if (this.running() === this.concurrency - 1) {
      this.emit('ready')
    }

    if (this.running() === 0) {
      this.emit('drain')
    }
  }
}

export interface Worker {
  (data:any, callback:Errback): void
}

export interface Errback {
  (err?:Error): void
}

export class Job {
  public data:any
  public callback:Errback
  static noop = function () {}

  constructor(data:any, callback:Errback = Job.noop) {
    this.data = data
    this.callback = Job.onceify(callback)
  }

  static onceify(callback:Errback) : Errback {
    var called:boolean = false
    return function (err:Error) {
      if (called) {
        throw new Error('Already called')
      }

      called = true
      callback(err)
    }
  }
}
