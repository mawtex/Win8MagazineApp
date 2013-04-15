(function () {
    "use strict";
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var nav = WinJS.Navigation;
    WinJS.Namespace.define("Application", {
        PageControlNavigator: WinJS.Class.define(function PageControlNavigator(element, options) {
            this._element = element || document.createElement("div");
            this._element.appendChild(this._createPageElement());
            this.home = options.home;
            this._lastViewstate = appView.value;
            nav.onnavigated = this._navigated.bind(this);
            window.onresize = this._resized.bind(this);
            document.body.onkeyup = this._keyupHandler.bind(this);
            document.body.onkeypress = this._keypressHandler.bind(this);
            document.body.onmspointerup = this._mspointerupHandler.bind(this);
            Application.navigator = this;
        }, {
            home: "",
            _element: null,
            _lastNavigationPromise: WinJS.Promise.as(),
            _lastViewstate: 0,
            pageControl: {
                get: function () {
                    return this.pageElement && this.pageElement.winControl;
                }
            },
            pageElement: {
                get: function () {
                    return this._element.firstElementChild;
                }
            },
            _createPageElement: function () {
                var element = document.createElement("div");
                element.style.width = "100%";
                element.style.height = "100%";
                return element;
            },
            _getAnimationElements: function () {
                if(this.pageControl && this.pageControl.getAnimationElements) {
                    return this.pageControl.getAnimationElements();
                }
                return this.pageElement;
            },
            _keypressHandler: function (args) {
                if(args.key === "Backspace") {
                    nav.back();
                }
            },
            _keyupHandler: function (args) {
                if((args.key === "Left" && args.altKey) || (args.key === "BrowserBack")) {
                    nav.back();
                } else if((args.key === "Right" && args.altKey) || (args.key === "BrowserForward")) {
                    nav.forward();
                }
            },
            _mspointerupHandler: function (args) {
                if(args.button === 3) {
                    nav.back();
                } else if(args.button === 4) {
                    nav.forward();
                }
            },
            _navigated: function (args) {
                var newElement = this._createPageElement();
                var parentedComplete;
                var parented = new WinJS.Promise(function (c) {
                    parentedComplete = c;
                });
                this._lastNavigationPromise.cancel();
                this._lastNavigationPromise = WinJS.Promise.timeout().then(function () {
                    return WinJS.UI.Pages.render(args.detail.location, newElement, args.detail.state, parented);
                }).then(function parentElement(control) {
                    var oldElement = this.pageElement;
                    if(oldElement.winControl && oldElement.winControl.unload) {
                        oldElement.winControl.unload();
                    }
                    this._element.appendChild(newElement);

                    // lifting the page specific class name up to body so we may influence parent sibling elements using css
                    var fragmentElements = newElement.getElementsByClassName("fragment");
                    if (fragmentElements.length > 0) {
                        var customFragmentClassName = fragmentElements[0].className.split("fragment").join("");
                        document.body.className = customFragmentClassName;
                    } else {
                        document.body.className = "";
                    }
                    
                    this._element.removeChild(oldElement);
                    oldElement.innerText = "";
                    this._updateBackButton();
                    parentedComplete();
                    WinJS.UI.Animation.enterPage(this._getAnimationElements()).done();
                }.bind(this));
                args.detail.setPromise(this._lastNavigationPromise);
            },
            _resized: function (args) {
                if(this.pageControl && this.pageControl.updateLayout) {
                    this.pageControl.updateLayout.call(this.pageControl, this.pageElement, appView.value, this._lastViewstate);
                }
                this._lastViewstate = appView.value;
            },
            _updateBackButton: function () {
                var backButton = this.pageElement.querySelector("header[role=banner] .win-backbutton");
                if(backButton) {
                    backButton.onclick = function () {
                        nav.back();
                    };
                    if(nav.canGoBack) {
                        backButton.removeAttribute("disabled");
                    } else {
                        backButton.setAttribute("disabled", "disabled");
                    }
                }
            }
        })
    });
})();
