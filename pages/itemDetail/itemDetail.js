(function () {
    "use strict";

    var _item;

    WinJS.UI.Pages.define("/pages/itemDetail/itemDetail.html", {
        ready: function (element, options) {
            _item = options && options.item ? Data.resolveItemReference(options.item) : Data.items.getAt(0);
            element.querySelector(".titlearea .pagetitle").textContent = _item.title;
            element.querySelector("article .item-subtitle").textContent = _item.subtitle;
            var itemImage = element.querySelector("article .item-image");
            var itemContent = element.querySelector("article .item-content");
            if(_item.backgroundImage != null) {
                itemImage.src = _item.backgroundImage;
                itemImage.alt = _item.subtitle;
            } else {
                itemImage.style.display = 'none';
            }
            MSApp.execUnsafeLocalFunction(function () {
                itemContent.innerHTML = _item.content;
            });
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", shareDataRequested);
            var content = element.querySelector(".content");
            content.focus();
        },
        unload: function () {
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", shareDataRequested);
        }
    });

    function shareDataRequested(e) {
        var request = e.request;
        var url = (_item.url > "" ? _item.url : c1metro.options.genericShareUrl);
        request.data.properties.title = _item.title;
        request.data.properties.description = _item.subtitle;
        try  {
            request.data.setUri(new Windows.Foundation.Uri(url));
        } catch (ex) {
            var md = new Windows.UI.Popups.MessageDialog(ex, "Bad share URL");
            md.showAsync();
        }
    }
})();
