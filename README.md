notepal
======

*notepal* is a demo system for collaborative editing, based on the Jupiter model. Jupiter is a multimedia virtual world intended to support long-term remote collaboration, and it supports multiple client platforms and high-latency networks.

For the documentation or the project monitoring documents, take a look at the [Wiki](https://github.com/Aldream/notepal/wiki) or [Github Pages](http://aldream.io/notepal).


### Folder Details

- ***lib/***
    - Scripts for the Jupiter Server-Node
- **model/**
    - Descriptions of the models handled by the system (cf MVC architecture)
- ***public/***
    - Public resources (scripts, stylesheets, images, etc)
- **security/**
    - Resources for the certification (HTTPS)
- ***test/***
    - Unit tests of the whole application
- ***views/***
    - HTML views for the clients (using *ejs* template engine) (cf MVC architecture)
- **Procfile**
    - File to install the app on Heroku
- **auth.js**
    - Services related to the protection of the website and the authentification of the clients
- **config.js**
    - Config variables
- **logger.js**
    - Log Module (*info*, *debug*, *error*, etc)
- **package.json**
    - Resource for *npm*, to install the required *node* packages
- **services.js**
    - Local + REST services (cf MVC architecture)
- **start.js**
    - Main (to launch the app simply do: `node start`)
- **views.js**
    - Services to serve the views (cf MVC architecture)
