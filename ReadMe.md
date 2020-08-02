# OpenBF - client

## Status
- Active Development

## Demo Status
- Awaiting gltf-ts integration

### Tracked missing features
- ❌ Modules importing resources relative to themselves / other modules
- ❌ gltf-ts integration
- ❌ ModelResource
- ❌ SWBF adapter pipe
- ❌ API docs
- ❌ Mobile version of apphost
- ❌ Standard UI (core is there)

## Running (devs)
Note there isn't much to run atm

Will need to build project
### Pre-requisites:
- [nodejs & npm](https://nodejs.org)
- [deno](https://deno.land)

1. Install npm packages<br/>
`npm install`

2. Build using babel<br/>
`npm run build`<br/>
or<br/>
`./build.sh`<br/>
or<br/>
`babel src --extensions '.ts' --copy-files -d apphost/build`<br/>
in the same directory as `.babelrc` and `src`

3. Run the deno local content server
```bash
cd ./apphost

./start.sh
```
or
```bash
cd ./apphost

deno run --allow-net --allow-read --unstable ./index.ts
```

4. Connect your browser<br/>
Deno should spit out the URL in console<br/>
But by default its http://localhost:8080

## Running (players)
Instructions won't work, not ready yet

```bash
./openbf.sh
```
Browser should open automatically
