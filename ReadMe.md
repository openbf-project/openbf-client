# OpenBF - client

## Status
- Active Development

## Demo Status
- Awaiting gltf-ts integration

### Tracked missing features
- ❌ gltf-ts integration (using gltfloader as fallback in mean time)
- ❌ SWBF adapter pipe
- ❌ API docs
- ❌ Mobile version of apphost

## Running (devs)
### Pre-requisites:
- [nodejs & npm](https://nodejs.org)
- [deno](https://deno.land)

1. Install npm packages<br/>
`npm install`

2. Build using webpack/babel<br/>
`./build.sh`

3. Run the deno local content server
```bash
cd ./apphost

./start.sh
```

4. Connect your browser<br/>
URL should log in console<br/>
But by default its http://localhost:8080

## Running (players)
Instructions won't work, not ready yet

```bash
./openbf.sh
```
Browser should open automatically
