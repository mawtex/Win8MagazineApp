(function () {
    "use strict";
    var dataPromises = [];
    var services;
    var groups = new WinJS.Binding.List();
    var list = new WinJS.Binding.List();
    var cachedGroupsFilepath = "groups-cached.json";
    //new Windows.Foundation.Uri("ms-appx:///resources/groups-cached.json");
    var cachedContentFilepath = "content-cached.json";
    //new Windows.Foundation.Uri("ms-appx:///resources/content-cached.json");
    var localFolder = Windows.Storage.ApplicationData.current.localFolder;
    var fileIO = Windows.Storage.FileIO;
    var commonWarningHandler = function (error) {
        if(error.message != undefined) {
            console.warn(error.message);
        } else if(error.statusText != undefined) {
            console.warn(error.statusText);
        } else {
            console.warn(error);
        }
    };
    var commonErrorHandler = function (error) {
        if (error==null) {
            return;
        }

        if(Object.prototype.toString.call(error) === '[object Array]') {
            for(var i = 0; i < error.length; i++) {
                commonErrorHandler(error[i]);
            }
        } else if(error.message != undefined) {
            console.error(error.message);
        } else if(error.statusText != undefined) {
            console.error(error.statusText);
        } else {
            console.error(error);
        }
    };
    var connectionErrorMsgPopped = false;

    var connectionErrorHandler = function (error) {
        if(connectionErrorMsgPopped) {
            return;
        }
        connectionErrorMsgPopped = true;
        var md = new Windows.UI.Popups.MessageDialog(c1metro.options.connectionProblemsDetails, c1metro.options.connectionProblemsTitle);
        md.showAsync();
    };

    loadFromCache(cachedGroupsFilepath, function (content) {
        if(content > "") {
            LoadGroupsFromJSON(content);
        }
    }).then(function () {
        loadFromCache(cachedContentFilepath, function (content) {
            if(content > "") {
                LoadContentFromJSON(content);
            }
        });
    }).then(function () {
        WinJS.Promise.timeout(c1metro.options.cacheRefreshDelay).then(function () {
            getContentItems();
        });
    });

    var groupedItems = list.createGrouped(function groupKeySelector(item) {
        if (item == null || item.group == null) return null;
        return item.group.key;
    }, function groupDataSelector(item) {
        return item.group;
    });

    WinJS.Namespace.define("Data", {
        items: groupedItems,
        groups: groupedItems.groups,
        getItemReference: getItemReference,
        getItemsFromGroup: getItemsFromGroup,
        resolveGroupReference: resolveGroupReference,
        resolveItemReference: resolveItemReference
    });

    function LoadGroupsFromJSON(jsonString) {
        var jsonArray = JSON.parse(jsonString);
        var buildupList = new WinJS.Binding.List();
        while(groups.length > 0) {
            groups.pop();
        }
        jsonArray.forEach(function (jsonElement) {
            var group = {
                key: jsonElement.Key,
                title: jsonElement.Title,
                subtitle: jsonElement.SubTitle,
                groupViewBackgroundImage: makeAbsoluteImgUrl(jsonElement.GroupViewImage),
                backgroundImage: makeAbsoluteImgUrl(jsonElement.Image),
                description: getBodyContent(jsonElement.Description)
            };
            buildupList.push(group);
        });
        buildupList.reverse();
        while(groups.length > 0) {
            groups.pop();
        }
        while(buildupList.length > 0) {
            groups.push(buildupList.pop());
        }
    }
    function LoadContentFromJSON(jsonString) {
        var jsonArray = JSON.parse(jsonString);
        var buildupList = new WinJS.Binding.List();
        jsonArray.forEach(function (jsonElement) {
            var item = {
                group: groups.filter(function (group) {
                    return group.key == jsonElement.GroupKey;
                })[0],
                title: jsonElement.Title,
                subtitle: jsonElement.SubTitle,
                groupViewBackgroundImage: makeAbsoluteImgUrl(jsonElement.GroupViewImage),
                backgroundImage: makeAbsoluteImgUrl(jsonElement.Image),
                description: getBodyContent(jsonElement.Description),
                content: getBodyContent(jsonElement.Description),
                url: jsonElement.Url
            };
            buildupList.push(item);
        });
        buildupList.reverse();
        while(list.length > 0) {
            list.pop();
        }
        while(buildupList.length > 0) {
            list.push(buildupList.pop());
        }
    }
    function loadFromCache(cachePath, contentHandler) {
        return localFolder.getFileAsync(cachePath).then(function (file) {
            return fileIO.readTextAsync(file).then(function (content) {
                contentHandler(content);
            }, commonWarningHandler);
        }, commonWarningHandler);
    }
    function saveToCache(cachePath, content) {
        return localFolder.createFileAsync(cachePath, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
            var writeText = fileIO.writeTextAsync(file, content);
            writeText.then(function () {
            }, commonWarningHandler);
        }, commonWarningHandler);
    }


    var groupsJson = null;

    function getContentItems() {
        getServices().then(function () {
            services.filter(isContentGroup).forEach(function (service) {
                service.dataPromise.then(function (serviceResponse) {
                    if (serviceResponse.status == 200) {
                        groupsJson = serviceResponse.responseText;
                        console.log("Successfully loaded groups from content host");
                    }
                }, commonWarningHandler);
            });
            services.filter(isContent).forEach(function (service) {
                service.dataPromise.then(function (serviceResponse) {
                    if(serviceResponse.status == 200) {
                        LoadGroupsFromJSON(groupsJson);
                        saveToCache(cachedGroupsFilepath, groupsJson);
                        LoadContentFromJSON(serviceResponse.responseText);
                        saveToCache(cachedContentFilepath, serviceResponse.responseText);
                        console.log("Successfully loaded content from content host");
                    }
                }, commonWarningHandler);
            });
        });
        WinJS.Promise.timeout(c1metro.options.contentRefreshFrequency).then(function () {
            getContentItems();
        });
    }



    function makeAbsoluteImgUrl(url) {
        if(url == null || url == "") {
            return null;
        }
        if(url.indexOf('://') > -1) {
            return url;
        }
        url += "";
        if(url.indexOf(':') > -1 && url.indexOf('/') == -1) {
            return c1metro.options.dataHostUrl + "Renderers/ShowMedia.ashx?id=" + url;
        }
        if (url.indexOf('/') == 0) url = url.substring(1);
        return c1metro.options.dataHostUrl + url.split('~/').join('');
    }


    function makeAbsoluteUrl(url) {
        if (url == null || url == "") {
            return null;
        }
        if (url.indexOf('://') > -1) {
            return url;
        }
        url += "";
        if (url.indexOf('/') == 0) url = url.substring(1);
        return c1metro.options.dataHostUrl + url.split('~/').join('');
    }


    function getBodyContent(html) {
        if(html == null || html.length < 1) {
            return "";
        }
        var parser = new DOMParser();
        var xhtml = parser.parseFromString(html, "text/html");
        var imageNodes = xhtml.querySelectorAll("img");
        for(var i = 0; i < imageNodes.length; i++) {
            var src = imageNodes[i].attributes["src"];
            src.value = makeAbsoluteImgUrl(src.value);
        }
        var linkNodes = xhtml.querySelectorAll("[href]");
        for (var i = 0; i < linkNodes.length; i++) {
            var href = linkNodes[i].attributes["href"];
            href.value = makeAbsoluteUrl(href.value);
        }
        var otherSrcNodes = xhtml.querySelectorAll("[src]");
        for (var i = 0; i < otherSrcNodes.length; i++) {
            var src = otherSrcNodes[i].attributes["src"];
            src.value = makeAbsoluteUrl(src.value);
        }
        var html = xhtml.head.innerHTML + xhtml.body.innerHTML;

        // issue: felf-closing <script /> and IE really hate each other
        var matches = html.match(/<script[^>]+src\="[^>]+>/gi);
        if (matches != null)
            for(var i = 0; i < matches.length; i++)
            {
                html = html.replace(matches[i],matches[i].replace(">", "></script>"));
            }
        return html;
    }
    function isContentGroup(service) {
        return service.type == "contentgroup";
    }
    function isContent(service) {
        return service.type == "content";
    }
    function getServices() {
        services = [
            {
                key: "content1",
                type: "content",
                url: c1metro.options.dataHostUrl + c1metro.options.dataContentPath,
                rootUrl: c1metro.options.dataHostUrl,
                acquireContent: acquireContent,
                dataPromise: null
            }, 
            {
                key: "contentgroup1",
                type: "contentgroup",
                url: c1metro.options.dataHostUrl + c1metro.options.dataGroupsPath,
                rootUrl: c1metro.options.dataHostUrl,
                acquireContent: acquireContent,
                dataPromise: null
            }
        ];
        services.forEach(function (service) {
            service.dataPromise = service.acquireContent(service.url);
            dataPromises.push(service.dataPromise);
        });
        return WinJS.Promise.join(dataPromises).then(function () {
            return services;
        }, function (error) {
            commonErrorHandler(error);
            connectionErrorHandler(error);
        });
    }
    function acquireContent(url) {
        return WinJS.xhr({
            url: url,
            headers: {
                "If-Modified-Since": "Tue, 30 May 1972 00:00:00 GMT"
            }
        });
    }
    function getItemReference(item) {
        return [
            item.group.key, 
            item.title
        ];
    }
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) {
            return item.group.key === group.key;
        });
    }
    function resolveGroupReference(key) {
        for(var i = 0; i < groupedItems.groups.length; i++) {
            if(groupedItems.groups.getAt(i).key === key) {
                return groupedItems.groups.getAt(i);
            }
        }
    }
    function resolveItemReference(reference) {
        for(var i = 0; i < groupedItems.length; i++) {
            var item = groupedItems.getAt(i);
            if(item.group.key === reference[0] && item.title === reference[1]) {
                return item;
            }
        }
    }
})();
