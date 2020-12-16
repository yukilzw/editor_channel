/**
 * @description 编辑器打包总入口
 */
import { Headers, DOMIN, hookMap } from './utils/global';
import React from 'react';
import ReactDom from 'react-dom';
import Board from './board';
import { searchTree, EnumEdit } from './common';
import App from './model/reducer';
import { message } from 'antd';
import { setTwoToneColor } from '@ant-design/icons';
import './style/antd.less';

setTwoToneColor('#ec78cf');

// 拉取当前页面的JSON配置、组件菜单后再渲染编辑器
Promise.all([
    fetch(DOMIN + '/loadPage', {
        method: 'POST',
        headers: Headers.json
    }).then(response => response.json()),
    fetch(DOMIN + '/getCompMenu', {
        method: 'POST',
        headers: Headers.json
    }).then(response => response.json())
]).then(([resPage, resMenu]) => {
    if (resPage.error !== 0) {
        message.error(resPage.msg);
        return;
    }
    if (resMenu.error !== 0) {
        message.error(resMenu.msg);
        return;
    }
    const { tree, hook, page, pid } = resPage.data;

    Object.assign(hookMap, hook);
    searchTree(tree, null, EnumEdit.maxKeyNum);
    ReactDom.render(
        <App
            tree={tree}
            page={page}
            pid={pid}
            menu={resMenu.data}
        >
            <Board />
        </App>
        , document.getElementById('edit')
    );
});
