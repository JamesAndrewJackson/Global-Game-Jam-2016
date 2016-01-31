var socketContainer =  function() {
    var self = this;
    
    // the socket.io documentation recommends sending an explicit package upon connection
    // this is specially important when using the global namespace
    self.socket = io.connect('http://54.152.72.255' + ':80');
    self.socket.emit('connection');
    
    self.socket.on('connect info', function(msg) {
        //msg.demon_percent (Val 0-1) The current position of the demon's counter
        //msg.demon_rate (val: 0-1) Rate the demon is counting down by, per second
        //msg.demon_time () Time of current demon game
        //msg.high_score
        console.log("CONNECTION CONFIRMED");
        root.updateDemon(msg);
        
    })
    
    self.socket.on('demon stats', function(msg) {
        //msg.demon_percent (Val 0-1) The current position of the demon's counter
        //msg.demon_rate (val: 0-1) Rate the demon is counting down by, per second
        //msg.demon_time () Time of current demon game
        //msg.high_score
        //msg.push_times
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
    self.loading_img = new Image();
    self.loading_img.src = "/static/Img/LoadingRing.png";
    self.game_socket = new socketContainer();
    self.demon_percent = 0;
    self.demon_rate = 0;
    self.demon_time = ko.observable(0);
    self.best_time = ko.observable(0);
    self.cur_click_power = ko.observable(1);
    self.click_power_mod = 0.1
    self.isRumble = false;
    self.demon_show = false;
    self.game_start = ko.observable(false);
    self.game_end = ko.observable(false);
    self.push_times = ko.observable(0);
    
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
        self.demon_time(Math.round(parseFloat(demon_stats.demon_time * 10)) / 10);
        self.best_time(Math.round(parseFloat(demon_stats.high_score * 10)) / 10);
        self.percentUpdate(demon_stats.demon_percent);
        self.push_times(demon_stats.push_times);
    }
    
    self.castRitual = function() {
        self.game_socket.sendClick(self.cur_click_power() * self.click_power_mod);
        self.cur_click_power(self.cur_click_power() / 2);
        if(self.cur_click_power() < 0.1) {
            self.cur_click_power(0.1);
        }
    }
    
    
}

var root = new gameViewModel();
$(document).ready(function() {
    console.log("TEST");
    ko.applyBindings(root);
    var rumble1 = $('#circle');
    var rumble2 = $('#demon');
    
    rumble2.jrumble();
    rumble1.jrumble();
    
    $('#circle').circleProgress({
        value: 0,
        size: Math.min($('#circle').width(), $('#circle').height()),
        startAngle: -Math.PI / 2,
        fill: {image: root.loading_img},
        animation:{ duration: 100} 
        //animation: false
    });

    setInterval(function() {
        var prev_percent = root.demon_percent;
        if(prev_percent < 1) {
            if(!root.game_start()) {
                root.game_start(true);
            }
            root.demon_percent += root.demon_rate / 10;
            root.demon_time(Math.round((root.demon_time() + .1) * 10) / 10);
            if(prev_percent > 0.5 && !root.demon_show) {
                rumble2.finish().fadeToggle("slow")
                root.demon_show = (true);
            } else if (prev_percent <= 0.5 && root.demon_show) {
                rumble2.finish().fadeToggle("fast");
                root.demon_show = (false);
            }
            if(prev_percent > 0.75 && !root.isRumble) {
                rumble1.trigger('startRumble');
                rumble2.trigger('startRumble');
                root.isRumble = true;
            } else if (prev_percent <= 0.75 && root.isRumble) {
                rumble1.trigger('stopRumble')
                rumble2.trigger('stopRumble')
                root.isRumble = false;
            }
        } else if (root.game_start() && !root.game_end()) {
            root.game_end(true);
            var endText = $("#END");
            endText.jrumble();
            setTimeout(function(){
                endText.trigger('startRumble');
            }, 1500);
            setTimeout(function(){
                root.game_start(false);
                root.game_end(false);
                rumble1.trigger('stopRumble');
                rumble2.trigger('stopRumble');
                rumble2.hide();
                root.isRumble = false;
            }, 4000);
            
        }
        $('#circle').circleProgress(
            {
                value:(root.demon_percent), 
                animationStartValue:(prev_percent)
            }
        );
        root.cur_click_power(root.cur_click_power() + .02);
        if(root.cur_click_power() > 1) {
            root.cur_click_power(1);
        }
    }, 100)
    
    $(window).resize(function() {
        $('#circle').circleProgress(
            {
                size: Math.min($('#circle').width(), $('#circle').height()),
            }
        );
    })
})
