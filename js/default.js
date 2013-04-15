(function () {
    "use strict";
    WinJS.Binding.optimizeBindingReferences = true;
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    app.addEventListener("activated", function (args) {
        if(args.detail.kind === activation.ActivationKind.launch) {
            if(args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            if(app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                if(nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));
        }
    });
    app.oncheckpoint = function (args) {
        app.sessionState.history = nav.history;
    };
    app.start();
})();
function onSettingsCommand(settingsCommand) {
    Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(c1metro.options.privacyUrl));
}
function onCommandsRequested(eventArgs) {
    eventArgs.request.applicationCommands.append(new Windows.UI.ApplicationSettings.SettingsCommand("privacyPolicyInBrowser", "Privacy Policy", onSettingsCommand));
}
var settingsPane = Windows.UI.ApplicationSettings.SettingsPane.getForCurrentView();
settingsPane.addEventListener("commandsrequested", onCommandsRequested);
