var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var db = require(path.normalize(__dirname + '/../../db'));
var pluginsPath = path.join(__dirname, '..', '..', 'plugins');
var plugins = require(pluginsPath);

var predefinedPlugins = require(path.normalize(__dirname + '/../../plugin-conf'));
var hookCache = {
  'boards-before': [],
  'boards-after': [],
  'board-actions': [],
  'thread-actions': [],
  'post-profile': [],
  'post-actions': [],
  'post-body-after': [],
  'profile-details': [],
  'profile-display': []
};
var hookCacheKeys = _.keys(hookCache);
var outputText = '// DO NOT EDIT THIS FILE\n';
outputText += '// IT IS A GENERATED FILE\n\n';
var templateRequires = [];
var resourceRequires = [];

module.exports = function() {
  // install predefined plugins
  return Promise.each(predefinedPlugins, function(pluginName) {
    return db.plugins.exists(pluginName)
    .then(function(exists) {
      if (!exists) {
        console.log('INSTALLING ' + pluginName);
        return plugins.install(pluginName); }
    });
  })
  // get all registered plugins
  .then(db.plugins.all)
  // aggregate template hooks and template dirs
  .each(function(dbPlugin) {
    var plugin = plugins.load(dbPlugin.name);
    var hooks = plugin.templateHooks;
    var templatePath = path.join(pluginsPath, dbPlugin.name, 'templates');
    var resourcePath = path.join(pluginsPath, dbPlugin.name, 'resources.js');

    return Promise.all([
      new Promise(function(resolve, reject) {
        console.log('checking temprates');
        fs.stat(templatePath, function(err, stats) {
          if (!err && stats.isDirectory()) {
            // template dir for this plugin
            templateRequires.push('require(\'' + templatePath + '\')');
          }
          return resolve();
        });
      }),
      new Promise(function(resolve, reject) {
        fs.stat(resourcePath, function(err, stats) {
          // if (!err && stats.isFile()) {
          //   // resource file for this plugin
          //   resourceRequires.push('require(\'' + resourcePath + '\')');
          //   console.log('blablabla srsly?', resourceRequires);
          // }
          return resolve();
        });
      })
    ]);
    // .then(function() {
    //   // directive hook points for this plugin
    //   return Promise.each(hookCacheKeys, function(key) {
    //     if (hooks[key] && hooks[key].length > 0) {
    //       hookCache[key] = hookCache[key].concat(hooks[key]);
    //     }
    //   });
    // });
  })
  .then(function() {
    if (templateRequires.length || resourceRequires.length ) {
      console.log('really...', resourceRequires);
      outputText += 'module.exports = [' + templateRequires.concat(resourceRequires).toString() + '];';
    }
    else {
      console.log('where is everything?', templateRequires, resourceRequires);
    }
  })
  // append directive hook points to output
  // .then(function() {
  //   outputText += '\n';
  //   outputText += 'angular.module(\'ept\')\n';
  //   outputText += '.constant(\'templateHooks\', ';
  //   outputText += JSON.stringify(hookCache);
  //   outputText += ');\n';
  // })
  // rebuild app/plugins file
  .then(function() {
    return new Promise(function(resolve, reject) {
      var filePath = path.normalize(__dirname + '/../../app/plugins.js');
      fs.writeFile(filePath, outputText, 'utf8', function(err){
        if (err) { return reject(err); }
        else {
          console.log('Generated plugin file.');
          return resolve();
        }
      });
    });
  });
};
