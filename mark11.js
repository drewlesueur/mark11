// think about wrapping values
// think about passing in a container for what you want to return
// goto, call, and if with number, varname of number, and varname of closureish
// need to have default lib written in m11 itself. (m11 is just a temporary name now I think)

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

var mark11_remove_commas = function (n) {
  var n2 = n.replace(/,/g, "")
  return n2
}
function isNumber(n) {
  var n2 = mark11_remove_commas(n)
  return !isNaN(parseFloat(n2)) && isFinite(n2);
}

var mark11_add_built_in_libraries = function (code) {
 code = code + "\n"
  + "loop:\n"
  + "set i a\n"
  + "set max b\n"
  + "set fn c\n"
  + "add max -1; as max\n"
  + "goto loop_internal\n"
  + "\n"
  + "loop_internal:\n"
  + "  callnoscope fn i\n"
  + "\n"
  + "  eq i max; as is_done\n"
  + "  if is_done loop_done loop_not_done\n"
  + "\n"
  + "loop_done:\n"
  + "\n"
  + "loop_not_done:\n"
  + "  add i 1; as i\n"
  + "  goto loop_internal\n"
 return code
}

var mark11 = function (code, m11) {
  var m11 = m11 || mark11_new();
  var code = mark11_add_built_in_libraries(code)
  var lines = code.split(/\n|;/)
  var lines_length = lines.length
  var lookup_table = {}
  m11.lookup_table = lookup_table
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
      //new_lines.push([{type: "symbol", value: "return"}])
      new_lines.push([mark11_commands["return"]])
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
          var word = mark11_remove_commas(word)
          words[j] = {type: "number", value: word - 0}
        } else {
          // the first one really ins't a symbol it's a command
          words[j] = {type: "symbol", value: word}
        }

      }
      words[0] = mark11_commands[words[0].value] // yo
      new_lines.push(words)
    }
  }
  //new_lines.push([{type: "symbol", value:"return"}])
  new_lines.push([mark11_commands["return"]])
  //console.log(lookup_table)
  //console.log("new lines")
  //console.log(new_lines)
  //console.log(JSON.stringify(new_lines))

  m11.line_index = (lookup_table["main"] + 1) || 0
  m11.lines = new_lines
  while (true) {

    var line = new_lines[m11.line_index]
    m11.line = line
    mark11_eval_line(m11, line) 

    if (m11.should_stop) {
      break;
    }

    m11.line_index += 1
  }
  //console.log("all done!")
  return m11.ret;
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

var mark11_eval_word = function (m11, word) {
  if (word.type== "symbol") {
    var value = m11.scope[word.value]
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
    args = mark11_eval_words(m11, args, 1)
    var sum = 0;
    args.forEach(function (arg) {
      sum += arg
    })
    return sum
  }, 
  subtr: function (m11, args) {
    args = mark11_eval_words(m11, args, 1)
    return args[0] - args[1]
  },
  as: function (m11, args) {
    m11.scope[args[1].value] = m11.ret
    return m11.ret
  },
  say: function (m11, args) {
    var arg = mark11_eval_word(m11, args[1])
    console.log(arg)
    return arg
  },
  log: function (m11, args) {
    mark11_commands.say(m11, args)
  },
  alert: function (m11, args) {
    var arg = mark11_eval_word(m11, args[1])
    alert(arg)
    return arg
  },
  "debugger": function (m11, args) {
    debugger
  },
  rect: function (m11, args) {
    var ctx = m11.ctx
    args = mark11_eval_words(m11, args, 1) 
    if (args[4]) {
      ctx.fillStyle = args[4]
    }
    ctx.fillRect(args[0], args[1], args[2], args[3]) 
  },
  square: function (m11, args) {
    var ctx = m11.ctx
    args = mark11_eval_words(m11, args, 1) 
    if (args[3]) {
      ctx.fillStyle = args[3]
    }
    ctx.fillRect(args[0], args[1], args[2], args[2]) 
  },
  circle: function (m11, args) {
    var ctx = m11.ctx
    args = mark11_eval_words(m11, args, 1) 
    if (args[3]) {
      ctx.fillStyle = args[3]
    }
    ctx.beginPath();
    var x = args[0]
    var y = args[1]
    var r = args[2]
    ctx.arc(x, y, r, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.fill();

  },
  hash: function (m11, args) {
    var ret = {}
    m11.scope[args[1]] = {}
    return ret
  },
  list: function (m11, args) {
    var ret = []
    var evaled = mark11_eval_words(m11, args, 2)
    m11.scope[args[1].value] = evaled
    return ret
  },
  lget: function (m11, args) {
    var varname = args[1] 
    var fieldname = args[2] 
    var list = m11.scope[varname]
    if (!list) {
      return null
    } else {
      var ret = list[fieldname]
      return ret
    }
  },
  hget: function (m11, args) {
    var varname = args[1] 
    var fieldname = args[2] 
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
    var evaled = mark11_eval_words(m11, args, 1);
    return (evaled[0] == evaled[1])
  },
  lt: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return (evaled[0] < evaled[1])
  },
  lte: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return (evaled[0] <= evaled[1])
  },
  gte: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return (evaled[0] >= evaled[1])
  },
  gt: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return (evaled[0] > evaled[1])
  },
  cat: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return evaled.join("")
  },
  cats: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 1);
    return evaled.join(" ")
  },
  set: function (m11, args) {
    var varname = args[1].value //note the name is not dynamic. 
    var varvalue = mark11_eval_word(m11, args[2]) 
    m11.scope[varname] = varvalue 
    return varvalue
  },
  rpush: function (m11, args) {
    var evaled = mark11_eval_words(m11, args, 2)
    var list = mark11_setup_var(m11, args, [])
    for (var i = 0; i < evaled.length; i ++) {
      list.push(evaled[i])
    }
    return list
  },
  lset: function (m11, args) {
    var varname = args[1] //note the name is not dynamic. 
    var fieldname = mark11_eval_word(args[2])
    var varvalue = mark11_eval_word(args[3]) 
    var list = m11.scope[varname]
    if (!list) {
      list = []
      m11.scope[varname] = list
    }
    list[fieldname] = varvalue
    return varvalue
  },
  hset: function (m11, args) {
    var varname = args[1] //note the name is not dynamic. 
    var fieldname = mark11_eval_word(args[2])
    var varvalue = mark11_eval_word(args[3]) 
    var hash = m11.scope[varname]
    if (!hash) {
      hash = {}
      m11.scope[varname] = hash
    }
    hash[fieldname] = varvalue
    return varvalue
  },
  call: function (m11, args) {
    m11.line_index_stack.push(m11.line_index) 
    m11.scope_stack.push(m11.scope)
    m11.scope_type_stack.push(m11.scope_type)

    var where = mark11_eval_word(m11, args[1])
    var args2 = mark11_eval_words(m11, args, 2)

    m11.line_index = where
    var scope = {}
    m11.scope = scope
    m11.scope_type = "call"
    scope.a = args2[0]
    scope.b = args2[1]
    scope.c = args2[2]
    scope.d = args2[3]
  },
  "goto": function (m11, args) {
    var where = mark11_eval_word(m11, args[1])
    m11.line_index = where
  },
  "callnoscope": function (m11, args) {
    m11.line_index_stack.push(m11.line_index) 
    //m11.scope_stack.push(m11.scope)
    m11.scope_type_stack.push(m11.scope_type)
    var where = mark11_eval_word(m11, args[1])
    var args2 = mark11_eval_words(m11, args, 2)
    m11.line_index = where
    m11.scope_type = "callnoscope"
    m11.scope.a = args2[0]
    m11.scope.b = args2[1]
    m11.scope.c = args2[2]
    m11.scope.d = args2[3]
  },
  "return": function (m11, args) {
    m11.line_index = m11.line_index_stack.pop()
    if (m11.scope_type == "call") {
      m11.scope = m11.scope_stack.pop()
    }
    m11.scope_type = m11.scope_type_stack.pop()

    if (!m11.scope) {
      m11.should_stop = true;
    }
    return m11.ret
  },
  "if": function (m11, args) {
    var condition = mark11_eval_word(m11, args[1])
    if (condition) {
      m11.line_index_stack.push(m11.line_index) 
      m11.scope_type_stack.push(m11.scope_type)
      var where = mark11_eval_word(m11, args[2])
      m11.line_index = where
      m11.scope_type = "callnoscope"
    } else {
      m11.line_index_stack.push(m11.line_index) 
      m11.scope_type_stack.push(m11.scope_type)
      var where = mark11_eval_word(m11, args[3])
      m11.line_index = where
      m11.scope_type = "callnoscope"
    }
  },
  now: function () {
    return Date.now() 
  }
}
mark11_commands.log = mark11_commands.say
mark11_commands.boom = mark11_commands.callnoscope // boomerang

var mark11_eval_line = function (m11, line) {
  //var args = line.slice(1) // todo: maybe optimize this so you can just pass the whole args

  var command = line[0]
  var ret = command(m11, line)
  m11.ret = ret 
  if (m11.scope) {
    m11.scope.it = ret
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


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = mark11;
  }
  exports.mark11 = mark11;
} else {
  this.mark11 = mark11;
}

/*

say_hi:
set 1 a
print a
 

say_bye:
print goodbye
return

*/
