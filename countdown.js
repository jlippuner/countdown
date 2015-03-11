// options
var update_interval = 250.0;      // interval in ms to update display

var max_height_frac = 0.9;        // max fraction of the window hight the text
                                  // may use

var max_width_frac = 0.9;         // max fraction of the window width the text
                                  // may use

var time_up_msg = "Time's up!";   // message to appear when time is up


// internally used variables
var total_time = 0.0;             // total initial time in ms

var start_time;                   // the time when the timer was started

var interval_id = -1;             // id of the interval that is repeatedly
                                  // called (used to call clearInterval at the
                                  // end)

var client_height, client_width;  // height and width of the window


function set_text(text) {
  $("#time").text(text);

  var height = $("#time").height();
  var correction_fac = max_height_frac * client_height / height;

  var width = $("#time").width();
  var this_correction_fac = max_width_frac * client_width / width;
  if (this_correction_fac < correction_fac)
    correction_fac = this_correction_fac;

  // round to 0.05
  correction_fac = 0.05 * Math.trunc(correction_fac / 0.05);
  var font_size = correction_fac * parseInt($("#time").css('font-size'));
  $("#time").css({ fontSize: font_size + "px"});
}

function update_time() {
  var time_elapsed = Date.now() - start_time;
  var time_remaining = total_time - time_elapsed;
  var sec_remaining = Math.trunc(time_remaining * 0.001);

  if (sec_remaining <= 0.0) {
    clearInterval(interval_id)
    set_text(time_up_msg);
    return
  }

  var hr = Math.trunc(sec_remaining / 3600.0);
  sec_remaining -= hr * 3600.0;
  var min = Math.trunc(sec_remaining / 60.0);
  sec_remaining -= min * 60.0;
  var sec = Math.trunc(sec_remaining);

  hr_str = (total_time >= 3600.0 * 1000.0) ? hr + ":" : "";
  min_str = (min < 10 ? "0" + min : min) + ":";
  sec_str = sec < 10 ? "0" + sec : sec;

  set_text(hr_str + min_str + sec_str);
}

function start_countdown(duration) {
  total_time = duration * 1000.0;
  start_time = Date.now();
  update_time(); // update right now, not only after update_interval
  interval_id = setInterval(update_time, update_interval);
}

(function ($) {
  set_text("Scroll down to begin");
  start_countdown(10.0);
})(jQuery);

// update the height and font size of the start_count
function update_client_size() {
  client_height = $(window).height();
  client_width = $(window).width();
  $("#time_wrap").height(client_height + "px");
  set_text($("#time").text());
}

$(window).resize(function() {
  update_client_size();
});

$(window).ready(function() {
  update_client_size();
});
