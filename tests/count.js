var start_time = Date.now()
console.log(start_time)

var sum = 0
for (var i = 0; i < 1000000; i++) {
  sum = sum + i
}

console.log("done here " + sum)

var end_time = Date.now()

var diff = end_time - start_time

console.log("the diff is " + diff)

