var socketContainer =  function() {
    var self = this;
    
    // the socket.io documentation recommends sending an explicit package upon connection
    // this is specially important when using the global namespace
    self.socket = io.connect('http://54.152.72.255' + ':80');
    
    self.socket.on('connect info', function(msg) {
        //msg.demon_percent (Val 0-1) The current position of the demon's counter
        //msg.demon_rate (val: 0-1) Rate the demon is counting down by, per second
        //msg.demon_time () Time of current demon game
        //msg.high_score
        root.updateDemon(msg);
        
    })
    
    self.socket.on('demon stats', function(msg) {
        //msg.demon_percent (Val 0-1) The current position of the demon's counter
        //msg.demon_rate (val: 0-1) Rate the demon is counting down by, per second
        //msg.demon_time () Time of current demon game
        //msg.high_score
        console.info("DEMON STATS");
        root.updateDemon(msg);
    })
    
    self.sendClick = function(click_power) {
        console.info("PUSHED BUTTON");
        self.socket.emit('push button', {percent_increase:click_power});
    }
    
}

var gameViewModel = function() {
    var self = this;
    self.game_socket = new socketContainer();
    self.demon_percent = 0;
    self.demon_rate = 0;
    self.demon_time = 0;
    self.cur_click_power = 1;
    self.click_power_mod = 0.1
    
    self.percentUpdate = function(new_percent) {
        var prev_percent = self.demon_percent;
        self.demon_percent = new_percent;
        $('#circle').circleProgress(
            {
                value:(self.demon_percent), 
                animationStartValue:(prev_percent),
            }
        );
    }
    
    self.updateDemon = function(demon_stats) {
        self.demon_rate = demon_stats.demon_rate;
        self.demon_time = demon_stats.demon_time;
        self.percentUpdate(demon_stats.demon_percent);
    }
    
    self.castRitual = function() {
        self.game_socket.sendClick(self.cur_click_power * self.click_power_mod);
        self.cur_click_power = self.cur_click_power / 2;
        if(self.cur_click_power < 0.1) {
            self.cur_click_power = 0.1
        }
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
        //animation: false
    });

    setInterval(function() {
        var prev_percent = root.demon_percent;
        root.demon_percent += root.demon_rate / 10;
        $('#circle').circleProgress(
            {
                value:(root.demon_percent), 
                animationStartValue:(prev_percent)
            }
        );
    }, 80)
    
})
