var gameViewModel = function() {
    var self = this;
    self.count = ko.observable(0);
    self.timeLimitMax = 1000 * 60 * 2;
    self.timeLeft = self.timeLimitMax;
    
    self.timeUpdate = function() {
        var prevTime = root.timeLeft;
        self.timeLeft += 1000;
        if (self.timeLeft > self.timeLimitMax) {
            self.timeLeft = self.timeLimitMax;
        }
        $('#circle').circleProgress(
            {
                value:(1 - root.timeLeft / root.timeLimitMax), 
                animationStartValue:(1 - prevTime / root.timeLimitMax)
            }
        );
    }
    
}

var root = new gameViewModel();
$(document).ready(function() {
    console.log("TEST");
    ko.applyBindings(root);
    
    $('#circle').circleProgress({
        value: 0,
        size: Math.min($('#circle').width(), $('#circle').height()),
        startAngle: -Math.PI / 2,
        fill: {image: "/static/Img/LoadingRing.png"},
        animation:{ duration: 100} 
    });

    setInterval(function() {
        var prevTime = root.timeLeft;
        root.timeLeft -= 100;
        $('#circle').circleProgress(
            {
                value:(1 - root.timeLeft / root.timeLimitMax), 
                animationStartValue:(1 - prevTime / root.timeLimitMax)
            }
        );
    }, 100)
    
})