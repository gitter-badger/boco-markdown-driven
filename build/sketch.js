// Generated by CoffeeScript 1.10.0
var JDD, converter, jasmine, parser, sourceData, sourcePath, tokenizer, tokens;

JDD = require("./");

tokenizer = new JDD.Tokenizer;

sourcePath = require("path").resolve(__dirname, "..", "docs", "math.coffee.md");

sourceData = require("fs").readFileSync(sourcePath).toString();

tokens = tokenizer.tokenize(sourceData);

console.log(tokens);

converter = new JDD.JasmineConverter;

tokens = converter.convert(tokens);

console.log(tokens);

parser = new JDD.JasmineCoffeeParser;

jasmine = parser.parse(tokens);

console.log(jasmine);

//# sourceMappingURL=sketch.js.map
