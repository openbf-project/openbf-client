
export interface Placement {
  label: string;
  file: string;
  info?: PlaceInfo
}

export interface PlaceInfo {
  posx?:number;
  posy?:number;
  posz?:number;
  rotx?: number;
  roty?: number;
  rotz?: number;
  rotw?: number;
  // team: number;
  // layer: number;
}

export interface wld {
  placements: Array<Placement>;
}

const IdentifierRegex = /[a-zA-Z]/;
const WhitespaceRegex = /\s/;

function scan_whitespace(data: string, offset: number): string {
  let result = "";
  let char;
  for (let i=offset; i<data.length; i++) {
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

function peekNextChar(data: string, offset: number): string {
  return data.charAt(offset);
}

function consume_parenthesis(data: string, offset: number): string {
  let result = "";
  let char;
  let foundLast = false;
  let foundFirst = false;

  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (char === "(") {
      if (foundFirst) {
        throw "Didn't expect to see another open paren here";
      } else {
        foundFirst = true;
      }
    } else if (char === ")") {
      foundLast = true;
      return result;
    } else {
      result += char;
    }
  }
  throw `Consumed until eof, didn't find ending parenthesis, starting at ${offset}`;
}

function consume_brackets(data: string, offset: number): string {
  let result = "";
  let char;
  let foundLast = false;
  let foundFirst = false;

  for (let i = offset; i < data.length; i++) {
    char = data.charAt(i);
    if (char === "{") {
      if (foundFirst) {
        throw "Didn't expect to see another open bracket here";
      } else {
        foundFirst = true;
      }
    } else if (char === "}") {
      foundLast = true;
      return result;
    } else {
      result += char;
    }
  }
  throw `Consumed until eof, didn't find ending bracket, starting at ${offset}`;
}

function parse_parenthesis (data: string): string[] {
  let result = data.split(",");
  let arg: string;
  for (let i=0; i<result.length; i++) {
    arg = result[i];
    arg = arg.trimLeft().trimRight();
    if (arg.startsWith("\"")) {
      arg = arg.substring(1, arg.length-1);
    }
    result[i] = arg;
  }
  
  return result;
}

function parse_brackets (data: string): PlaceInfo {
  let result: PlaceInfo = {};

  let offset: number = 0;
  let dataLen = data.length;

  let whiteSpace: string;
  let identifier: string;
  let semiColon: string;
  let parenRaw: string;
  let parenArgs: string[];

  while (offset < dataLen-1) {
    whiteSpace = scan_whitespace(data, offset);
    offset += whiteSpace.length;

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

    parenRaw = consume_parenthesis(data, offset);
    if (parenRaw.length > 0) {
      offset += parenRaw.length + 2; //plus two for the parenthesis themselves
    }

    semiColon = peekNextChar(data, offset);
    if (semiColon.length < 1) throw "No semi colon for object placement data";
    offset += semiColon.length;

    parenArgs = parse_parenthesis(parenRaw);

    switch (identifier) {
      case "ChildRotation":
        result.rotx = parseFloat(parenArgs[0]);
        result.roty = parseFloat(parenArgs[1]);
        result.rotz = parseFloat(parenArgs[2]);
        result.rotw = parseFloat(parenArgs[3]);
        break;
      case "ChildPosition":
        result.posx = parseFloat(parenArgs[0]);
        result.posy = parseFloat(parenArgs[1]);
        result.posz = parseFloat(parenArgs[2]);
        break;
      default:
        // console.log("Unhandled args for", identifier);
    }
  }

  return result;
}

export function parse(data: string): wld {
  let dataLen = data.length;
  let offset = 0;

  let result: wld = {
    placements: []
  }

  let whiteSpace: string;
  let identifier: string;
  let peek: string;
  let parenRaw: string;
  let parenArgs: string[];
  let bracketRaw: string;
  let semiColon: string;

  let placement: Placement;

  while (offset < dataLen-1) {
    whiteSpace = scan_whitespace(data, offset);
    offset += whiteSpace.length;

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

    switch (identifier) {
      case "Object":
        parenRaw = consume_parenthesis(data, offset);
        if (parenRaw.length > 0) {
          parenArgs = parse_parenthesis(parenRaw);
          placement = {
            label:parenArgs[0],
            file:parenArgs[1]
          };
          offset += parenRaw.length + 2; //plus two for the parenthesis themselves
        } else {
          throw `Object placements needs arguments! at ${offset}`;
        }

        whiteSpace = scan_whitespace(data, offset);
        offset += whiteSpace.length;

        bracketRaw = consume_brackets(data, offset);
        if (bracketRaw.length > 0) {
          placement.info = parse_brackets (bracketRaw);
          offset += bracketRaw.length + 2; //plus two for the brackets themselves
        } else {
          throw `Object placements needs bracket descriptor block! at ${offset}`;
        }
        result.placements.push(placement);
        break;
      default:
        console.log("Skipping id", identifier);
        parenRaw = consume_parenthesis(data, offset);
        if (parenRaw.length > 0) {
          offset += parenRaw.length + 2; //plus two for the parenthesis themselves
        }
        whiteSpace = scan_whitespace(data, offset);
        offset += whiteSpace.length;

        bracketRaw = consume_brackets(data, offset);
        if (bracketRaw.length > 0) {
          offset += bracketRaw.length + 2; //plus two for the brackets themselves
          break;
        } else {
          whiteSpace = scan_whitespace(data, offset);
          offset += whiteSpace.length;

          semiColon = peekNextChar(data, offset);
          if (semiColon.length < 1) throw "No semi colon or brackets?!";
          offset += semiColon.length;
        }
        break;
    }
  }

  return result;
}
