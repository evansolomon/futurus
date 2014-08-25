var futurus = require('../')

exports.throwOnMultipleCalls = function (test) {
  var job = new futurus.Job({}, function () {})

  test.doesNotThrow(job.callback)
  test.throws(job.callback)

  test.done()
}
