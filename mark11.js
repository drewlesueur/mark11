// think about wrapping values
// think about passing in a container for what you want to return
// goto, call, and if with number, varname of number, and varname of closureish

var mark11_trim =  function (s) { // taken from http://jsperf.com/mega-trim-test
  var str = s.match(/\S+(?:\s+\S+)*/);
  return str ? str[0] : '';
} 

var mark11_globals = {
  line_index: 0,
  line_index_stack: [],
  scope: {},
  scope_stack: [],
  scope_type: "call", // the type it is, goto, or goto and return
  scope_type_stack: [],
  should_stop: false,
  ret: "yay!"
}

var mark11_new = function () {
  return JSON.parse(JSON.stringify(mark11_globals))
}

var mark11_set_drawing_area = function (m11, canvasEl) {
  var ctx = canvasEl.getContext("2d") 
  m11.ctx = ctx
  m11.canvas = canvasEl
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var mark11 = function (code, _globals) {
  var _globals = _globals || mark11_new();
  var lines = code.split(/\n|;/)
  var lines_length = lines.length
  var lookup_table = {}
  var newI = 0;
  for (var i = 0; i < lines_length; i++) {
    var line = lines[i]
    line = mark11_trim(line);
    if (line != "") {
      var last_char = line.slice(-1)
      if (last_char == ":") {
        var key = line.slice(0, -1)
        lookup_table[key] = newI
      }
      newI += 1
    }
  }

  var new_lines = []
  for (var i = 0; i < lines_length; i++) {
    var line = lines[i]
    line = mark11_trim(line);
    var last_char = line.slice(-1)
    if (last_char == ":") {
      new_lines.push([{type: "symbol", value: "return"}])
    } else if (line.length){
      var words = line.split(" ")
      var first_word = words[0]
      if (!mark11_commands[first_word]) {
        words.unshift("call")
      }
      var words_length = words.length
      for (var j = 0; j < words_length; j++) {
        var word = words[j]
        var lookup_value = lookup_table[word]
        if (lookup_value === 0 || lookup_value) {
          words[j] = {type: "number", value: lookup_table[word]}
        } else if (word.substr(0, 1) == ":") {
          words[j] = {type: "string", value: word.substr(1).replace(/_/g, " ") }
        } else if (isNumber(word)) {
          words[j] = {type: "number", value: word - 0}
        } else {
          // the first one really ins't a symbol it's a command
          words[j] = {type: "symbol", value: word}
        }

      }
      new_lines.push(words)
    }
  }
  new_lines.push([{type: "symbol", value:"return"}])
  console.log(lookup_table)
  console.log("new lines")
  console.log(new_lines)
  console.log(JSON.stringify(new_lines))

  _globals.line_index = (lookup_table["main"] + 1) || 0
  _globals.lines = new_lines
  while (true) {

    var line = new_lines[_globals.line_index]
    _globals.line = line
    mark11_eval_line(_globals, line) 

    if (_globals.should_stop) {
      break;
    }

    _globals.line_index += 1
  }
  console.log("all done!")
  return _globals.ret;
}

var mark11_is_string_token = function (obj) {
  return obj.type == "string"
}

var mark11_is_number_token = function (number){
  return number.type == "number"
}

var mark11_is_symbol_token = function (number){
  return number.type == "symbol"
}

// to box or not to box actual values

var mark11_eval_word = function (_globals, word) {
  if (word.type== "symbol") {
    var value = _globals.scope[word.value]
    if (value === 0 || value === false || value) {
      return value      
    } else {
      return word.value
    }
  } else {
    //return word // keep it boxed
    return word.value //keep it unboxed
  }
}

var mark11_eval_words = function (m11, words, start) {
  var start = start || 0
  var ret = [];
  for (var i = start; i < words.length; i++) {
    var word = words[i]
    var evaled = mark11_eval_word(m11, word)
    ret.push(evaled)
  }  
  return ret
}

var mark11_to_string_command = function (command){
  var ret = []
  for (var i = 0; i < command.length; i++) {
    var item = command[i]
    if (item.type == "number" || item.type == "symbol") {
      ret.push(item.value)
    } else {
      ret.push(":" + item.value.replace(/ /g, "_"))
    }
  }
  return ret.join(" ")
}

var mark11_null_value = {}

var mark11_commands = {
  add: function (m11, args) {
    args = mark11_eval_words(m11, args)
    var sum = 0;
    args.forEach(function (arg) {
      sum += arg
    })
    return sum
  }, 
  as: function (m11, args) {
    m11.scope[args[0].value] = m11.ret
    return m11.ret
  },
  say: function (_globals, args) {
    var arg = mark11_eval_word(_globals, args[0])
    console.log(arg)
    return arg
  },
  "debugger": function (m11, args) {
    debugger
  },
  rect: function (m11, args) {
    var ctx = m11.ctx
    args = mark11_eval_words(m11, args) 
    if (args[4]) {
      ctx.fillStyle = args[4]
    }
    ctx.fillRect(args[0], args[1], args[2], args[3]) 
  },
  hash: function (m11, args) {
    var ret = {}
    m11.scope[args[0]] = {}
    return ret
  },
  list: function (m11, args) {
    var ret = []
    m11.scope[args[0]] = []
    return ret
  },
  lget: function (m11, args) {
    var varname = args[0] 
    var fieldname = args[1] 
    var list = m11.scope[varname]
    if (!list) {
      return null
    } else {
      var ret = list[fieldname]
      return ret
    }
  },
  hget: function (m11, args) {
    var varname = args[0] 
    var fieldname = args[1] 
    var hash = m11.scope[varname]
    if (!hash) {
      //m11.ret = null
      return null
    } else {
      var ret = m11.scope[varname][fieldname]
      //m11.ret = ret
      return ret
    }
  },
  eq: function (m11, args) {
    var evaled = mark11_eval_words(m11, args);
    return (evaled[0] == evaled[1])
  },
  cat: function (m11, args) {
    var evaled = mark11_eval_words(m11, args);
    return evaled.join("")
  },
  cats: function (m11, args) {
    var evaled = mark11_eval_words(m11, args);
    return evaled.join(" ")
  },
  set: function (m11, args) {
    var varname = args[0].value //note the name is not dynamic. 
    var varvalue = mark11_eval_word(m11, args[1]) 
    m11.scope[varname] = varvalue 
    return varvalue
  },
  rpush: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1)
    var list = mark11_setup_var(m11, args, [])
    for (var i = 0; i < evaled.length; i ++) {
      list.push(evaled[i])
    }
    return list
  },
  lset: function (m11, args) {
    var varname = args[0] //note the name is not dynamic. 
    var fieldname = mark11_eval_word(args[1])
    var varvalue = mark11_eval_word(args[2]) 
    var list = m11.scope[varname]
    if (!list) {
      list = []
      m11.scope[varname] = list
    }
    list[fieldname] = varvalue
    return varvalue
  },
  hset: function (m11, args) {
    var varname = args[0] //note the name is not dynamic. 
    var fieldname = mark11_eval_word(args[1])
    var varvalue = mark11_eval_word(args[2]) 
    var hash = m11.scope[varname]
    if (!hash) {
      hash = {}
      m11.scope[varname] = hash
    }
    hash[fieldname] = varvalue
    return varvalue
  },
  call: function (_globals, args) {
    _globals.line_index_stack.push(_globals.line_index) 
    _globals.scope_stack.push(_globals.scope)
    _globals.scope_type_stack.push(_globals.scope_type)

    var where = mark11_eval_word(_globals, args[0])
    var args2 = mark11_eval_words(_globals, args, 1)

    _globals.line_index = where
    var scope = {}
    _globals.scope = scope
    _globals.scope_type = "call"
    scope.a = args2[0]
    scope.b = args2[1]
    scope.c = args2[2]
    scope.d = args2[3]
  },
  "goto": function (_globals, args) {
    var where = mark11_eval_word(_globals, args[0])
    _globals.line_index = mark11_eval_word(_globals, where)
  },
  "callnoscope": function (m11, args) {
    m11.line_index_stack.push(m11.line_index) 
    //m11.scope_stack.push(m11.scope)
    m11.scope_type_stack.push(m11.scope_type)
    var where = mark11_eval_word(m11, args[0])
    var args2 = mark11_eval_words(m11, args, 1)
    m11.line_index = where
    m11.scope_type = "callnoscope"
    scope.a = args2[0]
    scope.b = args2[1]
    scope.c = args2[2]
    scope.d = args2[3]
  },
  "return": function (_globals, args) {
    _globals.line_index = _globals.line_index_stack.pop()
    if (_globals.scope_type == "call") {
      _globals.scope = _globals.scope_stack.pop()
    }
    _globals.scope_type = _globals.scope_type_stack.pop()

    if (!_globals.scope) {
      _globals.should_stop = true;
    }
    return _globals.ret
  },
  "if": function (m11, args) {
    var condition = mark11_eval_word(m11, args[0])
    debugger
    if (condition) {
      m11.line_index_stack.push(m11.line_index) 
      m11.scope_type_stack.push(m11.scope_type)
      var where = mark11_eval_word(m11, args[1])
      m11.line_index = where
      m11.scope_type = "callnoscope"
    } else {
      m11.line_index_stack.push(m11.line_index) 
      m11.scope_type_stack.push(m11.scope_type)
      var where = mark11_eval_word(m11, args[2])
      m11.line_index = where
      m11.scope_type = "callnoscope"
    }
  }
}

var mark11_eval_line = function (_globals, line) {
  var command_id = line[0].value
  var args = line.slice(1)

  var command = mark11_commands[command_id];
  if (command) {
    var ret = command(_globals, args)
    _globals.ret = ret 
  } else {
    
  }
}

var mark11_setup_var = function (m11, args, default_) {
  var name = args[0].value // because it's a "symbol"
  var value = m11.scope[name]
  if (!value) {
    value = default_
    m11.scope[name] = value
  }
  return value
}

/*

say_hi:
set 1 a
print a
 

say_bye:
print goodbye
return

*/
