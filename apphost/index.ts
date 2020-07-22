
import { serve } from "https://deno.land/std/http/server.ts";
import { Status } from "https://deno.land/std/http/http_status.ts";
import * as path from "https://deno.land/std/path/mod.ts";

let port: number = 8080;
let textDec = new TextDecoder();

const server = serve({ port });

console.log(`http://localhost:${port}/`);

function getContentType(fname: string): string {
  let ext = path.extname(fname).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=UTF-8";
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    default:
      return "text/plain";
  }
}

function resolveUrl(url: string): string {
  if (url == "/") url = "index.html";
  return path.join(Deno.cwd(), "build", url);
}

for await (const req of server) {
  let rpath = resolveUrl(req.url);

  let headers = new Headers();

  let data: Uint8Array;
  try {
    data = await Deno.readFile(rpath);
    console.log("served", rpath);

    headers.set("content-type", getContentType(rpath));

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
