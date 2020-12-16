/**
 * @description 编辑器组件树视图
 */
import React, { useContext, useCallback, useMemo } from 'react';
import storeContext from './model/context';
import { searchTree, EnumEdit } from './common';
import { Tree, message } from 'antd';
import style from './style/index.less';

const PageTree = ({
    handleClick, checkedKeysList, expandedKeys, triggerShowEl
}) => {
    const { state, dispatch, forceUpdate } = useContext(storeContext);
    const { choose, tree, menu } = state;

    // 选中某个节点
    const selectNode = useCallback(([el], e) => {
        handleClick(e.node.key);
        const selectCompDom = document.querySelector(`#${e.node.key}`);
        const paintingWrapDom =  document.querySelector(`.${style.paintingWrap}`);
        const nextScrollTop = selectCompDom.getBoundingClientRect().top - 50 - 30 + paintingWrapDom.scrollTop;

        paintingWrapDom.scrollTop = nextScrollTop;
    }, []);

    // 显示隐藏某个节点
    const checkNode = useCallback((_, e) => triggerShowEl(e.node.key), []);

    // 展开节点
    const expendNode = useCallback((_, e) => {
        const hasKey = expandedKeys.current.has(e.node.key);

        if (hasKey) {
            expandedKeys.current.delete(e.node.key);
        } else {
            expandedKeys.current.add(e.node.key);
        }
        expandedKeys.current = new Set(expandedKeys.current);
        forceUpdate();
    }, []);

    // 用于将页面原始tree字段映射为ANTD树组件所需字段
    const fixTreeKey = useCallback((children) => {
        for (let child of children) {
            child.key = child.el;
            child.title = state.menu[child.name].name + '(' + child.el.replace(/^wc/, '') + ')';
            if (!child.hide) {
                checkedKeysList.current.add(child.key);
            }

            delete child.el;
            delete child.name;
            delete child.props;
            delete child.style;
            if (Array.isArray(child.children) && child.children.length > 0) {
                fixTreeKey(child.children);
            } else {
                delete child.children;
            }
        }
    }, []);

    // 拖拽数组件移动节点
    const dropNodeTree = useCallback(({ dragNode, dropPosition, node }) => {
        const { key: dragNodeKey } = dragNode;
        const { pos: posStr, key: targetKey } = node;
        const posArr = posStr.split('-');
        const pos = Number(posArr[posArr.length - 1]);
        const relaPos = dropPosition - pos;
        const chooseNode = searchTree(tree, targetKey, EnumEdit.choose);

        if (relaPos === 0 && !menu[chooseNode.name].hasChild) {
            message.warn('目标位置不允许有子节点');
            return;
        }

        const [, dragNodeObj] = searchTree(tree, dragNodeKey, EnumEdit.delete);
        const nextTree = searchTree(tree, targetKey, EnumEdit.drag, {
            dragNodeObj, relaPos
        });

        dispatch({
            type: 'UPDATE_TREE',
            payload: nextTree
        });
    }, [tree, menu]);

    // 缓存树组件，如果没有涉及到影响树组件展示的状态更新，直接渲染缓存树组件
    const compTree = useMemo(() => {
        const treeData = JSON.parse(JSON.stringify(tree));

        checkedKeysList.current = new Set();
        fixTreeKey(treeData);

        return <Tree
            checkable
            checkStrictly
            checkedKeys={Array.from(checkedKeysList.current)}
            onCheck={checkNode}
            selectedKeys={choose && [choose]}
            onSelect={selectNode}
            expandedKeys={Array.from(expandedKeys.current)}
            onExpand={expendNode}
            draggable
            onDrop={dropNodeTree}
            treeData={treeData}
        />;
    }, [tree, choose, expandedKeys.current, checkedKeysList.current]);

    return compTree;
};

export default PageTree;