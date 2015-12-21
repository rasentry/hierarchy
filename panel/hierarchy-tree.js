(() => {
  'use strict';

  const Path = require('fire-path');

  // HACK: packages://hierarchy/utils/tree-diff will lead to a Ipc.sendSync blocking problem
  //       so I change it to app:// which will not lead to any Remote function
  const treeDiff = Editor.require('app://builtin/hierarchy/utils/tree-diff');

  Editor.registerElement({

    behaviors: [EditorUI.focusable, EditorUI.droppable, EditorUI.idtree],

    hostAttributes: {
      'droppable': 'asset,node',
    },

    listeners: {
      'focus': '_onFocus',
      'blur': '_onBlur',
      'mousedown': '_onMouseDown',
      'contextmenu': '_onContextMenu',
      'dragstart': '_onDragStart',
      'dragend': '_onDragEnd',
      'dragover': '_onDragOver',
      'drop-area-enter': '_onDropAreaEnter',
      'drop-area-leave': '_onDropAreaLeave',
      'drop-area-accept': '_onDropAreaAccept',
      'item-selecting': '_onItemSelecting',
      'item-select': '_onItemSelect',
      'item-rename': '_onItemRename',
    },

    properties: {
    },

    ready () {
      this._shiftStartElement = null;
      this._lastSnapshot = null;
      this._states = {};
      this._sceneID = '';
      this._filterText = '';

      this._initFocusable(this);
      this._initDroppable(this);
    },

    filter ( pattern, _id2el ) {
      this._filterText = pattern;

      if (!pattern) {
        return;
      }

      let items = [];
      for ( let item in _id2el ) {
        items.push(_id2el[item]);
      }

      this.clear();

      pattern = pattern.toLowerCase();
      items.forEach(el => {
        if (el.name.toLowerCase().indexOf(pattern) > -1) {
          let newEL = document.createElement('hierarchy-item');

          this.addItem(this, newEL, {
            id: el.id,
            name: el.name,
            folded: false,
            prefab: el.prefab,
            deactivated: el.deactivated,
          });
        }
      });
    },

    rename ( element ) {
      let treeBCR = this.getBoundingClientRect();
      let elBCR = element.getBoundingClientRect();
      let offsetTop = elBCR.top - treeBCR.top - 1;
      let offsetLeft = elBCR.left - treeBCR.left + 10 - 4;

      this.$.nameInput.style.top = (this.$.content.scrollTop + offsetTop) + 'px';
      this.$.nameInput.style.left = offsetLeft + 'px';
      this.$.nameInput.style.width = 'calc(100% - ' + offsetLeft + 'px)';

      this.$.nameInput.hidden = false;
      this.$.nameInput.value = element.name;
      this.$.nameInput.focus();
      this.$.nameInput._renamingEL = element;
      window.requestAnimationFrame(() => {
        this.$.nameInput.select();
      });
    },

    hoverinItemById ( id ) {
      let itemEL = this._id2el[id];
      if ( itemEL ) {
        itemEL.hovering = true;
      }
    },

    hoveroutItemById ( id ) {
      let itemEL = this._id2el[id];
      if ( itemEL ) {
        itemEL.hovering = false;
      }
    },

    select ( itemEL ) {
      Editor.Selection.select( 'node', itemEL._userId, true, true );
    },

    clearSelection () {
      Editor.Selection.clear('node');
      this._activeElement = null;
      this._shiftStartElement = null;
    },

    selectPrev ( shiftSelect ) {
      if ( !this._activeElement ) {
        return;
      }

      let prev = this.prevItem(this._activeElement);
      if ( !prev ) {
        return;
      }

      if (prev === this._activeElement) {
        return;
      }

      if ( shiftSelect ) {
        if (this._shiftStartElement === null) {
          this._shiftStartElement = this._activeElement;
        }

        let userIds = this._getShiftSelects(prev);
        Editor.Selection.select( 'node', userIds, true, true );
      } else {
        this._shiftStartElement = null;
        Editor.Selection.select( 'node', prev._userId, true, true );
      }

      this.activeItem(prev);

      window.requestAnimationFrame(() => {
        if ( prev.offsetTop <= this.$.content.scrollTop ) {
          this.$.content.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
        }
      });
    },

    selectNext ( shiftSelect ) {
      if ( !this._activeElement ) {
        return;
      }

      let next = this.nextItem(this._activeElement, false);
      if ( !next ) {
        return;
      }

      if ( next === this._activeElement ) {
        return;
      }

      if ( shiftSelect ) {
        if (this._shiftStartElement === null) {
          this._shiftStartElement = this._activeElement;
        }

        let userIds = this._getShiftSelects(next);
        Editor.Selection.select( 'node', userIds, true, true );
      } else {
        this._shiftStartElement = null;
        Editor.Selection.select( 'node', next._userId, true, true );
      }

      this.activeItem(next);

      window.requestAnimationFrame(() => {
        let headerHeight = next.$.header.offsetHeight;
        let contentHeight = this.offsetHeight - 3; // 2 for border, 1 for padding
        if ( next.offsetTop + headerHeight >= this.$.content.scrollTop + contentHeight ) {
          this.$.content.scrollTop = next.offsetTop + headerHeight - contentHeight;
        }
      });
    },

    getPath (element) {
      if ( !element ) {
        return '';
      }

      if ( element.tagName !== 'HIERARCHY-ITEM' ) {
        return '';
      }

      let path = element.name;
      let parentEL = Polymer.dom(element).parentNode;
      while (parentEL.tagName === 'HIERARCHY-ITEM') {
        path = Path.join(parentEL.name, path);
        parentEL = Polymer.dom(parentEL).parentNode;
      }
      return path;
    },

    getPathByID (id) {
      let el = this._id2el[id];
      return this.getPath(el);
    },

    // events

    _onItemSelecting ( event ) {
      event.stopPropagation();

      let targetEL = event.target;
      let shiftStartEL = this._shiftStartElement;
      this._shiftStartElement = null;

      if (event.detail.shift) {
        if (shiftStartEL === null) {
          this._shiftStartElement = this._activeElement;
        } else {
          this._shiftStartElement = shiftStartEL;
        }

        let userIds = this._getShiftSelects(targetEL);
        Editor.Selection.select( 'node', userIds, true, false );
      } else if ( event.detail.toggle ) {
        if ( targetEL.selected ) {
          Editor.Selection.unselect('node', targetEL._userId, false);
        } else {
          Editor.Selection.select('node', targetEL._userId, false, false);
        }
      } else {
        // if target already selected, do not unselect others
        if ( !targetEL.selected ) {
          Editor.Selection.select('node', targetEL._userId, true, false);
        }
      }
    },

    _onItemSelect ( event ) {
      event.stopPropagation();

      if ( event.detail.shift ) {
        Editor.Selection.confirm();
      } else if ( event.detail.toggle ) {
        Editor.Selection.confirm();
      } else {
        Editor.Selection.select( 'node', event.target._userId, true );
      }
    },

    _onItemRename ( event ) {
      this.rename(event.target);
    },

    _onMouseDown ( event ) {
      if ( event.which !== 1 ) {
        return;
      }

      event.stopPropagation();
      this.clearSelection();
    },

    _onContextMenu ( event ) {
      event.preventDefault();
      event.stopPropagation();

      let contextEL = Polymer.dom(event).localTarget;
      Editor.Selection.setContext('node',contextEL._userId);

      Editor.sendToCore(
        'hierarchy:popup-context-menu',
        event.clientX,
        event.clientY,
        Editor.requireIpcEvent
      );
    },

    _onScroll () {
      this.$.content.scrollLeft = 0;
    },

    // drag & drop

    _onDragStart ( event ) {
      event.stopPropagation();

      let selection = Editor.Selection.curSelection('node');
      EditorUI.DragDrop.start(
        event.dataTransfer,
        'copyMove',
        'node',
        selection.map(uuid => {
          let itemEL = this._id2el[uuid];
          return {
            id: uuid,
            name: itemEL.name,
            icon: itemEL.$.icon,
          };
        })
      );
    },

    _onDragEnd () {
      EditorUI.DragDrop.end();

      Editor.Selection.cancel();
      this._cancelHighligting();
      this._curInsertParentEL = null;
    },

    _onDragOver ( event ) {
      let dragType = EditorUI.DragDrop.type(event.dataTransfer);
      if ( dragType !== 'node' && dragType !== 'asset' ) {
        EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
        return;
      }

      //
      event.preventDefault();
      event.stopPropagation();

      //
      if ( event.target ) {
        let position;
        let bcr = this.getBoundingClientRect();
        let offsetY = event.clientY - bcr.top + this.$.content.scrollTop;

        let dragoverEL = Polymer.dom(event).localTarget;
        let insertParentEL = dragoverEL;
        let thisDOM = Polymer.dom(this);

        //
        if ( thisDOM.children.length === 0 ) {
          this._highlightInsert();
        } else {
          if ( dragoverEL === this ) {
            if ( offsetY <= thisDOM.firstElementChild.offsetTop ) {
              dragoverEL = thisDOM.firstElementChild;
            } else {
              dragoverEL = thisDOM.lastElementChild;
            }
          }

          // highlight insertion
          if ( offsetY <= (dragoverEL.offsetTop + dragoverEL.offsetHeight * 0.3) ) {
            position = 'before';
          } else if ( offsetY >= (dragoverEL.offsetTop + dragoverEL.offsetHeight * 0.7) ) {
            position = 'after';
          } else {
            position = 'inside';
          }

          if ( position === 'inside' ) {
            insertParentEL = dragoverEL;
          } else {
            insertParentEL = Polymer.dom(dragoverEL).parentNode;
          }

          //
          if ( insertParentEL !== this._curInsertParentEL ) {
            this._cancelHighligting();
            this._curInsertParentEL = insertParentEL;

            this._highlightBorder( insertParentEL );
          }
          this._highlightInsert( dragoverEL, insertParentEL, position );
        }

        //
        EditorUI.DragDrop.allowDrop(event.dataTransfer, true);
      }

      //
      let dropEffect = 'none';
      if ( dragType === 'asset' ) {
        dropEffect = 'copy';
      } else if ( dragType === 'node' ) {
        dropEffect = 'move';
      }
      EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
    },

    _onDropAreaEnter ( event ) {
      event.stopPropagation();
    },

    _onDropAreaLeave ( event ) {
      event.stopPropagation();

      this._cancelHighligting();
      this._curInsertParentEL = null;
    },

    _onDropAreaAccept ( event ) {
      event.stopPropagation();

      Editor.Selection.cancel();
      this._cancelHighligting();
      this._curInsertParentEL = null;

      //
      if ( event.detail.dragItems.length === 0 ) {
        return;
      }

      // get next sibling id
      let hoverEL = event.detail.dropTarget;
      let targetEL = null;
      let nextSiblingId = null;
      let bcr = this.getBoundingClientRect();
      let offsetY = event.detail.clientY - bcr.top + this.$.content.scrollTop;

      let thisDOM = Polymer.dom(this);
      let hoverDOM = Polymer.dom(hoverEL);

      if ( hoverEL === this ) {
        targetEL = null;
        if ( thisDOM.firstElementChild ) {
          if ( offsetY <= thisDOM.firstElementChild.offsetTop ) {
            nextSiblingId = thisDOM.firstElementChild._userId;
          }
        }
      } else {
        if ( offsetY <= (hoverEL.offsetTop + hoverEL.offsetHeight * 0.3) ) {
          nextSiblingId = hoverEL._userId;
          targetEL = hoverDOM.parentNode;
        } else if ( offsetY >= (hoverEL.offsetTop + hoverEL.offsetHeight * 0.7) ) {
          if ( hoverDOM.nextElementSibling ) {
            nextSiblingId = hoverDOM.nextElementSibling._userId;
          } else {
            nextSiblingId = null;
          }
          targetEL = hoverDOM.parentNode;
        } else {
          nextSiblingId = null;
          targetEL = hoverEL;
          if ( hoverDOM.firstElementChild ) {
            nextSiblingId = hoverDOM.firstElementChild._userId;
          }
        }
      }

      // if target is root, set it to null
      if ( targetEL === this ) {
        targetEL = null;
      }

      // expand the parent
      if ( targetEL ) {
        targetEL.folded = false;
      }

      // process drop
      if ( event.detail.dragType === 'node' ) {
        this._sortDraggingItems(event.detail.dragItems);
        Editor.sendToPanel(
          'scene.panel',
          'scene:move-nodes',
          event.detail.dragItems,
          targetEL ? targetEL._userId : null,
          nextSiblingId
        );
      } else if ( event.detail.dragType === 'asset' ) {
        this.setFocus();
        Editor.sendToPanel(
          'scene.panel',
          'scene:create-nodes-by-uuids',
          event.detail.dragItems,
          targetEL ? targetEL._userId : null
        );
      }
    },

    // rename events

    _onRenameMouseDown ( event ) {
      event.stopPropagation();
    },

    _onRenameKeyDown ( event ) {
      event.stopPropagation();
    },

    _onRenameValueChanged () {
      let targetEL = this.$.nameInput._renamingEL;
      if ( targetEL ) {
        Editor.sendToPanel('scene.panel', 'scene:set-property', {
          id: targetEL._userId,
          path: 'name',
          type: 'String',
          value: this.$.nameInput.value,
        });
        Editor.sendToPanel('scene.panel', 'scene:undo-commit');

        this.$.nameInput._renamingEL = null;
        this.$.nameInput.hidden = true;
      }
    },

    _onRenameFocusChanged ( event ) {
      if ( !this.$.nameInput._renamingEL ) {
        return;
      }

      this._renameFocused = event.detail.value;

      // NOTE: it is possible user mouse click on rename input,
      // which change the focused to false and then true again.
      setTimeout(() => {
        if ( !this._renameFocused ) {
          this.$.nameInput._renamingEL = null;
          this.$.nameInput.hidden = true;
        }
      },1);
    },

    // private methods

    _rebuild (nodes) {
      // clear all parents
      for ( let id in this._id2el ) {
        let itemEL = this._id2el[id];
        let parentEL = Polymer.dom(itemEL).parentNode;
        Polymer.dom(parentEL).removeChild(itemEL);
      }
      let id2el = this._id2el;
      this._id2el = {};

      // start building it
      try {
        this._build( nodes, id2el );
        id2el = null;
      } catch (err) {
        Editor.error( 'Failed to build hierarchy tree: %s', err.stack);
        this.fire('update-scene-failed');
      }
    },

    hintItemById ( id ) {
      this.expand( id, true );
      let itemEL = this._id2el[id];
      if (itemEL) {
        this.scrollToItem(itemEL);
        itemEL.hint();
      }
    },

    _hintNew ( el ) {
      window.requestAnimationFrame(() => {
        el.hint( 'green', 500 );
      });
    },

    _hintRename ( el ) {
      window.requestAnimationFrame(() => {
        el.hint( 'orange', 500 );
      });
    },

    _applyCmds (cmds) {
      let id2el = this._id2el;
      let el, node, beforeNode, newParent, newEL;

      for (let i = 0; i < cmds.length; i++) {
        let cmd = cmds[i];
        switch (cmd.op) {

          case 'append':
            node = cmd.node;
            newEL = this._newEntryRecursively(node, id2el);
            newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
            newParent.folded = false;

            this.addItem( newParent, newEL, {
              id: node.id,
              name: node.name,
              prefab: node.isPrefab,
              deactivated: !node.isActive,
              // canHaveChildren: node.canHaveChildren !== false,
            } );
            this._hintNew( newEL );
            break;

          case 'remove':
            this.removeItemById(cmd.id);
            break;

          //case 'replace':
          //  el = id2el[cmd.id];
          //  node = cmd.node;
          //  let isLeaf = Polymer.dom(el).childNodes === 0 && !node.children;
          //  if (isLeaf) {
          //    el.name = node.name;
          //
          //    delete id2el[cmd.id];
          //    el._userId = node.id;
          //    id2el[node.id] = el;
          //  }
          //  else {
          //    newParent = Polymer.dom(el).parentNode;
          //    this.removeItem(el);
          //    newEL = this._newEntryRecursively(node, id2el);
          //    this.addItem( newParent, newEL, {
          //      id: node.id,
          //      name: node.name
          //      canHaveChildren: node.canHaveChildren !== false,
          //    });
          //  }
          //  break;

          case 'set-property':
            if (cmd.property === 'name') {
              this.renameItemById(cmd.id, cmd.value);
              this._hintRename( this._id2el[cmd.id] );
            }
            else {
              el = id2el[cmd.id];
              if ( cmd.property === 'isPrefab' ) {
                el.prefab = cmd.value;
              } else if ( cmd.property === 'isActive' ) {
                el.deactivated = !cmd.value;
              }
            }
            break;

          case 'move':
            el = id2el[cmd.id];
            newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
            let siblings;
            if (newParent !== Polymer.dom(el).parentNode) {
              this.setItemParent(el, newParent);
              siblings = Polymer.dom(newParent).childNodes;
            }
            else {
              siblings = Polymer.dom(newParent).childNodes;
              if (siblings.indexOf(el) < cmd.index) {
                cmd.index += 1;   // before next one
              }
              if (cmd.index > siblings.length - 1) {
                Polymer.dom(newParent).appendChild(el);
                break;
              }
            }
            beforeNode = siblings[cmd.index];
            if (beforeNode && beforeNode !== el) {
              Polymer.dom(newParent).insertBefore(el, beforeNode);
            }
            break;

          case 'insert':
            node = cmd.node;
            newEL = this._newEntryRecursively(node, id2el);
            newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
            newParent.folded = false;
            this.addItem( newParent, newEL, {
              id: node.id,
              name: node.name,
              prefab: node.isPrefab,
              deactivated: !node.isActive,
              // canHaveChildren: node.canHaveChildren !== false,
            } );
            this._hintNew( newEL );
            beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
            if (beforeNode && beforeNode !== newEL) {
              Polymer.dom(newParent).insertBefore(newEL, beforeNode);
            }
            break;

          default:
            Editor.error('Unsupported operation', cmd.op);
            break;
        }
      }
    },

    _storeItemStates ( sceneID ) {
      this._states[sceneID] = this.dumpItemStates();
    },

    _restoreItemStates ( sceneID ) {
      // restore items states
      this.restoreItemStates(this._states[sceneID]);

      // restore selection
      this._syncSelection();
    },

    _updateSceneGraph ( queryID, sceneID, nodes ) {
      if ( !sceneID ) {
        sceneID = 'empty';
      }

      let diffResult = treeDiff(this._lastSnapshot, nodes);
      if ( !diffResult.equal ) {
        // store item states
        if ( this._sceneID ) {
          this._storeItemStates(this._sceneID);
        }

        // apply changes
        if (diffResult.cmds.length > 100) {
          this._rebuild(nodes);
          // console.log('rebuild');
        } else {
          this._applyCmds( diffResult.cmds );
        }
        this._lastSnapshot = nodes;

        // restore item states
        this._restoreItemStates(sceneID);

        this.fire('tree-changed');
      }

      this._sceneID = sceneID;
    },

    _build ( data, id2el ) {
      // console.time('hierarchy-tree._build()');
      data.forEach(entry => {
        var newEL = this._newEntryRecursively(entry, id2el);
        this.addItem( this, newEL, {
          id: entry.id,
          name: entry.name,
          prefab: entry.isPrefab,
          deactivated: !entry.isActive,
          // canHaveChildren: entry.canHaveChildren !== false,
        } );

        newEL.folded = false;
      });
      // console.timeEnd('hierarchy-tree._build()');

      // sync the selection
      this._syncSelection();
    },

    _newEntryRecursively ( entry, id2el ) {
      var el = id2el[entry.id];
      if ( !el ) {
        el = document.createElement('hierarchy-item');
      }

      if ( entry.children ) {
        entry.children.forEach(childEntry => {
          var childEL = this._newEntryRecursively(childEntry, id2el);
          this.addItem( el, childEL, {
            id: childEntry.id,
            name: childEntry.name,
            prefab: childEntry.isPrefab,
            deactivated: !childEntry.isActive,
            // canHaveChildren: childEntry.canHaveChildren !== false,
          } );
          // childEL.folded = false;
        });
      }

      return el;
    },

    _getShiftSelects ( targetEL ) {
      let el = this._shiftStartElement;
      let userIds = [];

      if (this._shiftStartElement !== targetEL) {
        if (this._shiftStartElement.offsetTop < targetEL.offsetTop) {
          while (el !== targetEL) {
            userIds.push(el._userId);
            el = this.nextItem(el);
          }
        } else {
          while (el !== targetEL) {
            userIds.push(el._userId);
            el = this.prevItem(el);
          }
        }
      }
      userIds.push(targetEL._userId);

      return userIds;
    },

    // highlighting

    _highlightBorder ( itemEL ) {
      if ( itemEL && itemEL.tagName === 'HIERARCHY-ITEM' ) {
        var style = this.$.highlightBorder.style;
        style.display = 'block';
        style.left = (itemEL.offsetLeft-2) + 'px';
        style.top = (itemEL.offsetTop-1) + 'px';
        style.width = (itemEL.offsetWidth+4) + 'px';
        style.height = (itemEL.offsetHeight+3) + 'px';

        //if ( !itemEL.canHaveChildren ) {
        //  itemEL.invalid = true;
        //  this.$.highlightBorder.setAttribute('invalid', '');
        //}

        itemEL.highlighted = true;
      } else {
        this.$.highlightBorder.style.display = 'none';
      }
    },

    _highlightInsert ( itemEL, parentEL, position ) {
      var style = this.$.insertLine.style;

      // insert at root
      if ( !itemEL ) {
        style.display = 'block';
        style.left = (this.offsetLeft-2) + 'px';
        style.width = (this.offsetWidth+4) + 'px';
        style.top = '0px';
        style.height = '0px';

        return;
      }

      //
      if ( position === 'inside' ) {
        var itemDOM = Polymer.dom(itemEL);
        if ( !itemEL.folded && itemDOM.firstElementChild ) {
          style.display = 'block';
          style.top = itemDOM.firstElementChild.offsetTop + 'px';
          style.left = itemDOM.firstElementChild.offsetLeft + 'px';
          style.width = itemDOM.firstElementChild.offsetWidth + 'px';
          style.height = '0px';
        }
        else {
          style.display = 'none';
        }
      }
      else {
        style.display = 'block';

        style.left = itemEL.offsetLeft + 'px';
        if ( position === 'before' )
          style.top = itemEL.offsetTop + 'px';
        else if ( position === 'after'  )
          style.top = (itemEL.offsetTop + itemEL.offsetHeight) + 'px';

        style.width = itemEL.offsetWidth + 'px';
        style.height = '0px';
      }
    },

    _cancelHighligting () {
      this.$.highlightBorder.style.display = 'none';
      this.$.highlightBorder.removeAttribute('invalid');

      this.$.insertLine.style.display = 'none';

      if (this._curInsertParentEL) {
        this._curInsertParentEL.invalid = false;
        this._curInsertParentEL.highlighted = false;
      }
    },

    //

    _sortDraggingItems (ids) {
      //console.log('before', ids);
      let id2el = this._id2el;
      ids.sort(function (lhs, rhs) {
        let itemA = id2el[lhs];
        let itemB = id2el[rhs];
        let itemADOM = Polymer.dom(itemA);
        let itemBDOM = Polymer.dom(itemB);
        let itemAParentDOM = Polymer.dom(itemADOM.parentNode);
        let itemBParentDOM = Polymer.dom(itemBDOM.parentNode);
        let indexA, indexB;
        if (itemAParentDOM === itemBParentDOM) {
          let siblings = itemAParentDOM.childNodes;
          indexA = Array.prototype.indexOf.call(siblings, itemA);
          indexB = Array.prototype.indexOf.call(siblings, itemB);
          return indexA - indexB;
        }
        else {

        }
      });
      //console.log('after', ids);
    },

    _syncSelection () {
      let ids = Editor.Selection.curSelection('node');
      ids.forEach(id => {
        this.selectItemById(id);
      });
      this.activeItemById(Editor.Selection.curActivate('node'));
    },
  });

})();
