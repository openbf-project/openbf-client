
const IdentifierRegex = /[a-zA-Z]/;
const WhitespaceRegex = /\s/;
const NumberRegex = /[0-9.]/;
const NewLineRegex = /(\r?\n)/;

function scan_whitespace(data: string, offset: number): string {
  let result = "";
  let char;
  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (WhitespaceRegex.test(char)) {
      result += char;
    } else {
      return result;
    }
  }
  return result;
}

function scan_identifier(data: string, offset: number): string {
  let result = "";
  let char;
  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (IdentifierRegex.test(char)) {
      result += char;
    } else {
      return result;
    }
  }
  return result;
}

function scan_until (data: string, offset: number, until: string): string {
  let result = "";
  let char;
  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (char !== until) {
      result += char;
    } else {
      return result;
    }
  }
  return result;
}

function scan_until_regex (data: string, offset: number, untilRegex: RegExp): string {
  let result = "";
  let char;
  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if ( untilRegex.test(char) ) {
      result += char;
    } else {
      return result;
    }
  }
  return result;
}

function scan_number (data: string, offset: number): string {
  let result = "";
  let char;
  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (NumberRegex.test(char)) {
      result += char;
    } else {
      return result;
    }
  }
  return result;
}

function peekNextChar(data: string, offset: number): string {
  return data.charAt(offset);
}

export class IniScope {
  name: string;
  values: Map<string, any>;
  constructor(name: string) {
    this.name = name;
    this.values = new Map();
  }
}

export function parse(data: string): Map<string, IniScope> {
  let dataLen = data.length;
  let offset = 0;

  let whiteSpace: string;
  let identifier: string;
  let peek: string;
  let key: string;
  let stringLiteral: string;
  let numberLiteral: string;
  let currentValue: any;

  let result: Map<string, IniScope> = new Map();
  let currentScope: IniScope;

  while (offset < dataLen - 1) {
    whiteSpace = scan_whitespace(data, offset);
    offset += whiteSpace.length;

    peek = peekNextChar(data, offset);
    if (peek === "[") {
      //scan [tag]
      offset++;

      identifier = scan_identifier(data, offset);
      if (identifier.length == 0) {
        if (offset === dataLen) {
          break;
        } else {
          throw `Couldn't find identifier ${offset} / ${dataLen}`;
        }
      }
      offset += identifier.length;

      peek = peekNextChar(data, offset);
      if (peek == "]") {
        offset++;
        currentScope = new IniScope(identifier);
        result.set(identifier, currentScope);
      } else {
        throw `Expected next char to be closing bracket ] , found "${peek}"`;
      }
    } else if (peek == ";") {
      whiteSpace = scan_until_regex(data, offset, NewLineRegex);
      offset += whiteSpace.length;
      //Skip until new line
    } else {
      identifier = scan_identifier(data, offset);
      if (identifier.length == 0) {
        if (offset === dataLen) {
          break;
        } else {
          throw `Couldn't find identifier ${offset} / ${dataLen}`;
        }
      }
      offset += identifier.length;

      whiteSpace = scan_whitespace(data, offset);
      offset += whiteSpace.length;

      peek = peekNextChar(data, offset);
      if (peek !== "=") throw `Expected assignment of key ${identifier}, expected =, found ${peek}`;
      offset++;

      key = identifier;

      whiteSpace = scan_whitespace(data, offset);
      offset += whiteSpace.length;

      peek = peekNextChar(data, offset);
      if (peek === "\"") { //Handle "string"
        offset++;
        stringLiteral = scan_until(data, offset, "\"");
        if (stringLiteral.length == 0) {
          if (offset === dataLen) {
            break;
          } else {
            throw `Couldn't find stringLiteral ${offset} / ${dataLen}`;
          }
        }
        offset += stringLiteral.length;

        peek = peekNextChar(data, offset);
        offset ++;
        if (peek === "\"") {
          currentValue = stringLiteral;
        } else {
          throw `Couldn't find ending string literal quote ", found ${peek}`;
        }

      } else if ( NumberRegex.test(peek) ) {
        numberLiteral = scan_number(data, offset);
        offset += numberLiteral.length;

        currentValue = parseFloat(numberLiteral);
      }

      currentScope.values.set(
        key,
        currentValue
      );

    }
  }

  return result;
}
