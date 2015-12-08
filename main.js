'use strict';

const BrowserWindow = require('browser-window');
const Menu = require('./core/menu');

module.exports = {
  load () {
  },

  unload () {
  },

  'hierarchy:open' () {
    Editor.Panel.open('hierarchy.panel');
  },

  'hierarchy:popup-create-menu' (event, x, y) {
    var template = Menu.getCreateTemplate();
    var editorMenu = new Editor.Menu(template, event.sender);
    // TODO: editorMenu.add( '', Editor.Menu.getMenu('create-asset') );

    x = Math.floor(x);
    y = Math.floor(y);
    editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
    editorMenu.dispose();
  },

  'hierarchy:popup-context-menu' (event, x, y) {
    var template = Menu.getContextTemplate();
    var editorMenu = new Editor.Menu(template, event.sender);

    x = Math.floor(x);
    y = Math.floor(y);
    editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
    editorMenu.dispose();
  },
};
