var events = require('events')
var util = require('util')

module.exports = Futurus

function Futurus(concurrency, worker) {
  events.EventEmitter.call(this)

  this.setConcurrency(concurrency)
  this._worker = worker

  this._buffer = []
  this._inFlightCount = 0
}
util.inherits(Futurus, events.EventEmitter)

Futurus.prototype.push = function (data, callback) {
  this.emit('push', data)

  var job = new Job(data, callback)
  if (this.isReady()) {
    this._processJob(job)
  } else {
    this._bufferJob(job)
  }
}

Futurus.prototype.isReady = function () {
  return (this.running() + this.length()) < this._concurrency
}

Futurus.prototype.setConcurrency = function (concurrency) {
  this._concurrency = concurrency
}

Futurus.prototype.running = function () {
  return this._inFlightCount
}

Futurus.prototype.length = function () {
  return this._buffer.length
}

Futurus.prototype._bufferJob = function (job) {
  this.emit('buffer', job.data)
  this._buffer.push(job)
}

Futurus.prototype._processJob = function (job) {
  this.emit('process', job.data)

  this._inFlightCount++
  try {
    this._worker(job.data, this._finishJob.bind(this, job))
  } catch (e) {
    this._inFlightCount--
    job.callback(e)
  }
}

Futurus.prototype._finishJob = function (job, err) {
  this._inFlightCount--

  job.callback(err)

  var next = this._buffer.shift()
  if (next) {
    this._processJob(next)
  } else {
    this.emit('ready')
    if (this.running() === 0) {
      this.emit('drain')
    }
  }
}


function Job(data, callback) {
  this.data = data
  this.callback = callback || Job.noop
}

Job.noop = function () {}
