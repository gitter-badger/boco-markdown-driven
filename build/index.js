// Generated by CoffeeScript 1.10.0
var configure,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

configure = function($) {
  var AssertionNode, BeforeEachNode, CLI, Compiler, ContextNode, Converter, FileNode, Generator, InvalidHeadingDepth, MarkdownDriven, Node, NotImplemented, ParseTree, Parser;
  if ($ == null) {
    $ = {};
  }
  if ($.require == null) {
    $.require = require;
  }
  if ($.Path == null) {
    $.Path = $.require("path");
  }
  if ($.Marked == null) {
    $.Marked = $.require("marked");
  }
  if ($.Async == null) {
    $.Async = $.require("async");
  }
  if ($.FileSystem == null) {
    $.FileSystem = $.require("fs");
  }
  if ($.Minimist == null) {
    $.Minimist = $.require("minimist");
  }
  if ($.Glob == null) {
    $.Glob = $.require("glob");
  }
  if ($["package"] == null) {
    $["package"] = $.require("../package.json");
  }
  if ($.process == null) {
    $.process = process;
  }
  if ($.lexer == null) {
    $.lexer = new $.Marked.Lexer;
  }
  if ($.assertionCodePattern == null) {
    $.assertionCodePattern = /\b(assert|expect|should)\b/i;
  }
  if ($.fileCodePattern == null) {
    $.fileCodePattern = /^.* file: "([^"]*)"/;
  }
  if ($.writeExt == null) {
    $.writeExt = ".mdd";
  }
  if ($.cwd == null) {
    $.cwd = $.process.cwd();
  }
  if ($.argv == null) {
    $.argv = $.process.argv;
  }
  if ($.stdin == null) {
    $.stdin = $.process.stdin;
  }
  if ($.stdout == null) {
    $.stdout = $.process.stdout;
  }
  if ($.readDir == null) {
    $.readDir = "docs";
  }
  if ($.writeDir == null) {
    $.writeDir = "spec";
  }
  ParseTree = (function() {
    ParseTree.prototype.contextNodes = null;

    ParseTree.prototype.depth = null;

    function ParseTree(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.depth == null) {
        this.depth = 0;
      }
      if (this.contextNodes == null) {
        this.contextNodes = [];
      }
    }

    ParseTree.prototype.addContextNode = function(props) {
      var node;
      node = new ContextNode(props);
      node.parent = this;
      this.contextNodes.push(node);
      return node;
    };

    ParseTree.prototype.getContextNodes = function() {
      return this.contextNodes;
    };

    return ParseTree;

  })();
  Node = (function() {
    Node.prototype.type = null;

    function Node(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      Object.defineProperty(this, "parent", {
        value: null,
        enumerable: false,
        writable: true
      });
      Object.defineProperty(this, "ancestors", {
        enumerable: false,
        get: function() {
          var node, results;
          node = this;
          results = [];
          while (node.parent != null) {
            results.push(node = node.parent);
          }
          return results;
        }
      });
      Object.defineProperty(this, "depth", {
        enumerable: true,
        get: function() {
          if (this.parent != null) {
            return this.parent.depth + 1;
          } else {
            return 0;
          }
        }
      });
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.type == null) {
        this.type = this.constructor.name;
      }
    }

    return Node;

  })();
  ContextNode = (function(superClass) {
    extend(ContextNode, superClass);

    ContextNode.prototype.text = null;

    ContextNode.prototype.children = null;

    function ContextNode(props) {
      ContextNode.__super__.constructor.call(this, props);
      if (this.children == null) {
        this.children = [];
      }
    }

    ContextNode.prototype.addChild = function(node) {
      node.parent = this;
      this.children.push(node);
      return node;
    };

    ContextNode.prototype.getChildrenByType = function(type) {
      return this.children.filter(function(child) {
        return child.type === type;
      });
    };

    ContextNode.prototype.addContextNode = function(props) {
      return this.addChild(new ContextNode(props));
    };

    ContextNode.prototype.addBeforeEachNode = function(props) {
      return this.addChild(new BeforeEachNode(props));
    };

    ContextNode.prototype.addFileNode = function(props) {
      return this.addChild(new FileNode(props));
    };

    ContextNode.prototype.addAssertionNode = function(props) {
      return this.addChild(new AssertionNode(props));
    };

    ContextNode.prototype.getContextNodes = function() {
      return this.getChildrenByType("ContextNode");
    };

    ContextNode.prototype.getFileNodes = function() {
      return this.getChildrenByType("FileNode");
    };

    ContextNode.prototype.getAssertionNodes = function() {
      return this.getChildrenByType("AssertionNode");
    };

    ContextNode.prototype.getBeforeEachNodes = function() {
      return this.getChildrenByType("BeforeEachNode");
    };

    ContextNode.prototype.getAncestorContexts = function() {
      return this.ancestors.filter(function(arg) {
        var type;
        type = arg.type;
        return type === "ContextNode";
      });
    };

    ContextNode.prototype.getParentContext = function() {
      return this.getAncestorContexts[0];
    };

    return ContextNode;

  })(Node);
  BeforeEachNode = (function(superClass) {
    extend(BeforeEachNode, superClass);

    function BeforeEachNode() {
      return BeforeEachNode.__super__.constructor.apply(this, arguments);
    }

    BeforeEachNode.prototype.code = null;

    return BeforeEachNode;

  })(Node);
  FileNode = (function(superClass) {
    extend(FileNode, superClass);

    function FileNode() {
      return FileNode.__super__.constructor.apply(this, arguments);
    }

    FileNode.prototype.path = null;

    FileNode.prototype.data = null;

    return FileNode;

  })(Node);
  AssertionNode = (function(superClass) {
    extend(AssertionNode, superClass);

    function AssertionNode() {
      return AssertionNode.__super__.constructor.apply(this, arguments);
    }

    AssertionNode.prototype.text = null;

    AssertionNode.prototype.code = null;

    return AssertionNode;

  })(Node);
  InvalidHeadingDepth = (function(superClass) {
    extend(InvalidHeadingDepth, superClass);

    InvalidHeadingDepth.prototype.headingToken = null;

    function InvalidHeadingDepth(props) {
      if (props == null) {
        props = {};
      }
      Error.captureStackTrace(this, this.constructor);
      this.headingToken = props.headingToken;
      this.name = this.constructor.name;
      this.message = this.getMessage();
    }

    InvalidHeadingDepth.prototype.getMessage = function() {
      return "Invalid depth (" + this.headingToken.depth + ") for heading '" + this.headingToken.text + "'.";
    };

    return InvalidHeadingDepth;

  })(Error);
  NotImplemented = (function(superClass) {
    extend(NotImplemented, superClass);

    function NotImplemented(message) {
      if (message == null) {
        message = "not implemented";
      }
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.message = message;
    }

    return NotImplemented;

  })(Error);
  Parser = (function() {
    Parser.prototype.nativeLanguages = null;

    Parser.prototype.assertionCodePattern = null;

    Parser.prototype.fileCodePattern = null;

    function Parser(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.nativeLanguages == null) {
        this.nativeLanguages = [];
      }
      if (this.assertionCodePattern == null) {
        this.assertionCodePattern = $.assertionCodePattern;
      }
      if (this.fileCodePattern == null) {
        this.fileCodePattern = $.fileCodePattern;
      }
    }

    Parser.prototype.isNativeCode = function(code, lang) {
      return (lang == null) || indexOf.call(this.nativeLanguages, lang) >= 0;
    };

    Parser.prototype.isAssertionCode = function(code, lang) {
      if (!this.isNativeCode(code, lang) || this.isFileCode(code, lang)) {
        return false;
      }
      return this.assertionCodePattern.test(code);
    };

    Parser.prototype.isBeforeEachCode = function(code, lang) {
      return this.isNativeCode(code, lang) && !this.isFileCode(code, lang) && !this.isAssertionCode(code, lang);
    };

    Parser.prototype.isFileCode = function(code, lang) {
      return this.fileCodePattern.test(code);
    };

    Parser.prototype.getFilePath = function(code) {
      return this.fileCodePattern.exec(code)[1];
    };

    Parser.prototype.getFileData = function(code) {
      return code.slice(code.indexOf("\n") + 1) + "\n";
    };

    Parser.prototype.isAssertionNext = function(tokens) {
      var lang, ref, text, type;
      if (!(tokens.length > 1)) {
        return false;
      }
      ref = tokens[1], type = ref.type, text = ref.text, lang = ref.lang;
      return tokens[0].type === "paragraph" && type === "code" && this.isAssertionCode(text, lang);
    };

    Parser.prototype.consumeNextAssertion = function(contextNode, tokens) {
      var code, para, ref;
      ref = tokens.splice(0, 2), para = ref[0], code = ref[1];
      return contextNode.addAssertionNode({
        text: para.text,
        code: code.text
      });
    };

    Parser.prototype.isFileNext = function(tokens) {
      var lang, ref, text, type;
      if (!tokens.length) {
        return false;
      }
      ref = tokens[0], type = ref.type, text = ref.text, lang = ref.lang;
      return type === "code" && this.isFileCode(text, lang);
    };

    Parser.prototype.consumeNextFile = function(contextNode, tokens) {
      var data, path, text;
      text = tokens.shift().text;
      path = this.getFilePath(text);
      data = this.getFileData(text);
      return contextNode.addFileNode({
        path: path,
        data: data
      });
    };

    Parser.prototype.isBeforeEachNext = function(tokens) {
      var lang, ref, text, type;
      if (!tokens.length) {
        return false;
      }
      ref = tokens[0], type = ref.type, text = ref.text, lang = ref.lang;
      return type === "code" && this.isBeforeEachCode(text, lang);
    };

    Parser.prototype.consumeNextBeforeEach = function(contextNode, tokens) {
      var text;
      text = tokens.shift().text;
      return contextNode.addBeforeEachNode({
        code: text
      });
    };

    Parser.prototype.getParentNodeForHeading = function(headingToken, parseTree, previousContextNode) {
      var depthDiff, previousNode;
      previousNode = previousContextNode || parseTree;
      depthDiff = previousNode.depth - headingToken.depth;
      if (depthDiff === -1) {
        return previousNode;
      }
      if (depthDiff >= 0) {
        return previousNode.ancestors[depthDiff];
      }
      throw new InvalidHeadingDepth({
        headingToken: headingToken
      });
    };

    Parser.prototype.parseContextChildTokens = function(contextNode, tokens) {
      if (!tokens.length) {
        return contextNode;
      }
      switch (false) {
        case !this.isAssertionNext(tokens):
          this.consumeNextAssertion(contextNode, tokens);
          break;
        case !this.isFileNext(tokens):
          this.consumeNextFile(contextNode, tokens);
          break;
        case !this.isBeforeEachNext(tokens):
          this.consumeNextBeforeEach(contextNode, tokens);
          break;
        default:
          tokens.shift();
      }
      return this.parseContextChildTokens(contextNode, tokens);
    };

    Parser.prototype.parse = function(tokens, parseTree, previousContextNode) {
      var childTokens, contextNode, headingToken, parentNode;
      if (parseTree == null) {
        parseTree = new ParseTree;
      }
      headingToken = tokens.find(function(arg) {
        var type;
        type = arg.type;
        return type === "heading";
      });
      if (headingToken == null) {
        return parseTree;
      }
      parentNode = this.getParentNodeForHeading(headingToken, parseTree, previousContextNode);
      contextNode = parentNode.addContextNode({
        text: headingToken.text
      });
      tokens = tokens.slice(tokens.indexOf(headingToken) + 1);
      childTokens = (function() {
        var results;
        results = [];
        while (tokens.length && tokens[0].type !== "heading") {
          results.push(tokens.shift());
        }
        return results;
      })();
      this.parseContextChildTokens(contextNode, childTokens);
      return this.parse(tokens, parseTree, contextNode);
    };

    return Parser;

  })();
  Generator = (function() {
    function Generator() {}

    Generator.prototype.generate = function(parseTree) {
      throw new NotImplemented();
    };

    return Generator;

  })();
  Compiler = (function() {
    Compiler.prototype.lexer = null;

    Compiler.prototype.parser = null;

    Compiler.prototype.generator = null;

    function Compiler(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.lexer == null) {
        this.lexer = $.lexer;
      }
      if (this.parser == null) {
        this.parser = new Parser;
      }
      if (this.generator == null) {
        this.generator = new Generator;
      }
    }

    Compiler.prototype.compile = function(markdown) {
      var parseTree, tokens;
      tokens = this.lexer.lex(markdown);
      parseTree = this.parser.parse(tokens);
      return this.generator.generate(parseTree);
    };

    return Compiler;

  })();
  Converter = (function() {
    Converter.prototype.compiler = null;

    Converter.prototype.writeExt = null;

    function Converter(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.compiler == null) {
        this.compiler = new Compiler;
      }
      if (this.writeExt == null) {
        this.writeExt = $.writeExt;
      }
    }

    Converter.prototype.readFile = function(path, done) {
      return $.FileSystem.readFile(path, done);
    };

    Converter.prototype.writeFile = function(path, data, done) {
      return $.FileSystem.writeFile(path, data, done);
    };

    Converter.prototype.getWritePath = function(readPath, arg) {
      var basename, cwd, dirname, filename, writeDir, writeExt;
      cwd = arg.cwd, writeDir = arg.writeDir, writeExt = arg.writeExt;
      dirname = $.Path.dirname(readPath);
      basename = $.Path.basename(readPath);
      filename = basename.split(".")[0] + writeExt;
      return $.Path.resolve(cwd, writeDir, filename);
    };

    Converter.prototype.convertPath = function(readPath, options, done) {
      return this.readFile(readPath, (function(_this) {
        return function(error, data) {
          var compiled, writePath;
          if (error != null) {
            return done(error);
          }
          compiled = _this.compiler.compile(data.toString());
          writePath = _this.getWritePath(readPath, options);
          return _this.writeFile(writePath, compiled, done);
        };
      })(this));
    };

    Converter.prototype.convert = function(paths, options, done) {
      return $.Async.eachSeries(paths, (function(_this) {
        return function(path, done) {
          return _this.convertPath(path, options, done);
        };
      })(this));
    };

    return Converter;

  })();
  CLI = (function() {
    CLI.prototype.converter = null;

    CLI.prototype.stdin = null;

    CLI.prototype.stdout = null;

    function CLI(props) {
      var key, val;
      if (props == null) {
        props = {};
      }
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.converter == null) {
        this.converter = new Converter;
      }
      if (this.stdin == null) {
        this.stdin = $.stdin;
      }
      if (this.stdout == null) {
        this.stdout = $.stdout;
      }
    }

    CLI.prototype.getCommandName = function() {
      return $.Path.basename($.argv[1]);
    };

    CLI.prototype.getVersion = function() {
      return $["package"].version;
    };

    CLI.prototype.getHelp = function() {
      var cmd, version;
      cmd = this.getCommandName();
      version = this.getVersion();
      return "MarkdownDriven v" + version + "\nConvert markdown documents to runnable specs.\n\nUsage: " + cmd + " [options] <paths...>\n\noptions:\n  --cwd=dir         The current working directory\n  --readDir=dir     The base directory containing <paths...>\n  --writeDir=dir    The destination directory for writing files\n  --writeExt=ext    The extension to use when writing files\n  --help            Show this help screen\n\ndefaults:\n  cwd: \"" + $.cwd + "\"\n  readDir: \"" + $.readDir + "\"\n  writeDir: \"" + $.writeDir + "\"\n  writeExt: \"" + $.writeExt + "\"\n\nexample:\n  " + cmd + " --readDir=docs --destDir=specs --writeExt=\".spec.js\" docs/**/*.md";
    };

    CLI.prototype.showHelp = function(code) {
      if (code == null) {
        code = 0;
      }
      this.stdout.write(this.getHelp());
      return $.process.exit(code);
    };

    CLI.prototype.getParameters = function(args) {
      var argv, params, ref, ref1, ref2, ref3;
      argv = $.Minimist(args, {
        boolean: ["help"]
      });
      return params = {
        help: argv.help,
        paths: argv._,
        options: {
          cwd: (ref = argv.cwd) != null ? ref : $.cwd,
          readDir: (ref1 = argv.readDir) != null ? ref1 : $.readDir,
          writeDir: (ref2 = argv.writeDir) != null ? ref2 : $.writeDir,
          writeExt: (ref3 = argv.writeExt) != null ? ref3 : $.writeExt
        }
      };
    };

    CLI.prototype.run = function(args) {
      var help, options, paths, ref;
      if (args == null) {
        args = $.argv.slice(2);
      }
      ref = this.getParameters(args), help = ref.help, paths = ref.paths, options = ref.options;
      if (!!help) {
        return this.showHelp(0);
      }
      if (!(paths != null ? paths.length : void 0)) {
        return this.showHelp(1);
      }
      return this.converter.convert(paths, options, (function(_this) {
        return function(error) {
          if (error != null) {
            throw error;
          }
          return $.process.exit(0);
        };
      })(this));
    };

    return CLI;

  })();
  return MarkdownDriven = {
    configuration: $,
    configure: configure,
    InvalidHeadingDepth: InvalidHeadingDepth,
    NotImplemented: NotImplemented,
    ParseTree: ParseTree,
    Node: Node,
    ContextNode: ContextNode,
    BeforeEachNode: BeforeEachNode,
    FileNode: FileNode,
    AssertionNode: AssertionNode,
    Parser: Parser,
    Generator: Generator,
    Compiler: Compiler,
    Converter: Converter,
    CLI: CLI
  };
};

module.exports = configure();

//# sourceMappingURL=index.js.map
