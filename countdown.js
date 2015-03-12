// options
var update_interval = 50.0;       // interval in ms to update display

var max_height_frac = 0.64;       // max fraction of the window hight the text
                                  // may use

var max_width_frac = 0.9;         // max fraction of the window width the text
                                  // may use

var time_up_msg = "Time's up!";   // message to appear when time is up

var warn1_time = 5.0;             // time when first and second warning should
var warn2_time = 2.0;             // be displayed

var ok_color = [0, 153, 0];       // colors of background when ok, first
var warn1_color = [217, 181, 0];  // warning, second warning
var warn2_color = [204, 0, 0];
var pause_color = [150, 150, 150];

// internally used variables
var total_time = 5.0 * 60.0 * 1000.0;  // total initial time in ms

var time_remaining;               // total time remaining in ms

var last_timer;                   // last Date.now(), time_remaining counts
                                  // since that time

var interval_id = -1;             // id of the interval that is repeatedly
                                  // called (used to call clearInterval at the
                                  // end)

var client_height, client_width;  // height and width of the window

var running = false;              // true if the countdown is running

var paused = false;               // true if the countdown is paused


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

function set_help_text(text) {
  $("#help_text").text(text);
}

function display_time(time_remaining) {
  var sec_remaining = time_remaining * 0.001;

  if (sec_remaining > warn1_time)
    $("#main_screen").css({ backgroundColor: "rgb(" + ok_color + ")" });
  else if (sec_remaining > warn2_time)
    $("#main_screen").css({ backgroundColor: "rgb(" + warn1_color + ")" });
  else
    $("#main_screen").css({ backgroundColor: "rgb(" + warn2_color + ")" });

  if (sec_remaining <= 0.0) {
    set_text(time_up_msg);
    $("#progressbar-value").css({ width: "100%"});
    return
  }

  var hr = parseInt(Math.trunc(sec_remaining) / 3600);
  sec_remaining -= hr * 3600.0;
  var min = parseInt(Math.trunc(sec_remaining) / 60.0);
  sec_remaining -= min * 60.0;
  var sec = Math.trunc(sec_remaining);

  hr_str = (total_time >= 3600.0 * 1000.0) ? hr + ":" : "";
  min_str = (min < 10 ? "0" + min : min) + ":";
  sec_str = sec < 10 ? "0" + sec : sec;

  set_text(hr_str + min_str + sec_str);
  var val = 100.0 * (total_time - time_remaining) / total_time;
  $("#progressbar-value").css({ width: val + "%"});
}

function update_time() {
  var now = Date.now()
  var time_elapsed = now - last_timer;
  time_remaining -= time_elapsed;

  if (time_remaining <= 0.0) {
    clearInterval(interval_id);
    running = false;
    paused = false;
  }

  display_time(time_remaining);
  last_timer = now;
}

function pause() {
  clearInterval(interval_id);
  $("#main_screen").css({ backgroundColor: "rgb(" + pause_color + ")" });
  running = false;
  paused = true;
  set_help_text("Paused, press [space] to resume");
}

function resume() {
  last_timer = Date.now();
  running = true;
  paused = false;
  set_help_text("");
  update_time(); // update right now, not only after update_interval
  interval_id = setInterval(update_time, update_interval);
}

function start_countdown() {
  time_remaining = total_time;
  resume();
}

function reset() {
  clearInterval(interval_id);
  running = false;
  paused = false;
  set_help_text("Press [space] to start countdown, scroll down to set time");
  display_time(total_time);
}

function handle_keypress(e) {
  // capture space
  if (e.which == 32) {
    if (running) {
      pause();
    } else if (paused) {
      resume();
    } else {
      start_countdown();
    }

    // don't scroll down
    e.preventDefault();
  } else if ((e.which == 82) || (e.which == 114)) {
    reset();
  }
}

// update the height and font size of the start_count
function update_client_size() {
  client_height = $(window).height();
  client_width = $(window).width();
  $("#main_screen").height(client_height + "px");
  set_text($("#time").text());
}

$(window).resize(function() {
  update_client_size();
});

$(window).ready(function() {
  reset();
  update_client_size();
});

$("html").on("keydown", function(e) {
  handle_keypress(e);
});
