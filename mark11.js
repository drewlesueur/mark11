var mark11_trim =  function (s) { // taken from http://jsperf.com/mega-trim-test
  var str = s.match(/\S+(?:\s+\S+)*/);
  return str ? str[0] : '';
} 

var mark11 = function (code) {
  var lines = code.split("\n")
  var lines_length = lines.length
  var lookup_table = {}
  for (var i = 0; i < lines_length; i++) {
    var line = lines[i]
    line = mark11_trim(line);
    var last_char = line.slice(-1)
    if (last_char == ":") {
      var key = line.slice(0, -1)
      lookup_table[key] = i
    }
  }

  var new_lines = []
  for (var i = 0; i < lines_length; i++) {
    var line = lines[i]
    line = mark11_trim(line);
    var words = line.split(" ")
    var words_length = words.length
    for (var j = 0; j < words_length; j++) {
      var word = words[j]
      if (word in lookup_table) {
        words[j] = lookup_table[word]
      }
    }
    new_lines.push(words)
  }

  return new_lines
  var new_lines_length = new_lines.length
  for (var i = 0; i < new_lines_length; i++) {
    var line = new_lines[i] 
    
  }
}


/*

age = 29

say_hi:
set a 1
print a
 

say_bye:
print goodbye
return

*/
