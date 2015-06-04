var path = require('path');
var util = require('util');

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var request = require('request');
var npmi = require('npmi');

module.exports = yeoman.generators.Base.extend({
  constructor: function (args, options) {
    var CONFIG_URL_REMOTE = 'https://yeoman-generator-list.herokuapp.com/';
    var CONFIG_URL_BUILDIN = 'https://raw.githubusercontent.com/atian25/generator-install/master/config.json?' + new Date().getTime();
    var pkgInfo = require('../package.json');

    //support first argument to be package, skip prompting
    options['pkg'] = options['pkg'] || args[0];

    //where to npm install generator
    options['tmpDir'] = normalize(options['tmpDir'] || require('os').tmpDir());

    yeoman.Base.apply(this, arguments);

    this.description = pkgInfo.description;
    this.option('cfg', {
      desc: 'config file url, support object / json string / remote url / local url',
      defaults: options.hasOwnProperty('buildin') ? CONFIG_URL_BUILDIN : CONFIG_URL_REMOTE
    });

    this.option('keyword', {
      desc: 'keyword to filter generators'
    });

    this.option('buildin', {
      desc: 'use buildin config remote url'
    });

    this.argument('pkg', {
      required: false,
      optional: true,
      desc: 'npm install package target'
    });
  },

  initializing: function () {
    //if provide pkg, skip read cfg
    if (!this.options.pkg) {
      var done = this.async();
      var options = this.options;

      //read config by options.cfg param
      readConfig.call(this, options.cfg, function (err, results) {
        if (err) {
          console.error('Read Config got error: ', err);
        } else if (!Array.isArray(results)) {
          console.error('Config should be array', results);
        } else {
          //filter
          options.generators = results.filter(function (item) {
            return !options['keyword'] || item.name.indexOf(options['keyword']) !== -1;
          });
          //sort
          options.generators.sort(function (x, y) {
            return y['stars'] - x['stars'];
          });
          //check length
          if(!options.generators.length){
            console.error('%s Not found any generator by keyword: %s, exit..', chalk.bold.yellow('>'), options['keyword']);
            process.exit();
          }
          done();
        }
      });
    }
  },

  prompting: {
    generator: function () {
      var self = this;
      var options = this.options;

      //if provide pkg, skip prompt
      if (!options.pkg) {
        var done = this.async();
        //format user question
        var choices = options.generators.map(function (item) {
          var label = chalk.yellow(item.name);
          if (item.hasOwnProperty('stars')) {
            label += ' (Stars: ' + item['stars'] + ')';
          }
          ['description', 'website'].forEach(function (key) {
            if (item.hasOwnProperty(key)) {
              label += util.format('\r\n    - %s: %s', capitalizeFirstLetter(key), item[key]);
            }
          });
          return {
            name: label,
            value: item
          };
        });
        //ask for generator
        self.prompt({
          name: 'generator',
          type: 'list',
          message: 'Choose generator(Total ' + choices.length + ') ',
          choices: choices
        }, function (results) {
          var target = results['generator'];
          //self.options.generator = target;
          options.name = target.name;
          options.pkg = target.pkg || target.name;
          done();
        });
      } else {
        options.name = options.name || options.pkg;
      }
    }
  },

  writing: {
    install: function () {
      var self = this;
      var done = this.async();
      var options = self.options;
      self.log('%s npm install %s to %s ...', chalk.bold.yellow('>'), options.pkg, options.tmpDir);
      //npm install
      npmi({
        name: options.pkg,
        path: options.tmpDir,
        forceInstall: options.clean
      }, function (err, result) {
        if (err) {
          if (err.code === npmi.LOAD_ERR) {
            console.error('npm load error');
          } else if (err.code === npmi.INSTALL_ERR) {
            console.error('npm install error');
          } else {
            console.error(err.message);
          }
          done(err);
        } else {
          //last item is install pkg info
          if (Array.isArray(result) && result.length > 0) {
            options.installPath = path.join(process.cwd(), result[result.length - 1][1]);
          } else {
            //WARN: if package.json 's name is not equal options.name, may got bug.
            options.installPath = path.join(options.tmpDir, 'node_modules', options.name);
          }
          self.log('%s installed successfully.', chalk.bold.yellow('>'));
          done();
        }
      })
    },

    run: function () {
      var name = this.options.name;
      this.log('%s run %s:', chalk.bold.yellow('>'), name);
      var generator = require(this.options.installPath);
      var env = yeoman();
      env.registerStub(generator, name);
      env.run(name);
    }
  }
});

module.exports.run = function (options) {
  var env = yeoman();
  env.registerStub(module.exports, 'helper');
  env.run('helper', options);
};

//read cfg from object / remote url / local url
function readConfig(cfg, cb) {
  //whether cfg is json string
  try {
    cfg = JSON.parse(cfg);
  } catch (e) {
    //console.log(e);
  }

  //check type
  switch (typeof cfg) {
    case 'string':
      if (/^http/.test(cfg)) {
        //remote url, request it.
        this.log('%s fetch generators from %s, please wait...', chalk.bold.yellow('>'), cfg);
        request.get({url: cfg, json: true}, function (err, response, body) {
          if (err) {
            cb(err);
          } else if (response.statusCode !== 200 || typeof body !== 'object') {
            cb(new Error(util.format('request %s got invalid response, statusCode: %s, typeof body: %s', cfg, response.statusCode, typeof body)));
          } else {
            cb(null, body);
          }
        });
      } else {
        //local path, just require it
        cb(null, require(cfg));
      }
      break;

    case 'object':
      //object, just return it
      cb(null, cfg);
      break;

    default:
      console.error('unknown cfg type: ', cfg);
      break;
  }
}

//uppercase first latter
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//normalize path to absolute path
function normalize(str) {
  if (str) {
    str = str.replace(/^~(\/.*)/, (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '$1');
    str = path.isAbsolute(str) ? str : path.join(process.cwd(), str);
  }
  return str;
}