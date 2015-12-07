var Shell = require('shell');

function getContextTemplate () {
    return [
        {
            label: 'Create',
            submenu: getCreateTemplate(true)
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Copy',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                Editor.sendToPanel('scene.panel', 'scene:copy-nodes', contexts);
            },
        },

        {
            label: 'Paste',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                Editor.sendToPanel('scene.panel', 'scene:paste-nodes', contexts.length > 0 ? contexts[0] : '');
            },
        },

        {
            label: 'Duplicate',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
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
            label: 'Rename',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                if ( contexts.length > 0 ) {
                    Editor.sendToPanel('hierarchy.panel', 'hierarchy:rename', contexts[0]);
                }
            },
        },

        {
            label: 'Delete',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
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
            label: 'Show Path',
            visible: Editor.isDev,
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                if ( contexts.length > 0 ) {
                    Editor.sendToPanel('hierarchy.panel', 'hierarchy:show-path', contexts[0]);
                }
            }
        },
    ];
}

function getCreateTemplate ( isContextMenu ) {
    var menuTmpl = Editor.menus['create-node'] || [];
    menuTmpl.unshift(
        {
            label: 'Create Empty',
            message: 'scene:create-node-by-classid',
            params: [
                'New Node', ''
            ],
        }
    );

    var position = isContextMenu ? 'child' : 'sibling';
    var referenceID;
    if ( isContextMenu ) {
        var contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
            referenceID = contexts[0];
        }
    } else {
        referenceID = Editor.Selection.curActivate('node');
    }

    // NOTE: this will prevent menu item pollution
    menuTmpl = JSON.parse(JSON.stringify(menuTmpl));
    menuTmpl = menuTmpl.map ( function ( item ) {
        if ( item.params ) {
            item.params.push(referenceID);
            item.params.push(position);
        }
        return item;
    });

    return menuTmpl;
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
