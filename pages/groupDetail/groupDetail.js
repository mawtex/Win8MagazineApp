(function () {
    "use strict";
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;
    ui.Pages.define("/pages/groupDetail/groupDetail.html", {
        _items: null,
        ready: function (element, options) {
            var listView = element.querySelector(".itemslist").winControl;
            var group = (options && options.groupKey) ? Data.resolveGroupReference(options.groupKey) : Data.groups.getAt(0);
            this._items = Data.getItemsFromGroup(group);
            var pageList = this._items.createGrouped(function groupKeySelector(item) {
                return group.key;
            }, function groupDataSelector(item) {
                return group;
            });
            element.querySelector("header[role=banner] .pagetitle").textContent = group.title;
            if(group.description == "") {
                element.querySelector(".groupdetailpage").className += " nodescription";
            } else {
                MSApp.execUnsafeLocalFunction(function () {
                    element.querySelector(".group-description").innerHTML = group.description;
                });
                listView.groupHeaderTemplate = element.querySelector(".headertemplate");
            }
            listView.itemDataSource = pageList.dataSource;
            listView.itemTemplate = element.querySelector(".itemtemplate");
            listView.groupDataSource = pageList.groups.dataSource;
            listView.oniteminvoked = this._itemInvoked.bind(this);
            this._initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
            listView.addEventListener("loadingstatechanged", function (e) {
                var images = document.getElementsByTagName('img');
                for(var i = 0; i < images.length; i++) {
                    var img = images[i];
                    img.style.display = (img.complete ? 'inherit' : 'none');
                }
            });
            if(group.backgroundImage != null) {
                var tmp = item;
                element.querySelector(".group-image").src = tmp.backgroundImage;
                element.querySelector(".group-image").alt = tmp.subtitle;
            } else {
                element.querySelector(".groupdetailpage").className += " noheaderimage";
                element.querySelector(".group-image").style.display = 'none';
            }
            listView.element.focus();
        },
        unload: function () {
            this._items.dispose();
        },
        updateLayout: function (element, viewState, lastViewState) {
            var listView = element.querySelector(".itemslist").winControl;
            if(lastViewState !== viewState) {
                if(lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    };
                    listView.addEventListener("contentanimating", handler, false);
                    var firstVisible = listView.indexOfFirstVisible;
                    this._initializeLayout(listView, viewState);
                    if(firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                }
            }
        },
        _initializeLayout: function (listView, viewState) {
            if(viewState === appViewState.snapped) {
                listView.layout = new ui.ListLayout();
            } else {
                listView.layout = new ui.GridLayout({
                    groupHeaderPosition: "left"
                });
            }
        },
        _itemInvoked: function (args) {
            var item = this._items.getAt(args.detail.itemIndex);
            WinJS.Navigation.navigate("/pages/itemDetail/itemDetail.html", {
                item: Data.getItemReference(item)
            });
        }
    });
})();
