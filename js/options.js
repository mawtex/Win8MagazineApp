(function () {
    "use strict";

    c1metro.setOptions(
        function () {
            c1metro.options = {
                appTitle: "Composite C1 Magazine App",                  // App title text
                dataHostUrl: "http://community.composite.net/",         // Host part of URL where data is downloaded from
                websiteUrl: "http://www.composite.net/",                // Your website URL
                privacyUrl: "http://www.composite.net/Privacy",         // Privacy URL - your app won't be accepted by MS if this is not in place 

                // Info to share (share charm) when not showing a content item with a url
                genericShareUrl: "http://www.composite.net/",
                genericShareTitle: "Composite C1",
                genericShareSubTitle: "Manage your content for web and devices with this awesome open source CMS...",

                // Cache setting / off-line mode messages
                cacheRefreshDelay: 1000,                                    // ms to wait before server is contacted to refresh cached groups/content
                contentRefreshFrequency: 600000,                            // ms to wait before we pull fresh content from the server - don't set too low (set 600000 or above)
                connectionProblemsTitle: "Running in off-line mode",
                connectionProblemsDetails: "The content server not available right now.",

                // Paths data is downloaded from - these are appended @dataHostUrl 
                dataGroupsPath: "appfeed/data/groups.ashx",
                dataContentPath: "appfeed/data/content.ashx"    
            };
        });
})();
