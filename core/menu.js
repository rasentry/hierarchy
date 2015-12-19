'use strict';

function getContextTemplate () {
  return [
    {
      label: Editor.T('HIERARCHY.create'),
      submenu: getCreateTemplate(true)
    },

    {
      // ---------------------------------------------
      type: 'separator'
    },

    {
      label: Editor.T('HIERARCHY.copy'),
      click () {
        let contexts = Editor.Selection.contexts('node');
        Editor.sendToPanel('scene.panel', 'scene:copy-nodes', contexts);
      },
    },

    {
      label: Editor.T('HIERARCHY.paste'),
      click () {
        let contexts = Editor.Selection.contexts('node');
        Editor.sendToPanel('scene.panel', 'scene:paste-nodes', contexts.length > 0 ? contexts[0] : '');
      },
    },

    {
      label: Editor.T('HIERARCHY.duplicate'),
      click () {
        let contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
          Editor.sendToPanel('hierarchy.panel', 'hierarchy:duplicate', contexts);
        }
      },
    },

    {
      // ---------------------------------------------
      type: 'separator'
    },

    {
      label: Editor.T('HIERARCHY.rename'),
      click () {
        let contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
          Editor.sendToPanel('hierarchy.panel', 'hierarchy:rename', contexts[0]);
        }
      },
    },

    {
      label: Editor.T('HIERARCHY.delete'),
      click () {
        let contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
          Editor.sendToPanel('hierarchy.panel', 'hierarchy:delete', contexts);
        }
      },
    },

    {
      // ---------------------------------------------
      type: 'separator'
    },

    {
      label: Editor.T('HIERARCHY.show_path'),
      visible: Editor.isDev,
      click () {
        let contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
          Editor.sendToPanel('hierarchy.panel', 'hierarchy:show-path', contexts[0]);
        }
      }
    },
  ];
}

function getCreateTemplate ( isContextMenu ) {
  // let isSibling = isContextMenu ? false : true;
  let isSibling = false; // NOTE: always be child
  let referenceID;
  if ( isContextMenu ) {
    let contexts = Editor.Selection.contexts('node');
    if ( contexts.length > 0 ) {
      referenceID = contexts[0];
    }
  } else {
    referenceID = Editor.Selection.curActivate('node');
  }

  // NOTE: this will prevent menu item pollution
  let menuTmpl = Editor.Menu.getMenu('create-node');
  Editor.Menu.walk( menuTmpl, item => {
    if ( item.params ) {
      item.params.push(referenceID);
      item.params.push(isSibling);
    }
  });

  return menuTmpl;
}

module.exports = {
  getContextTemplate: getContextTemplate,
  getCreateTemplate: getCreateTemplate,
};
