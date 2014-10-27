var play_button = $('#play-button');
var next_button = $('#next-button');
var prev_button = $('#prev-button');

play_button.click(toggle_play);
next_button.click(next_step);
prev_button.click(prev_step);

function play_button_class() {
	if (Infograph.animating) {
		return 'fa fa-pause fa-3x';
	}
	else {
		return 'fa fa-play fa-3x';
	}
}

function play_button_padding() {
	if (Infograph.animating) {
		return '10px ' + (50 - 1.365) + 'px'
	}
	else {
		return '10px 50px'
	}
}

function toggle_play() {
	toggle_animation_state();

	Infograph.animating = !Infograph.animating;
	d3.select('#play_pause_image')
		.attr('class', play_button_class());
	d3.select('#play-button')
		.style('padding', play_button_padding);
	play_button.blur();
}

function toggle_animation_state() {
	if (Infograph.intervalId == null) {
		animate_map();
	}
	else {
		clearInterval(Infograph.intervalId);
		Infograph.intervalId = null;
	}
}

function pause_animation() {
	if (Infograph.animating) {
		clearInterval(Infograph.intervalId);
		Infograph.intervalId = null;
		Infograph.animating = false;

		d3.select('#play_pause_image')
			.attr('class', play_button_class());
		d3.select('#play-button')
			.style('padding', play_button_padding);
		play_button.blur();		
	}
}

function next_step() {
	increment_step(Infograph.animating ? 0 : 1);
	pause_animation();
}

function prev_step() {
	increment_step(Infograph.animating ? -2 : -1);
	pause_animation();
}

function increment_step(increment) {
	increment_current_date(increment);
	update_map(Infograph.current_date_index);
}
