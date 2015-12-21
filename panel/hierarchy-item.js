(() => {
  'use strict';

  Editor.registerElement({

    hostAttributes: {
      draggable: 'true',
    },

    properties: {
      // basic

      foldable: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true,
      },

      folded: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true,
      },

      selected: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true,
      },

      name: {
        type: String,
        value: '',
      },

      // advance

      type: {
        type: String,
        value: '',
      },

      hovering: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      highlighted: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      invalid: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      deactivated: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      prefab: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
    },

    listeners: {
      'mousedown': '_onMouseDown',
      'click': '_onClick',
      'dblclick': '_onDblClick',
    },

    ready () {
      this._renaming = false;
      this._userId = '';
    },

    //

    _nameClass ( name ) {
      if ( !name ) {
        return 'no-name';
      }
      return 'name';
    },

    _nameText ( name ) {
      if ( !name ) {
        return 'No Name';
      }
      return name;
    },

    _foldIconClass ( folded ) {
      if ( folded ) {
        return 'fa fa-caret-right';
      }

      return 'fa fa-caret-down';
    },

    // events

    _onMouseDown ( event ) {
      if ( event.which !== 1 ) {
        return;
      }

      event.stopPropagation();

      if ( this._renaming ) {
        return;
      }

      let shift = false;
      let toggle = false;

      if ( event.shiftKey ) {
        shift = true;
      } else if ( event.metaKey || event.ctrlKey ) {
        toggle = true;
      }

      this.fire('item-selecting', {
        toggle: toggle,
        shift: shift,
      });

    },

    _onClick ( event ) {
      if ( event.which !== 1 ) {
        return;
      }

      event.stopPropagation();

      let shift = false;
      let toggle = false;

      if ( event.shiftKey ) {
        shift = true;
      } else if ( event.metaKey || event.ctrlKey ) {
        toggle = true;
      }

      this.fire('item-select', {
        toggle: toggle,
        shift: shift,
      });
    },

    _onDblClick ( event ) {
      if ( event.which !== 1 ) {
        return;
      }

      if ( event.shiftKey || event.metaKey || event.ctrlKey ) {
        return;
      }

      clearTimeout ( this._nameClickID );
      event.stopPropagation();

      // TODO:
      // console.log('edit asset %s', this.name);
      // this.fire('open');
    },

    _onNameClick () {
      let selection = Editor.Selection.curSelection('node');
      if (
        Editor.Selection.confirmed('node') &&
        selection.length === 1 &&
        selection[0] === this._userId
      ) {
        event.stopPropagation();

        this._nameClickID = setTimeout(() => {
          this._nameClickID = null;
          this.fire('item-rename');
        }, 300);
      }
    },

    _onFoldMouseDown ( event ) {
      event.stopPropagation();
    },

    _onFoldClick ( event ) {
      event.stopPropagation();

      if ( event.which !== 1 ) {
        return;
      }

      this.folded = !this.folded;
    },

    _onFoldDblClick ( event ) {
      event.stopPropagation();
    },

    _onMouseEnter ( event ) {
      event.stopPropagation();

      Editor.Selection.hover( 'node', this._userId );
    },

    _onMouseLeave ( event ) {
      event.stopPropagation();

      Editor.Selection.hover( 'node', null);
    },

    hint ( color, duration ) {
      color = color || 'white';
      duration = duration || 1000;

      let computedStyle = window.getComputedStyle(this.$.bar);
      this.$.bar.animate([
        { background: color, transform: 'scale(1.2)' },
        { background: computedStyle.backgroundColor, transform: 'scale(1)' }
      ], {
        duration: duration
      });
    },
  });

})();
