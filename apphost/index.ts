
import { serve } from "https://deno.land/std/http/server.ts";
import { Status } from "https://deno.land/std/http/http_status.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { walk, exists, ensureDirSync } from "https://deno.land/std/fs/mod.ts";

let port: number = 8080;
let textDec = new TextDecoder();
let textEnc = new TextEncoder();

let httpRelDir = "build";
let moduleRelDir = path.join("resources", "modules");
let modulesDir = path.join(Deno.cwd(), httpRelDir, moduleRelDir);

const MODULE_DEF_JSON_NAME = "module.json";

const server = serve({ port });

console.log(`http://localhost:${port}/`);

function getContentType(fname: string): string {
  let ext = path.extname(fname).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=UTF-8";
    case ".js":
      console.log(fname, "is javascript text file");
      return "text/javascript";
    case ".css":
      return "text/css";
    default:
      return "text/plain";
  }
}

function resolveUrl(url: string): string {
  if (url.startsWith("/~")) {
    return url;
  }

  if (url == "/") {
    url = "index.html";
  }
  return path.join(Deno.cwd(), "build", url);
}

async function queryModules(): Promise<Map<string, string>> {
  let result: Map<string, string> = new Map();
  try {
    ensureDirSync(modulesDir);
    for await (let file of walk(modulesDir)) {
      if (file.isDirectory) {
        if (await exists(path.join(file.path, MODULE_DEF_JSON_NAME))) {
          result.set(file.name, path.join(moduleRelDir, file.name));
        }
      }
    }
  } catch (ex) {
    console.warn("build/resources/modules couldn't be reached", ex);
  }
  return result;
}

function mapToObject<K,V> (map: Map<K, V>, obj: any) {
  map.forEach((v, k)=>{
    obj[k] = v;
  });
}

interface JsonQuery {
  status: string;
  description: string;
  [key: string]: any;
}

function handleJsonQuery(query: string): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    let resultJson: JsonQuery = {
      status: "ok",
      description: "unhandled"
    };
    let resultStr: string;
    let resultArr: Uint8Array;

    switch (query) {
      case "query.modules":
        let data = {};
        mapToObject(await queryModules(), data);
        resultJson.data = data;
        resultJson.description = "queried modules";
        break;
      default:
        resultJson.status = "error";
        resultJson.description = `query ${query} unhandled`;
        break;
    }
    resultStr = JSON.stringify(resultJson);
    resultArr = textEnc.encode(resultStr);
    resolve(resultArr);
  });
}

for await (const req of server) {
  let rpath = resolveUrl(req.url);
  console.log("serve", rpath);

  let headers = new Headers();

  let data: Uint8Array;
  try {
    if (rpath.startsWith("/~")) {
      data = await handleJsonQuery(rpath.substring(2));
    } else {
      data = await Deno.readFile(rpath);
      headers.set("content-type", getContentType(rpath));
    }
    req.respond({
      body: data,
      headers: headers
    });
  } catch (ex) {
    req.respond({
      status: Status.NotFound
    });
  }
}
