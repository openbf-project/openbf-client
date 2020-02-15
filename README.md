# node-openbf-client
Implementation of SWBF w/ full engine-level modding!

Powered by [Electron.js](https://github.com/electron/electron),
[Three.js](https://github.com/mrdoob/three.js/),
[Cannon.js](https://github.com/schteppe/cannon.js),
[Node.js](https://github.com/nodejs/node)

Not possible without:
- [Blender](https://www.blender.org)
- [Threejs GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Blender GLTF add-on](https://docs.blender.org/manual/en/2.80/addons/io_scene_gltf2.html)
- [GIMP](https://www.gimp.org)
- [vscode](https://code.visualstudio.com/)

## Goals:
- WebRTC networking (stand-in TCP/UDP in the works)
- Linux, Windows, Mac support
- Full engine-level modding support
- Default mods that immitate SWBF 2004
- Networking adapter for SWBF 2004 sessions

## Milestones:
- ### Module (mod) API
    - Client/Server mode (full support)
    - Rendering 3d       (full support)
    - Render UI          (full support)
    - Networking         (in progress)
    - Physics            (full support)
    - Streamable mods    (todo)
    - Input access       (partial support)
- ### Networking
    - Server (in progress)
    - Client (in progress)

- ### Input
    - Keyboard       (full support)
    - Remapping keys (todo)
    - GamePad        (todo)
 
- ### Rendering
    - UI / API (partial support)
    - 3d / API (full support)

- ### Physics
    - Cannon       (integrated)
    - Mesh cutting (planned)
- ### SWBF implementation/default mod(s)
    - Demo map     (todo)
    - Map pipeline (planned)
    - Animation    (possible manual implementation)
    - Audio        (needs attention)
    - SWBF Adapter (planned)

- Logic clock/game loop (todo, but working substitute)
- Render loop           (no implementation, planned)
