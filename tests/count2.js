var start_time = Date.now()
console.log(start_time)

var sum = 0
i = 0
while (i < 1000000) {
sum = sum + i
i+= 1
}

console.log("done here " + sum)

var end_time = Date.now()

var diff = end_time - start_time

console.log("the diff is " + diff)

