/*
 *  Count down
 *
 *  Copyright (C) 2015 Jonas Lippuner (jonas@lippuner.ca)
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

// options
var time_up_msg = "Time's up!";   // message to appear when time is up

var ok_color = [0, 153, 0];       // colors of background when ok, first
var warn1_color = [217, 181, 0];  // warning, second warning
var warn2_color = [204, 0, 0];

var pause_color = [150, 150, 150]; // background when paused

var bad_input_color = [255, 77, 77]; // bad input text entry background color

var total_time = 12.0;            // total initial time in sec
var warn1_time = 5.0;             // time when first and second warning should
var warn2_time = 2.0;             // be displayed in sec

var update_interval = 50.0;       // interval in ms to update display

var max_height_frac = 0.64;       // max fraction of the window hight the text
                                  // may use

var max_width_frac = 0.9;         // max fraction of the window width the text
                                  // may use

// internally used global variables
var time_remaining;               // total time remaining in sec

var last_timer;                   // last Date.now(), time_remaining counts
                                  // since that time

var interval_id = -1;             // id of the interval that is repeatedly
                                  // called (used to call clearInterval at the
                                  // end)

var client_height, client_width;  // height and width of the window

var states = {                    // available states of the timer
  reset: 0,
  running: 1,
  paused: 2,
  finished: 3,
  configuring: 4
};

var state = states.reset;         // current state of the timer


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

function time_to_str(sec) {
  var hr = parseInt(Math.trunc(sec) / 3600);
  sec -= hr * 3600.0;
  var min = parseInt(Math.trunc(sec) / 60.0);
  sec -= min * 60.0;
  var sec = Math.trunc(sec);

  hr_str = (sec >= 3600.0 * 1000.0) ? hr + ":" : "";
  min_str = (min < 10 ? "0" + min : min) + ":";
  sec_str = sec < 10 ? "0" + sec : sec;

  return hr_str + min_str + sec_str;
}

function display_time(time_remaining) {
  if (time_remaining > warn1_time)
    $("body").css({ backgroundColor: "rgb(" + ok_color + ")" });
  else if (time_remaining > warn2_time)
    $("body").css({ backgroundColor: "rgb(" + warn1_color + ")" });
  else
    $("body").css({ backgroundColor: "rgb(" + warn2_color + ")" });

  if (time_remaining <= 0.0) {
    set_text(time_up_msg);
    $("#progressbar-value").css({ width: "100%" });
    return
  }

  var val = 100.0 * (total_time - time_remaining) / total_time;
  $("#progressbar-value").css({ width: val + "%" });
  set_text(time_to_str(time_remaining));
}

function update_time() {
  var now = Date.now()
  var time_elapsed = (now - last_timer) * 0.001; // convert from ms to s
  time_remaining -= time_elapsed;

  if (time_remaining <= 0.0) {
    clearInterval(interval_id);
    state = states.finished;
  }

  display_time(time_remaining);
  last_timer = now;
}

function pause() {
  clearInterval(interval_id);
  $("body").css({ backgroundColor: "rgb(" + pause_color + ")" });
  state = states.paused;
  set_help_text("Paused, press [space] to resume, press [r] to reset");
}

function resume() {
  last_timer = Date.now();
  state = states.running;
  set_help_text("");
  update_time(); // update right now, not only after update_interval
  interval_id = setInterval(update_time, update_interval);
}

function start_count_down() {
  time_remaining = total_time;
  resume();
}

function reset() {
  clearInterval(interval_id);
  state = states.reset;
  set_help_text("Press [space] to start count down, press [c] to set time");
  display_time(total_time);
}

function set_time_entries() {
  $("#total_time").val(time_to_str(total_time));
  $("#warn_1_time").val(time_to_str(warn1_time));
  $("#warn_2_time").val(time_to_str(warn2_time));
}

function set_config_input_visible(visible) {
  $("#total_time").prop("disabled", !visible);
  $("#warn_1_time").prop("disabled", !visible);
  $("#warn_2_time").prop("disabled", !visible);
  $("#set_config").prop("disabled", !visible);

  $("#config").css({ visibility: visible ? "visible" : "hidden" });

  if (!visible) {
    // prevent focus from staying on submit button, which would prevent [space]
    // from working
    $("html").focus();
  }
}

function enter_config_mode() {
  clearInterval(interval_id);
  state = states.configuring;
  set_help_text("Enter times below and click [Set times]");
  display_time(total_time);
  set_time_entries();
  set_config_input_visible(true);
}

function input_failure(entry) {
  set_help_text("Please enter times as HH:MM:SS or MM:SS");
  $(entry).css({ backgroundColor: "rgb(" + bad_input_color + ")" });
}

function convert_number(str) {
  var s = str.trim();
  var patt = new RegExp("^\\d+$");
  if (patt.test(s)) {
    return parseInt(s);
  } else {
    return -1;
  }
}

function read_time(entry) {
  var fs = $(entry).val().split(":");
  var hr_str, min_str, sec_str;
  if (fs.length == 2) {
    hr = 0;
    min = convert_number(fs[0]);
    sec = convert_number(fs[1]);
  } else if (fs.length == 3) {
    hr = convert_number(fs[0]);
    min = convert_number(fs[1]);
    sec = convert_number(fs[2]);
  } else {
    input_failure(entry);
    return -1.0;
  }

  if ((hr < 0) || (min < 0) || (sec < 0) || (min >= 60) || (sec >= 60)) {
    input_failure(entry);
    return -1.0;
  }

  $(entry).css({ backgroundColor: "white" });
  return hr * 3600.0 + min * 60.0 + sec;
}

function set_config() {
  var new_total_time = read_time("#total_time");
  var new_warn_1 = read_time("#warn_1_time");
  var new_warn_2 = read_time("#warn_2_time");

  if ((new_total_time < 0.0) || (new_warn_1 < 0.0) || (new_warn_2 < 0.0)) {
    // don't need to do anything, error message already displayed
    return
  }

  if (new_warn_1 > new_total_time) {
    set_help_text("Warn 1 time cannot be larger than total time");
    return
  }

  if (new_warn_2 > new_warn_1) {
    set_help_text("Warn 2 time cannot be larger than warn 1 time");
    return
  }

  total_time = new_total_time;
  warn1_time = new_warn_1;
  warn2_time = new_warn_2;

  set_config_input_visible(false);
  reset();
}

function handle_keypress(e) {
  if (state == states.configuring) {
    // don't capture any keys
    return
  }

  // capture space
  if (e.which == 32) {
    if (state == states.running) {
      pause();
    } else if (state == states.paused) {
      resume();
    } else if (state == states.reset) {
      start_count_down();
    } else if (state == states.finished) {
      reset();
    }

    // don't scroll down
    e.preventDefault();
  } else if ((e.which == 82) || (e.which == 114)) {
    // reset if paused or finished
    if ((state == states.paused) || (state == states.finished))
      reset();
  } else if ((e.which == 67) || (e.which == 99)) {
    // only start configuring if state is rest
    if (state == states.reset)
      enter_config_mode();
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
  $("#set_config").click(set_config);
  reset();
  set_time_entries();
  update_client_size();
  set_config_input_visible(false);
});

$("html").on("keydown", function(e) {
  handle_keypress(e);
});
