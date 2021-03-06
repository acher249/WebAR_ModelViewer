import { deserializeUrl } from '../utilities.js';
export const elementFromLocalPoint = (document, x, y) => {
    const host = (document === window.document) ?
        window.document.body :
        document.host;
    const actualDocument = window.ShadyCSS ? window.document : document;
    const boundingRect = host.getBoundingClientRect();
    return actualDocument.elementFromPoint(boundingRect.left + x, boundingRect.top + y);
};
export const pickShadowDescendant = (element, x = 0, y = 0) => {
    return element.shadowRoot != null ?
        elementFromLocalPoint(element.shadowRoot, x, y) :
        null;
};
export const timePasses = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
export const until = async (predicate) => {
    while (!predicate()) {
        await timePasses();
    }
};
export const rafPasses = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
/**
 * Takes a texture and an object and returns a boolean indicating
 * if whether or not the texture's userData matches the fields
 * defined on the `meta` object.
 *
 * @param {THREE.Texture}
 * @param {Object}
 * @return {boolean}
 */
export const textureMatchesMeta = (texture, meta) => !!(texture && texture.userData &&
    Object.keys(meta).reduce((matches, key) => {
        return matches && meta[key] === texture.userData[key];
    }, true));
/**
 * @param {EventTarget|EventDispatcher} target
 * @param {string} eventName
 * @param {?Function} predicate
 */
export const waitForEvent = (target, eventName, predicate = null) => new Promise(resolve => {
    function handler(event) {
        if (!predicate || predicate(event)) {
            resolve(event);
            target.removeEventListener(eventName, handler);
        }
    }
    target.addEventListener(eventName, handler);
});
/**
 * Dispatch a synthetic event on a given element with a given type, and
 * optionally with custom event properties. Returns the dispatched event.
 *
 * @param {HTMLElement} element
 * @param {type} string
 * @param {*} properties
 */
export const dispatchSyntheticEvent = (target, type, properties = {
    clientX: 0,
    clientY: 0,
    deltaY: 1.0
}) => {
    const event = new CustomEvent(type, { cancelable: true, bubbles: true });
    Object.assign(event, properties);
    target.dispatchEvent(event);
    return event;
};
export const ASSETS_DIRECTORY = '../examples/assets/';
/**
 * Returns the full path for an asset by name. This is a convenience helper so
 * that we don't need to change paths throughout all test suites if we ever
 * decide to move files around.
 *
 * @param {string} name
 * @return {string}
 */
export const assetPath = (name) => deserializeUrl(`${ASSETS_DIRECTORY}${name}`);
/**
 * Returns true if the given element is in the tree of the document of the
 * current frame.
 *
 * @param {HTMLElement} element
 * @return {boolean}
 */
export const isInDocumentTree = (node) => {
    let root = node.getRootNode();
    while (root !== node && root != null) {
        if (root.nodeType === Node.DOCUMENT_NODE) {
            return root === document;
        }
        root = root.host && root.host.getRootNode();
    }
    return false;
};
//# sourceMappingURL=helpers.js.map