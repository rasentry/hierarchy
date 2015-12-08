'use strict';

Editor.require('app://editor/test-utils/renderer/init');

function setTree (tree, snapshot) {
  tree._lastSnapshot = null;
  Helper.recv('scene:reply-query-hierarchy', tree._queryID, '', snapshot);
}

describe('<editor-hierarchy>', function() {
  Helper.runPanel( 'hierarchy.panel' );

  it('should create elements when ready', function () {
    let panel = Helper.targetEL;
    let tree = panel.$.tree;

    setTree(tree, [
      {
        id: 0,
        name: '0',
        children: [
          {
            id: 1,
            name: '1',
            children: null
          }
        ]
      }
    ]);
    let roots = Polymer.dom(tree).children;
    expect(roots.length).to.be.equal(1);
    let root = roots[0];

    expect(Polymer.dom(root).parentNode).to.be.equal(tree);
    expect(root.name).to.be.equal('0');
    expect(root._userId).to.be.equal(0);

    let children = Polymer.dom(root).children;
    expect(children.length).to.be.equal(1);
    expect(children[0].name).to.be.equal('1');
    expect(children[0]._userId).to.be.equal(1);
    expect(Polymer.dom(children[0]).children.length).to.be.equal(0);
  });

  it('could move tree item downwards (total: 2)', function () {
    let panel = Helper.targetEL;
    let tree = panel.$.tree;

    setTree(tree, [
      {
        id: 0,
        name: '0',
        children: null
      },
      {
        id: 1,
        name: '1',
        children: null
      }
    ]);
    tree._applyCmds([
      {
        op: 'move',
        id: 0,
        index: 1,
        parentId: null
      }
    ]);

    let roots = Polymer.dom(tree).children;

    expect(roots.length).to.be.equal(2);

    let n0 = roots[0];
    let n1 = roots[1];

    expect(n0.name).to.be.equal('1');
    expect(n1.name).to.be.equal('0');
  });

  it('could move tree item downwards (total: 3)', function () {
    let panel = Helper.targetEL;
    let tree = panel.$.tree;

    setTree(tree, [
      {
        id: 0,
        name: '0',
        children: null
      },
      {
        id: 1,
        name: '1',
        children: null
      },
      {
        id: 2,
        name: '2',
        children: null
      }
    ]);
    tree._applyCmds([
      {
        op: 'move',
        id: 0,
        index: 1,
        parentId: null
      }
    ]);

    let roots = Polymer.dom(tree).children;

    expect(roots.length).to.be.equal(3);

    let n0 = roots[0];
    let n1 = roots[1];
    let n2 = roots[2];

    expect(n0.name).to.be.equal('1');
    expect(n1.name).to.be.equal('0');
    expect(n2.name).to.be.equal('2');
  });

  it('could move tree item upwards', function () {
    let panel = Helper.targetEL;
    let tree = panel.$.tree;

    setTree(tree, [
      {
        id: 0,
        name: '0',
        children: null
      },
      {
        id: 1,
        name: '1',
        children: null
      }
    ]);
    tree._applyCmds([
      {
        op: 'move',
        id: 1,
        index: 0,
        parentId: null
      }
    ]);

    let roots = Polymer.dom(tree).children;

    expect(roots.length).to.be.equal(2);

    let n0 = roots[0];
    let n1 = roots[1];

    expect(n0.name).to.be.equal('1');
    expect(n1.name).to.be.equal('0');
  });

  it.skip('should replace recursively', function () {
    let panel = Helper.targetEL;
    let tree = panel.$.tree;

    setTree(tree, [
      {
        id: 0,
        name: '0',
        children: [
          {
            id: 1,
            name: '1',
            children: null
          }
        ]
      }
    ]);
    tree._applyCmds([
      {
        op: 'replace',
        id: 0,
        node: {
          id: 1,
          name: '1',
          children: [
            {
              id: 0,
              name: '0',
              children: null
            }
          ]
        }
      }
    ]);

    let roots = Polymer.dom(tree).children;

    expect(roots.length).to.be.equal(1);

    let root = roots[0];

    expect(root.name).to.be.equal('1');
    expect(root._userId).to.be.equal(1);

    let children = Polymer.dom(root).children;

    expect(children.length).to.be.equal(1);

    expect(children[0].name).to.be.equal('0');
    expect(children[0]._userId).to.be.equal(0);
    expect(Polymer.dom(children[0]).children.length).to.be.equal(0);
  });
});
