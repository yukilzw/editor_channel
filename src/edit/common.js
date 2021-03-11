/* eslint-disable no-loop-func */
/* eslint-disable complexity */
/**
 * @description 数据结构处理相关方法
 */
const EnumId = { root: 'root' };    // 画布id
const EnumEdit = {
    add: Symbol(),         // 插入
    choose: Symbol(),   // 选择
    drag: Symbol(),     // 拖拽（树组件内部，并非菜单）
    move: Symbol(),       // 移动
    change: Symbol(),   // 编辑
    delete: Symbol(),   // 删除
    hide: Symbol(),       // 隐藏
    ruler: Symbol(),       // 标尺
    maxKeyNum: Symbol()     // 首次加载计算当前页面配置key递增最大值
};

let maxKey;    // 记录全局生成的递增key(el)值

/**
 * 编辑器内各种操作(EnumEdit)，都是对当前json tree的修改，然后触发compile重新渲染视图
 * 此方法根据节点key(el)，搜索当前操作的目标节点的位置，根据不同的操作返回所需要的值
 * 考虑到日常搭建中组件嵌套层级不会过深，采用广度优先搜索
 * @param {Array<Config>} arr 页面配置tree
 * @param {String} el 要搜索的元素id
 * @param {EnumEdit} type 操作的枚举类型
 * @param {any} expand 拓展参数，不同操作类型入参不同
 */
const searchTree = (arr, el, type, expand) => {
    const root = {
        children: arr
    };
    const queue = [root];

    let maxKeyNum = 0;

    // 找到匹配元素后根据搜索类型返回对应数据结构
    while (queue.length > 0) {
        const config = queue.pop();
        const { children = [] } = config;

        for (let child of children) {
            if (child.el === el) {
                switch (type) {
                    case EnumEdit.hide:
                        if (child.hide) {
                            delete child.hide;
                        } else {
                            child.hide = true;
                        }
                        return arr;
                    case EnumEdit.choose:
                        return child;
                    case EnumEdit.change:
                        var { tabIndex, items } = expand;

                        items.forEach(({ key, value }) => {
                            if (tabIndex === 1) {
                                child.style[key] = value;
                            } else if (tabIndex === 2) {
                                child.props[key] = value;
                            }
                        });
                        return arr;
                    case EnumEdit.delete:
                        children.splice(children.indexOf(child), 1);
                        return [arr, child];
                    case EnumEdit.add:
                        rangeKey(expand);

                        if (!Array.isArray(child.children)) {
                            child.children = [];
                        }
                        child.children.push(expand);
                        return [arr, expand.el];
                    case EnumEdit.move:
                        var { length } = children;
                        var index = children.indexOf(child);
                        var [moveChild] = children.splice(index, 1);

                        children.splice(Math.min(Math.max(0, index + expand), length - 1), 0, moveChild);
                        return arr;
                    case EnumEdit.drag:
                        var { dragNodeObj, relaPos } = expand;

                        if (relaPos === 0) {
                            if (!Array.isArray(child.children)) {
                                child.children = [];
                            }
                            child.children.push(dragNodeObj);
                        } else if (relaPos === -1) {
                            children.splice(children.indexOf(child), 0, dragNodeObj);
                        } else if (relaPos === 1) {
                            children.splice(children.indexOf(child) + 1, 0, dragNodeObj);
                        }
                        return arr;
                    case EnumEdit.ruler:
                        return {
                            parent: config.el ? config : null,
                            brother: children.filter((brother) => brother !== child && !brother.hide)
                        };
                    default: return;
                }
            } else if (type === EnumEdit.maxKeyNum) {
                maxKeyNum = Math.max(maxKeyNum, Number(child.el.replace(/^wc/, '')));
            }
            queue.push(child);
        }
    }

    if (type === EnumEdit.maxKeyNum) {
        maxKey = maxKeyNum;
        return maxKeyNum;
    }
    return null;
};

/**
 * 插入前为片段树生成签名的el值(key)
 * @param {targeNode} target 目标节点数
 * @param {treeNode} node 要插入的节点
 */
const rangeKey = (node) => {
    const newKey = ++maxKey;

    Object.assign(node, { el: `wc${newKey}` });
    if (Array.isArray(node.children)) {
        node.children.forEach((child, i) => {
            rangeKey(child);
        });
    }
};

/**
 * 根据组件JSON配置生成组件片段树
 * @param {compConfigJSON} initConfig 目标节点对应菜单的静态JSON配置
 * @param {menu} menu 菜单数据
 */
const creatPart = (initConfig, menu) => {
    const config = JSON.parse(JSON.stringify(menu[initConfig.compName]));

    initConfig.defaultProps = Object.assign(config.defaultProps, { lazy: true }, initConfig.mergeProps);
    initConfig.defaultStyles = Object.assign(config.defaultStyles, initConfig.mergeStyles);
    Object.assign(config, initConfig);

    const { compName, defaultStyles, defaultProps, defaultChildren } = config;

    return {
        name: compName,
        style: defaultStyles,
        props: defaultProps,
        children: !Array.isArray(defaultChildren) ? undefined : defaultChildren.map((childConfig) => creatPart(childConfig, menu))
    };
};

/**
 * 获取当前元素距离某个祖先级元素的距离
 * @param {string} name 当前元素选择器
 * @param {string} targetMame 目标元素选择器
 */
const getOffsetWith = (name, targetMame = EnumId.root) => {
    const id = `#${name}`;
    const targetId = `#${targetMame}`;
    const offset = {
        top: 0,
        left: 0
    };
    if (id === targetId) {
        return offset;
    }
    let dom = document.querySelector(id);
    const targetDom = document.querySelector(targetId);
    while (dom.offsetParent !== targetDom) {
        offset.top += dom.offsetTop;
        offset.left += dom.offsetLeft;
        dom = dom.offsetParent;
    }
    offset.top += dom.offsetTop;
    offset.left += dom.offsetLeft;

    return offset;
};

export {
    EnumId,
    EnumEdit,
    searchTree,
    rangeKey,
    creatPart,
    getOffsetWith
};
