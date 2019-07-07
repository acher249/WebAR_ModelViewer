/*
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { property } from 'lit-element';
import { IS_ANDROID, IS_AR_QUICKLOOK_CANDIDATE, IS_IOS, IS_IOS_CHROME, IS_IOS_SAFARI, IS_WEBXR_AR_CANDIDATE } from '../constants.js';
import { enumerationDeserializer } from '../conversions.js';
import { $container, $renderer, $scene } from '../model-viewer-base.js';
import { deserializeUrl } from '../utilities.js';
/**
 * Takes a URL to a USDZ file and sets the appropriate fields so that Safari
 * iOS can intent to their AR Quick Look.
 */
export const openIOSARQuickLook = (() => {
    const anchor = document.createElement('a');
    anchor.setAttribute('rel', 'ar');
    anchor.appendChild(document.createElement('img'));
    return (usdzSrc) => {
        anchor.setAttribute('href', usdzSrc);
        anchor.click();
    };
})();
export const openARViewer = (() => {
    const anchor = document.createElement('a');
    const noArViewerSigil = '#model-viewer-no-ar-fallback';
    let fallbackInvoked = false;
    return (gltfSrc, title) => {
        // If the fallback has ever been invoked this session, bounce early:
        if (fallbackInvoked) {
            return;
        }
        const location = self.location.toString();
        const locationUrl = new URL(location);
        const modelUrl = new URL(gltfSrc);
        const link = encodeURIComponent(location);
        const scheme = modelUrl.protocol.replace(':', '');
        locationUrl.hash = noArViewerSigil;
        title = encodeURIComponent(title);
        modelUrl.protocol = 'intent://';
        const intent = `${modelUrl.toString()}?link=${link}&title=${title}#Intent;scheme=${scheme};package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(locationUrl.toString())};end;`;
        const undoHashChange = () => {
            if (self.location.hash === noArViewerSigil && !fallbackInvoked) {
                fallbackInvoked = true;
                // The new history will be the current URL with a new hash.
                // Go back one step so that we reset to the expected URL.
                // NOTE(cdata): this should not invoke any browser-level navigation
                // because hash-only changes modify the URL in-place without
                // navigating:
                self.history.back();
            }
        };
        self.addEventListener('hashchange', undoHashChange, { once: true });
        anchor.setAttribute('href', intent);
        anchor.click();
    };
})();
const deserializeQuickLookBrowsers = enumerationDeserializer(['safari', 'chrome']);
const ARMode = {
    QUICK_LOOK: 'quick-look',
    AR_VIEWER: 'ar-viewer',
    UNSTABLE_WEBXR: 'unstable-webxr',
    NONE: 'none'
};
const $exitFullscreenButtonContainer = Symbol('exitFullscreenButtonContainer');
const $arButtonContainer = Symbol('arButtonContainer');
const $defaultExitFullscreenButton = Symbol('defaultExitFullscreenButton');
const $enterARWithWebXR = Symbol('enterARWithWebXR');
const $canActivateAR = Symbol('canActivateAR');
const $arMode = Symbol('arMode');
const $canLaunchQuickLook = Symbol('canLaunchQuickLook');
const $quickLookBrowsers = Symbol('quickLookBrowsers');
const $arButtonContainerClickHandler = Symbol('arButtonContainerClickHandler');
const $onARButtonContainerClick = Symbol('onARButtonContainerClick');
const $exitFullscreenButtonContainerClickHandler = Symbol('exitFullscreenButtonContainerClickHandler');
const $onExitFullscreenButtonClick = Symbol('onExitFullscreenButtonClick');
const $fullscreenchangeHandler = Symbol('fullscreenHandler');
const $onFullscreenchange = Symbol('onFullscreen');
export const ARMixin = (ModelViewerElement) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    class ARModelViewerElement extends ModelViewerElement {
        constructor() {
            super(...arguments);
            this.ar = false;
            this.unstableWebxr = false;
            this.iosSrc = null;
            this.quickLookBrowsers = 'safari';
            this[_a] = false;
            // TODO: Add this to the shadow root as part of this mixin's
            // implementation:
            this[_b] = this.shadowRoot.querySelector('.ar-button');
            this[_c] = this.shadowRoot.querySelector('.slot.exit-fullscreen-button');
            this[_d] = this.shadowRoot.querySelector('#default-exit-fullscreen-button');
            this[_e] = (event) => this[$onARButtonContainerClick](event);
            this[_f] = () => this[$onExitFullscreenButtonClick]();
            this[_g] = () => this[$onFullscreenchange]();
            this[_h] = ARMode.NONE;
            this[_j] = new Set();
        }
        get canActivateAR() {
            return this[$arMode] !== ARMode.NONE;
        }
        /**
         * Activates AR. Note that for any mode that is not WebXR-based, this
         * method most likely has to be called synchronous from a user
         * interaction handler. Otherwise, attempts to activate modes that
         * require user interaction will most likely be ignored.
         */
        async activateAR() {
            switch (this[$arMode]) {
                case ARMode.QUICK_LOOK:
                    openIOSARQuickLook(this.iosSrc);
                    break;
                case ARMode.UNSTABLE_WEBXR:
                    await this[$enterARWithWebXR]();
                    break;
                case ARMode.AR_VIEWER:
                    this.requestFullscreen();
                    openARViewer(this.src, this.alt || '');
                    break;
                default:
                    console.warn('No AR Mode can be activated. This is probably due to missing \
configuration or device capabilities');
                    break;
            }
        }
        connectedCallback() {
            super.connectedCallback();
            document.addEventListener('fullscreenchange', this[$fullscreenchangeHandler]);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            document.removeEventListener('fullscreenchange', this[$fullscreenchangeHandler]);
        }
        [(_a = $canActivateAR, _b = $arButtonContainer, _c = $exitFullscreenButtonContainer, _d = $defaultExitFullscreenButton, _e = $arButtonContainerClickHandler, _f = $exitFullscreenButtonContainerClickHandler, _g = $fullscreenchangeHandler, _h = $arMode, _j = $quickLookBrowsers, $onExitFullscreenButtonClick)]() {
            if (document.fullscreenElement === this) {
                document.exitFullscreen();
            }
        }
        [$onFullscreenchange]() {
            const renderer = this[$renderer];
            const scene = this[$scene];
            const isFullscreen = document.fullscreenElement === this;
            if (isFullscreen) {
                this[$container].classList.add('fullscreen');
            }
            else {
                this[$container].classList.remove('fullscreen');
            }
            if (document.fullscreenElement !== this &&
                renderer.presentedScene === scene) {
                try {
                    renderer.stopPresenting();
                }
                catch (error) {
                    console.warn('Unexpected error while stopping AR presentation');
                    console.error(error);
                }
            }
        }
        async [$enterARWithWebXR]() {
            const renderer = this[$renderer];
            console.log('Attempting to enter fullscreen and present in AR...');
            try {
                const enterFullscreen = this.requestFullscreen();
                try {
                    const outputElement = await renderer.present(this[$scene]);
                    this.shadowRoot.appendChild(outputElement);
                    await enterFullscreen;
                }
                catch (error) {
                    console.warn('Error while trying to present to AR');
                    console.error(error);
                    await enterFullscreen;
                    if (document.fullscreenElement === this) {
                        console.warn('Exiting fullscreen under dire circumstances');
                        document.exitFullscreen();
                    }
                }
            }
            catch (error) {
                console.error(error);
                console.warn('AR will not activate without fullscreen permission');
            }
        }
        async update(changedProperties) {
            super.update(changedProperties);
            if (changedProperties.has('quickLookBrowsers')) {
                this[$quickLookBrowsers] =
                    deserializeQuickLookBrowsers(this.quickLookBrowsers);
            }
            if (!changedProperties.has('unstableWebxr') &&
                !changedProperties.has('iosSrc') &&
                !changedProperties.has('ar') && !changedProperties.has('src') &&
                !changedProperties.has('alt')) {
                return;
            }
            const renderer = this[$renderer];
            const unstableWebxrCandidate = this.unstableWebxr &&
                IS_WEBXR_AR_CANDIDATE && await renderer.supportsPresentation();
            const arViewerCandidate = IS_ANDROID && this.ar;
            const iosQuickLookCandidate = IS_IOS && IS_AR_QUICKLOOK_CANDIDATE &&
                this[$canLaunchQuickLook] && !!this.iosSrc;
            const showArButton = unstableWebxrCandidate || arViewerCandidate ||
                iosQuickLookCandidate;
            if (unstableWebxrCandidate) {
                this[$arMode] = ARMode.UNSTABLE_WEBXR;
            }
            else if (arViewerCandidate) {
                this[$arMode] = ARMode.AR_VIEWER;
            }
            else if (iosQuickLookCandidate) {
                this[$arMode] = ARMode.QUICK_LOOK;
            }
            else {
                this[$arMode] = ARMode.NONE;
            }
            if (showArButton) {
                this[$arButtonContainer].classList.add('enabled');
                this[$arButtonContainer].addEventListener('click', this[$arButtonContainerClickHandler]);
                this[$exitFullscreenButtonContainer].addEventListener('click', this[$exitFullscreenButtonContainerClickHandler]);
            }
            else {
                this[$arButtonContainer].removeEventListener('click', this[$arButtonContainerClickHandler]);
                this[$exitFullscreenButtonContainer].removeEventListener('click', this[$exitFullscreenButtonContainerClickHandler]);
                this[$arButtonContainer].classList.remove('enabled');
            }
        }
        [$onARButtonContainerClick](event) {
            event.preventDefault();
            this.activateAR();
        }
        get [$canLaunchQuickLook]() {
            if (IS_IOS_CHROME) {
                return this[$quickLookBrowsers].has('chrome');
            }
            else if (IS_IOS_SAFARI) {
                return this[$quickLookBrowsers].has('safari');
            }
            return false;
        }
    }
    __decorate([
        property({ type: Boolean, attribute: 'ar' })
    ], ARModelViewerElement.prototype, "ar", void 0);
    __decorate([
        property({ type: Boolean, attribute: 'unstable-webxr' })
    ], ARModelViewerElement.prototype, "unstableWebxr", void 0);
    __decorate([
        property({ converter: { fromAttribute: deserializeUrl }, attribute: 'ios-src' })
    ], ARModelViewerElement.prototype, "iosSrc", void 0);
    __decorate([
        property({ type: String, attribute: 'quick-look-browsers' })
    ], ARModelViewerElement.prototype, "quickLookBrowsers", void 0);
    return ARModelViewerElement;
};
//# sourceMappingURL=ar.js.map