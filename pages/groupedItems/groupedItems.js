(function () {
    "use strict";
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;

    function FixImage(img) {
        var surplusWidth = img.width - img.parentElement.clientWidth;
        var surplusHeight = img.height - img.parentElement.clientHeight;
        img.style.marginTop = '-' + (surplusHeight * 0.3) + 'px';
        img.style.marginLeft = '-' + (surplusWidth * 0.3) + 'px';
        console.log(img.width)
    }
    

    ui.Pages.define("/pages/groupedItems/groupedItems.html", {
        navigateToGroup: function (key) {
            nav.navigate("/pages/groupDetail/groupDetail.html", {
                groupKey: key
            });
        },
        ready: function (element, options) {
            element.querySelector(".pagetitle").innerText = c1metro.options.appTitle;
            var listView = element.querySelector(".groupeditemslist").winControl;
            listView.groupHeaderTemplate = element.querySelector(".headertemplate");
            listView.itemTemplate = element.querySelector(".itemtemplate");
            listView.oniteminvoked = this._itemInvoked.bind(this);
            listView.addEventListener("keydown", function (e) {
                if(appView.value !== appViewState.snapped && e.ctrlKey && e.keyCode === WinJS.Utilities.Key.g && e.altKey) {
                    var data = listView.itemDataSource.list.getAt(listView.currentItem.index);
                    this.navigateToGroup(data.group.key);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }.bind(this), true);
            listView.addEventListener("loadingstatechanged", function (e) {
                if(appView.value != appViewState.snapped) {
                    var images = document.getElementsByTagName('img');
                    for(var i = 0; i < images.length; i++) {
                        var img = images[i];
                        img.addEventListener('load', function () { FixImage(this) }, false)
                        img.addEventListener('error', function () { this.style.display = 'none'; }, false)
                    }
                }
            });
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", shareDataRequested);
            this._initializeLayout(listView, appView.value);
            listView.element.focus();
        },
        unload: function () {
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", shareDataRequested);
        },
        updateLayout: function (element, viewState, lastViewState) {
            var listView = element.querySelector(".groupeditemslist").winControl;
            if(lastViewState !== viewState) {
                if(lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    };
                    listView.addEventListener("contentanimating", handler, false);
                    this._initializeLayout(listView, viewState);
                }
            }
        },
        _initializeLayout: function (listView, viewState) {
            if(viewState === appViewState.snapped) {
                listView.itemDataSource = Data.groups.dataSource;
                listView.groupDataSource = null;
                listView.layout = new ui.ListLayout();
            } else {
                listView.itemDataSource = Data.items.dataSource;
                listView.groupDataSource = Data.groups.dataSource;
                var grid = new ui.GridLayout({
                    groupHeaderPosition: "top"
                });
                listView.layout = grid;
            }
        },
        _itemInvoked: function (args) {
            if(appView.value === appViewState.snapped) {
                var group = Data.groups.getAt(args.detail.itemIndex);
                this.navigateToGroup(group.key);
            } else {
                var item = Data.items.getAt(args.detail.itemIndex);
                nav.navigate("/pages/itemDetail/itemDetail.html", {
                    item: Data.getItemReference(item)
                });
            }
        }
    });

    function shareDataRequested(e) {
        var request = e.request;
        var url = c1metro.options.genericShareUrl;
        request.data.properties.title = c1metro.options.genericShareTitle;
        request.data.properties.description = c1metro.options.genericShareSubTitle;
        try {
            request.data.setUri(new Windows.Foundation.Uri(url));
        } catch (ex) {
            var md = new Windows.UI.Popups.MessageDialog(ex, "Bad share URL");
            md.showAsync();
        }
    }
})();
