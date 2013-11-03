var mark11_trim =  function (s) { // taken from http://jsperf.com/mega-trim-test
  var str = s.match(/\S+(?:\s+\S+)*/);
  return str ? str[0] : '';
} 

var mark11_globals = {
  line_index: 0,
  line_index_stack: [],
  scope: {},
  scope_stack: [],
  should_stop: false,
  ret: "yay!"
}

var mark11 = function (code, _globals) {
  var _globals = _globals || mark11_globals;
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
    var last_char = line.slice(-1)
    if (last_char == ":") {
      new_lines.push(["return"])
    } else if (line.length){
      var words = line.split(" ")
      var words_length = words.length
      var first_word = words[0]
      if (!mark11_commands[first_word]) {
        words.unshift("call")
      }
      for (var j = 0; j < words_length; j++) {
        var word = words[j]
        if (lookup_table[word]) {
          words[j] = lookup_table[word]
        }
      }
      new_lines.push(words)
    }
  }

  console.log("new lines")
  console.log(new_lines)
  console.log(JSON.stringify(new_lines))

  var new_lines_length = new_lines.length
  var main = lookup_table["main"] || 0
  while (true) {

    var line = new_lines[_globals.line_index]
    mark11_eval_line(_globals, line) 

    if (_globals.should_stop) {
      break;
    }
    console.log("all done!")
  }
  return _globals.ret;
}

var mark11_commands = {
  say: function (_globals, args) {
    console.log(args[0])
  },
  call: function (_globals, args) {
    _globals.line_index_stack.push(_globals.line_index) 
    _globals.scope_stack.push(_globals.scope)
    var where = args[0]
    _globals.line_index = where
    _globals.scope = {}
  },
  "goto": function (_globals, args) {
    var where = args[0]
    _globals.line_index = where
  },
  "return": function (_globals, args) {
    _globals.line_index = _globals.line_index_stack.pop()
    _globals.scope = _globals.scope_stack.pop()

    if (!_globals.scope) {
      _globals.should_stop = true;
    }
  },
  "if": function (_globals, args) {
    var a = _globals.scope[args[0]]
    var b = args[1]
    var c = args[2]
    if (args[0]) {
      _globals.line_index = b
    } else {
      _globals.line_index = c
    }
  }
}

var mark11_eval_line = function (_globals, line) {
  var command_id = line[0] 
  var args = line.slice(1)

  var command = mark11_commands[command_id];
  if (command) {
    command(_globals, args)
  } else {
    
  }
}

/*

say_hi:
set 1 a
print a
 

say_bye:
print goodbye
return

*/
