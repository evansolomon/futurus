var futurus = require('../')

var worker = function (data, callback) {
  setTimeout(callback, 100)
}

exports.readyState = function (test) {
  var queue = new futurus.Queue(2, worker)
  queue.push(1)
  test.ok(queue.isReady())

  queue.push(2)
  test.ok(! queue.isReady())
  test.equals(0, queue.length())
  test.equals(2, queue.running())

  queue.push(3)
  test.ok(! queue.isReady())
  test.equals(1, queue.length())
  test.equals(2, queue.running())

  queue.once('ready', function () {
    queue.once('drain', test.done)
  })
}
