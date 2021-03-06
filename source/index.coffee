configure = ($ = {}) ->
  $.require ?= require
  $.Path ?= $.require "path"
  $.Marked ?= $.require "marked"
  $.Async ?= $.require "async"
  $.Glob ?= $.require "glob"
  $.FileSystem ?= $.require "fs"
  $.Minimist ?= $.require "minimist"
  $.package ?= $.require "../package.json"
  $.process ?= process
  $.lexer ?= new $.Marked.Lexer
  $.assertionCodePattern ?= /\b(assert|expect|should)\b/i
  $.fileCodePattern ?= /^.* file: "([^"]*)"/
  $.writeExt ?= ".mdd"
  $.cwd ?= $.process.cwd()
  $.argv ?= $.process.argv
  $.stdin ?= $.process.stdin
  $.stdout ?= $.process.stdout
  $.readDir ?= "docs"
  $.writeDir ?= "spec"

  class ParseTree
    contextNodes: null
    depth: null

    constructor: (props = {}) ->
      @[key] = val for own key, val of props
      @depth ?= 0
      @contextNodes ?= []

    addContextNode: (props) ->
      node = new ContextNode(props)
      node.parent = this
      @contextNodes.push node
      node

    getContextNodes: ->
      @contextNodes

  class Node
    type: null

    constructor: (props = {}) ->
      Object.defineProperty @, "parent",
        value: null, enumerable: false, writable: true

      Object.defineProperty @, "ancestors", enumerable: false, get: ->
        node = this; node = node.parent while node.parent?

      Object.defineProperty @, "depth", enumerable: true, get: ->
        if @parent? then @parent.depth + 1 else 0

      @[key] = val for own key, val of props
      @type ?= @constructor.name

  class ContextNode extends Node
    text: null
    children: null

    constructor: (props) ->
      super props
      @children ?= []

    addChild: (node) ->
      node.parent = this
      @children.push node
      node

    getChildrenByType: (type) ->
      @children.filter (child) -> child.type is type

    addContextNode: (props) ->
      @addChild new ContextNode(props)

    addBeforeEachNode: (props) ->
      @addChild new BeforeEachNode(props)

    addFileNode: (props) ->
      @addChild new FileNode(props)

    addAssertionNode: (props) ->
      @addChild new AssertionNode(props)

    getContextNodes: ->
      @getChildrenByType "ContextNode"

    getFileNodes: ->
      @getChildrenByType "FileNode"

    getAssertionNodes: ->
      @getChildrenByType "AssertionNode"

    getBeforeEachNodes: ->
      @getChildrenByType "BeforeEachNode"

    getAncestorContexts: ->
      @ancestors.filter ({type}) -> type is "ContextNode"

    getParentContext: ->
      @getAncestorContexts[0]

  class BeforeEachNode extends Node
    code: null

  class FileNode extends Node
    path: null
    data: null

  class AssertionNode extends Node
    text: null
    code: null

  class InvalidHeadingDepth extends Error
    headingToken: null

    constructor: (props = {}) ->
      Error.captureStackTrace @, @constructor
      @headingToken = props.headingToken
      @name = @constructor.name
      @message = @getMessage()

    getMessage: ->
      "Invalid depth (#{@headingToken.depth}) for heading '#{@headingToken.text}'."

  class NotImplemented extends Error
    constructor: (message = "not implemented") ->
      Error.captureStackTrace @, @constructor
      @name = @constructor.name
      @message = message

  class Parser
    nativeLanguages: null
    assertionCodePattern: null
    fileCodePattern: null

    constructor: (props = {}) ->
      @[key] = val for own key, val of props
      @nativeLanguages ?= []
      @assertionCodePattern ?= $.assertionCodePattern
      @fileCodePattern ?= $.fileCodePattern

    isNativeCode: (code, lang) ->
      !lang? or lang in @nativeLanguages

    isAssertionCode: (code, lang) ->
      return false if !@isNativeCode(code, lang) or @isFileCode(code, lang)
      @assertionCodePattern.test code

    isBeforeEachCode: (code, lang) ->
      @isNativeCode(code, lang) and !@isFileCode(code, lang) and !@isAssertionCode(code, lang)

    isFileCode: (code, lang) ->
      @fileCodePattern.test code

    getFilePath: (code) ->
      @fileCodePattern.exec(code)[1]

    getFileData: (code) ->
      code.slice(code.indexOf("\n") + 1) + "\n"

    isAssertionNext: (tokens) ->
      return false unless tokens.length > 1
      {type, text, lang} = tokens[1]
      tokens[0].type is "paragraph" and type is "code" and @isAssertionCode(text, lang)

    consumeNextAssertion: (contextNode, tokens) ->
      [para, code] = tokens.splice 0, 2
      contextNode.addAssertionNode text: para.text, code: code.text

    isFileNext: (tokens) ->
      return false unless tokens.length
      {type, text, lang} = tokens[0]
      type is "code" and @isFileCode(text, lang)

    consumeNextFile: (contextNode, tokens) ->
      {text} = tokens.shift()
      path = @getFilePath text
      data = @getFileData text
      contextNode.addFileNode path: path, data: data

    isBeforeEachNext: (tokens) ->
      return false unless tokens.length
      {type, text, lang} = tokens[0]
      type is "code" and @isBeforeEachCode(text, lang)

    consumeNextBeforeEach: (contextNode, tokens) ->
      {text} = tokens.shift()
      contextNode.addBeforeEachNode code: text

    getParentNodeForHeading: (headingToken, parseTree, previousContextNode) ->
      previousNode = (previousContextNode or parseTree)
      depthDiff = previousNode.depth - headingToken.depth
      return previousNode if depthDiff is -1
      return previousNode.ancestors[depthDiff] if depthDiff >= 0
      throw new InvalidHeadingDepth headingToken: headingToken

    parseContextChildTokens: (contextNode, tokens) ->
      return contextNode unless tokens.length

      switch
        when @isAssertionNext(tokens) then @consumeNextAssertion(contextNode, tokens)
        when @isFileNext(tokens) then @consumeNextFile(contextNode, tokens)
        when @isBeforeEachNext(tokens) then @consumeNextBeforeEach(contextNode, tokens)
        else tokens.shift()

      @parseContextChildTokens contextNode, tokens

    parse: (tokens, parseTree = (new ParseTree), previousContextNode) ->
      headingToken = tokens.find ({type}) -> type is "heading"
      return parseTree unless headingToken?

      parentNode = @getParentNodeForHeading headingToken, parseTree, previousContextNode
      contextNode = parentNode.addContextNode text: headingToken.text

      tokens = tokens.slice (tokens.indexOf(headingToken) + 1)
      childTokens = do -> tokens.shift() while tokens.length and tokens[0].type isnt "heading"

      @parseContextChildTokens contextNode, childTokens
      @parse tokens, parseTree, contextNode

  class Generator
    generate: (parseTree) ->
      throw new NotImplemented()

  class Compiler
    lexer: null
    parser: null
    generator: null

    constructor: (props = {}) ->
      @[key] = val for own key, val of props
      @lexer ?= $.lexer
      @parser ?= new Parser
      @generator ?= new Generator

    compile: (markdown) ->
      tokens = @lexer.lex markdown
      parseTree = @parser.parse tokens
      @generator.generate parseTree

  class Converter
    compiler: null
    cwd: null
    readDir: null
    writeDir: null
    writeExt: null

    constructor: (props = {}) ->
      @[key] = val for own key, val of props
      @compiler ?= new Compiler
      @cwd ?= $.cwd
      @readDir ?= $.readDir
      @writeDir ?= $.writeDir
      @writeExt ?= $.writeExt

    constructOptions: (options = {}) ->
      cwd: $.Path.resolve(options.cwd ? @cwd)
      readDir: options.readDir ? @readDir
      writeDir: options.writeDir ? @writeDir
      writeExt: options.writeExt ? @writeExt

    readFile: (path, done) ->
      $.FileSystem.readFile path, done

    writeFile: (path, data, done) ->
      $.FileSystem.writeFile path, data, done

    getWritePath: (readPath, {cwd, writeDir, writeExt}) ->
      dirname = $.Path.dirname readPath
      basename = $.Path.basename readPath
      filename = basename.split(".")[0] + writeExt
      $.Path.resolve cwd, writeDir, filename

    convertPath: (readPath, options, done) ->
      @readFile readPath, (error, data) =>
        return done error if error?
        compiled = @compiler.compile data.toString()
        writePath = @getWritePath readPath, options
        @writeFile writePath, compiled, done

    convertPaths: (paths, options, done) ->
      $.Async.eachSeries paths, (path, done) =>
        @convertPath path, options, done

    convertSource: (source, options, done) ->
      $.Glob source, cwd: options.cwd, (error, paths) =>
        return done error if error?
        @convertPaths paths, options, done

    convertSources: (sources, options, done) ->
      $.Async.eachSeries sources, (source, done) =>
        @convertSource source, options, done

    convert: (sources, options, done) ->
      options = @constructOptions options
      @convertSources sources, options, done

  class CLI
    converter: null
    stdin: null
    stdout: null

    constructor: (props = {}) ->
      @[key] = val for own key, val of props
      @converter ?= new Converter
      @stdin ?= $.stdin
      @stdout ?= $.stdout

    getCommandName: ->
      $.Path.basename $.argv[1]

    getVersion: ->
      $.package.version

    getHelp: ->
      cmd = @getCommandName()
      version = @getVersion()
      {cwd, readDir, writeDir, writeExt} = @converter

      """
      MarkdownDriven v#{version}
      Convert markdown documents to runnable specs.

      Usage: #{cmd} [options] <sources...>

      options:
        --cwd=dir         The current working directory
        --readDir=dir     The base directory containing <paths...>
        --writeDir=dir    The destination directory for writing files
        --writeExt=ext    The extension to use when writing files
        --help            Show this help screen

      defaults:
        cwd: "#{cwd}"
        readDir: "#{readDir}"
        writeDir: "#{writeDir}"
        writeExt: "#{writeExt}"

      example:
        #{cmd} --readDir=docs --writeDir=specs --writeExt=".spec.js" "docs/**/*.md"

      """

    showHelp: (code = 0) ->
      @stdout.write @getHelp()
      $.process.exit code

    getParameters: (args) ->
      argv = $.Minimist args, boolean: ["help"]
      params =
        help: argv.help
        paths: argv._
        options:
          cwd: argv.cwd
          readDir: argv.readDir
          writeDir: argv.writeDir
          writeExt: argv.writeExt

    run: (args = $.argv.slice(2)) ->
      {help, paths, options} = @getParameters args
      return @showHelp(0) if !!(help)
      return @showHelp(1) unless !!(paths?.length)

      @converter.convert paths, options, (error) =>
        throw error if error?
        $.process.exit(0)

  MarkdownDriven =
    configuration: $
    configure: configure
    InvalidHeadingDepth: InvalidHeadingDepth
    NotImplemented: NotImplemented
    ParseTree: ParseTree
    Node: Node
    ContextNode: ContextNode
    BeforeEachNode: BeforeEachNode
    FileNode: FileNode
    AssertionNode: AssertionNode
    Parser: Parser
    Generator: Generator
    Compiler: Compiler
    Converter: Converter
    CLI: CLI

module.exports = configure()
