(() => {
  'use strict';

  Editor.registerPanel( 'hierarchy.panel', {
    properties: {
      searchPattern: {
        type: String,
        value: '',
        observer: '_onSearchPatternChanged'
      },
    },

    listeners: {
      'update-scene-failed': 'disconnectScene',
      'tree-changed': '_onTreeChanged',
    },

    ready () {
      this.waitForSceneReady();
      Editor.waitForReply( 'scene:is-ready', ready => {
        if ( ready ) {
          this.connectScene();
        }
      }, -1);
    },

    focusOnSearch ( event ) {
      if ( event ) {
        event.stopPropagation();
      }

      this.$.search.setFocus();
    },

    selectPrev ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      this.curView().selectPrev(false);
    },

    selectNext ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      this.curView().selectNext(false);
    },

    shiftSelectPrev ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      this.curView().selectPrev(true);
    },

    shiftSelectNext ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      this.curView().selectNext(true);
    },

    foldCurrent ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let activeEL = this.$.tree._activeElement;
      if ( activeEL ) {
        if ( activeEL.foldable && !activeEL.folded ) {
          activeEL.folded = true;
        }
      }
    },

    foldupCurrent ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let activeEL = this.$.tree._activeElement;
      if ( activeEL ) {
        if ( activeEL.foldable && activeEL.folded ) {
          activeEL.folded = false;
        }
      }
    },

    renameCurrentSelected ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      if ( this.curView()._activeElement ) {
        this.curView().rename(this.curView()._activeElement);
      }
    },

    deleteCurrentSelected ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let ids = Editor.Selection.curSelection('node');
      Editor.sendToPanel( 'scene.panel', 'scene:delete-nodes', ids);
    },

    duplicateCurrentSelected ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let ids = Editor.Selection.curSelection('node');
      Editor.sendToPanel('scene.panel', 'scene:duplicate-nodes', ids);
    },

    copyCurrentSelected ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let ids = Editor.Selection.curSelection('node');
      Editor.sendToPanel('scene.panel', 'scene:copy-nodes', ids);
    },

    pasteIntoActive ( event ) {
      if ( event ) {
        event.stopPropagation();
        event.preventDefault();
      }

      let id = Editor.Selection.curActivate('node');
      Editor.sendToPanel('scene.panel', 'scene:paste-nodes', id);
    },

    curView () {
      if (!this.$.searchResult.hidden) {
        return this.$.searchResult;
      }
      return this.$.tree;
    },

    'selection:selected' ( type, ids ) {
      if ( type !== 'node' )
        return;

      ids.forEach(id => {
        this.$.tree.selectItemById(id);
        this.$.tree.expand(id, true);
        if (!this.$.searchResult.hidden) {
          this.$.searchResult.selectItemById(id);
        }
      });
    },

    'selection:unselected' ( type, ids ) {
      if ( type !== 'node' )
        return;

      ids.forEach(id => {
        this.$.tree.unselectItemById(id);
        if (!this.$.searchResult.hidden) {
          this.$.searchResult.unselectItemById(id);
        }
      });
    },

    'selection:activated' ( type, id ) {
      if ( type !== 'node' )
        return;

      this.curView().activeItemById(id);
    },

    'selection:deactivated' ( type, id ) {
      if ( type !== 'node' )
        return;

      this.curView().deactiveItemById(id);
    },

    'selection:hoverin' ( type, id ) {
      if ( type !== 'node' )
        return;

      this.curView().hoverinItemById(id);
    },

    'selection:hoverout' ( type, id ) {
      if ( type !== 'node' )
        return;

      this.curView().hoveroutItemById(id);
    },

    'scene:ready' () {
      this.connectScene();
    },

    'scene:reloading' () {
      this.waitForSceneReady();
    },

    'scene:reply-query-hierarchy' ( queryID, sceneID, nodes ) {
      if ( this._queryID !== queryID ) {
        return;
      }

      this.$.tree._updateSceneGraph(queryID, sceneID, nodes);
      this._queryHierarchyAfter(100);
    },

    'hierarchy:hint' ( uuid ) {
      this.$.tree.hintItemById(uuid);
    },

    'hierarchy:rename' ( id ) {
      let el = this.$.tree._id2el[id];
      if ( el ) {
        this.$.tree.rename(el);
      }
    },

    'hierarchy:delete' ( ids ) {
      Editor.Selection.unselect('node', ids, true);
      Editor.sendToPanel( 'scene.panel', 'scene:delete-nodes', ids);
    },

    'hierarchy:duplicate' ( ids ) {
      Editor.sendToPanel('scene.panel', 'scene:duplicate-nodes', ids);
    },

    'hierarchy:show-path' ( id ) {
      Editor.info( 'Path: %s, ID: %s', id, this.$.tree.getPathByID(id) );
    },

    waitForSceneReady () {
      this.$.loader.hidden = false;
      this.connectState = 'waiting';
    },

    connectScene () {
      if ( this.connectState === 'connected') {
        return;
      }

      this.$.loader.hidden = true;
      this.connectState = 'connected';

      this._queryHierarchyAfter(0);
    },

    disconnectScene () {
      if ( this._queryID ) {
        this.cancelAsync(this._queryID);
        this._queryID = null;
      }

      this.connectState = 'disconnected';
    },

    _queryHierarchyAfter ( timeout ) {
      if ( this._queryID ) {
        this.cancelAsync(this._queryID);
        this._queryID = null;
      }

      let id = this.async(() => {
        Editor.sendToPanel('scene.panel', 'scene:query-hierarchy', id );
      }, timeout );
      this._queryID = id;
    },

    _connectClass ( connectState ) {
      switch (connectState) {
        case 'waiting': return 'fa fa-link waiting';
        case 'connected': return 'fa fa-link';
        case 'disconnected': return 'fa fa-unlink';
      }
      return 'fa fa-unlink';
    },

    _onStateClick ( event ) {
      event.stopPropagation();
      this.connectScene();
    },

    _onCreateClick () {
      let rect = this.$.createBtn.getBoundingClientRect();
      Editor.sendToCore('hierarchy:popup-create-menu', rect.left, rect.bottom + 5, Editor.requireIpcEvent);
    },

    _onSearchPatternChanged () {
      this.$.searchResult.filter(this.searchPattern, this.$.tree._id2el);

      if (this.searchPattern) {
        this.$.searchResult.hidden = false;
        this.$.tree.hidden = true;

        return;
      }

      this.$.searchResult.hidden = true;
      this.$.searchResult.clear();
      this.$.tree.hidden = false;
    },

    _onTreeChanged () {
      if (!this.$.searchResult.hidden) {
        this.$.searchResult.filter(this.searchPattern, this.$.tree._id2el);
      }
    },
  });
})();
