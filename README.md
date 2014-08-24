# Futurus

> About to be

A queue that exposes a lot of state about how its handling your tasks.

```js
var worker = function (data, callback) {
  setTimeout(function () {
    console.log(data)
  }, 100)
}
var queue = new futurus.Queue(2, worker)
queue.on('ready', function () {
  console.log('The queue has just become ready')
})
queue.on('drain', funciton () {
  console.log('The queue has no active jobs')
})

queue.push('hello')
console.log(queue.isReady())
// true

queue.push('world')
console.log(queue.isReady())
// false

queue.push('hello')
console.log(queue.isReady())
// false

// (Wait a few hundred milliseconds)
// 'The queue has just become ready'

// (Wait a few hundred milliseconds more)
// 'The queue has no active jobs'
```
