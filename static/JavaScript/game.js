var gameViewModel = function() {
    var self = this;
    self.count = ko.observable(0);
}

var root = new gameViewModel();
$(document).ready(function() {
    console.log("TEST");
    ko.applyBindings(root);
})