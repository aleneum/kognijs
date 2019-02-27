# KogniJS [![Build Status](https://travis-ci.org/aleneum/kognijs.svg?branch=master)](https://travis-ci.org/aleneum/kognijs)

KogniJS is a framework to control a distributed smart (home) environment via [RSB](http://docs.cor-lab.org/rsb-manual/trunk/html/). This includes sending (typed) messages from the Browser to the connected systems with [kognijs-rsb](https://github.com/aleneum/kognijs-rsb) and creating custom widgets to alter the state of view models or react to changes with [kognijs-animate](https://github.com/aleneum/kognijs-animate).

This packages provides the means to connect both functionality and also allow to configure system model and view model connections without the need of writing code.

## Getting started

You need to know what [RSB](http://docs.cor-lab.org/rsb-manual/trunk/html/) is and how to send RSB messages.
For testing, you need to have a recent version of [Node.js and npm](https://nodejs.org/en/download/) installed.
Since KogniJS requires a WAMP-capable web server to communicate with, you need to have a working version of [kogniserver](https://github.com/aleneum/kogniserver) installed.
Kogniserver is a python web server based on [crossbar.io]() and can be installed via pip:

```bash
pip install kogniserver  # install kogniserver
kogniserver  # run it
```

Now, clone the repository, install all dependencies and fire up the test server.
```bash
git clone https://github.com/aleneum/kognijs.git
cd kognijs
npm install
npm run dev  # starts test server
```

Now open your browser at [localhost:3000](http://localhost:3000) to start the tour and start sending RSB events from the command line.
For instance `rsb-tools send '"hello"' /kognijs/io/display/contentArea/html` should reset the content in the 'Remote HTML Content' section.

## Acknowledgements

The development of this software was supported through project grants [KogniHome](kogni-home.de) (German Federal Ministry of Education and Research (BMBF) grant no. 16SV7054K) at Bielefeld University.
