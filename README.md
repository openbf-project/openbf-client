# node-openbf-client
Implementation of SWBF

Uses electron & node javascript frameworks
Coupled with threejs and a bunch of custom libraries

Goals:
- Use original game's files
- Add WebRTC LAN parties
- Work crossplatform
- Support overhaul modding (shaders, animation, addons, networking)

Currently rethinking:
- Original server compat.
- - It may not be worth doing since WebRTC will be easier to implement
- Map loading from source
- - The tools created would be better suited to carrying over assets to modern formats
- Bundle naming convention
- - Revert to module because bundle sounds kind of dumb and undescriptive

About to refactor:
- Module loading
- - importScript for modules now native to browser
- Input handling
- - Electron is goofy, and I'd rather stick with HTML5 guns
- ALL of the weird format of JavaScript to modern styles
- Reduction of individual script sizes by using modules better
- Abstracting renderer to be modular for less pain
- Physics abstracted to use built-in threejs data for less memory footprint
