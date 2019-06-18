# node-openbf-client
This is the main project for openbf project.
It contains the Electron app code responsible for harnessing
the power of the other projects to run the game.

Current State:
https://www.youtube.com/watch?v=l9oMl0PgimI

## Installing as a user:
Releases can be found in [the GitHub releases page](https://github.com/node-openbf-project/node-openbf-client/releases)
The most recent release will appear as the first in the list.
`There are no current releases, this project is pre-alpha`

## Installing as a dev/tester
Doing this requires some work on your part.
This process is probably not for every person.

`node-openbf-client` is built on the [Electron.js framework](https://electronjs.org/)
which is built as a module of [Node.js framework](https://nodejs.org/en/)

- The first action is to install node: https://nodejs.org/
*If you have already installed this, you should
be able to run `node -v` and `npm -v` commands
to see what versions you have of each.*
--
You are provided two options: `LTS` and `Current`;
we want **LTS**
After the install package has downloaded, running it will open an installation wizard that will guide you. It is a straight forward process.
- You'll need git https://git-scm.com/
  - You can avoid this if you don't want to interact with the github project by contributing. You'll need to click `Clone or Download` on this repository and click `Download Zip` on the context panel that appears.
Unzip the contents to where you want it.
  - //TODO - write installing git help
    run `git clone https://github.com/node-openbf-project/node-openbf-client`
- Tell node package manager to install openbf's modules
Open a terminal and navigate to your clone's directory.
run `npm install`
Npm will read package.json to get the dependencies,
and will auto install them.
//TODO - Write 'If error occurs while installing' help
When NPM says it is finished, you can run
`npm start` to start the game.
If you're using VSCode, you can click `Debug Start` instead.
This is because a vscode launch.json file is included that defines
the debug configurations pre-setup for you.
