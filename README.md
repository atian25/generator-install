generator-remote-installer
===============

A generator to install remote generator

### Usage

```
  npm install -g generator-remote-installer
  yo remote-installer 
  yo remote-installer [pkg]
  yo remote-installer --tmpDir=./ --cfg=path/to/file
```

### Programmatic usage

```
  var generator = require('generator-remote-installer');
  generator.run(options);
```

### Args

support first argument to be `pkg`, skip prompting

`yo remote-installer generator-ngfis` is alias as `yo remote-installer --pkg=generator-ngfis`

### Options

- cfg : config file, support:
  - {Object} the config object
  - {String} JSON string of config object, given by cli args
  - {String} remote url of config file, such as a github raw url
  - {String} local path of config file

- pkg : install target
  - will use as `npm install pkg`
  - support `npm register name` / `folder path` / `git url` / `github short name`, see also `npm install` docs.
  - provide this will skip ask user to choose from config

- clean : Where to clean generator cache, default to false

- tmpDir : Where to npm install generator, default to `os.tmpDir()`

### Config.json

{Array}

- name : displayName or npm register name
- pkg : optional, if provide will use as `npm install pkg`
- description / author / website : just use to display to user
  
```
[
  {
    "name": "generator-ngfis",
    "description": "ngfis generator",
    "author": "TZ <atian25@qq.com>",
    "repository": "https://github.com/ng-workflow/generator-ngfis"
  },
  {
    "name": "what ever name, pkg is github short name",
    "pkg": "ng-workflow/generator-ngfis",
    "description": "ngfis generator",
    "author": "TZ <atian25@qq.com>",
    "repository": "https://github.com/ng-workflow/generator-ngfis"
  },
  {
    "name": "what ever name, pkg is github url",
    "pkg": "https://github.com/ng-workflow/generator-ngfis",
    "description": "ngfis generator",
    "author": "TZ <atian25@qq.com>",
    "repository": "https://github.com/ng-workflow/generator-ngfis"
  },
  {
    "name": "what ever name, pkg is local url",
    "pkg": "/Usr/TZ/path/to/module",
    "description": "ngfis generator",
    "author": "TZ <atian25@qq.com>",
    "repository": "https://github.com/ng-workflow/generator-ngfis"
  }
]
```