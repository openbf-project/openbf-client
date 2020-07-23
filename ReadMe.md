# OpenBF - client

## Status
- Active Development

## Demo Status
- Active Development

### Rework status
- ✅ Convert to TypeScript ESModules
- ✅ Get three.js to work
- ✅ Get three.js ts defs to work
- ❌ Bring in ammo.js
- ❌ Bring in GPGPU physics
- ✅ Get deno up and serving from localhost
- ✅ Implement resource manager and API
- ✅ Users space modules now import using Resource API
- ❌ ModelResource pipeline
- ❌ Relative module resources
- ❌ SWBF adapter pipe
- ❌ API docs
- ❌ Mobile version of `apphost`
- ❌ Adjust gamepad api usage from electron fixes..
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
