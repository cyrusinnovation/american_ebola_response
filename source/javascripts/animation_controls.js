function AnimationControls(ebola_chart_object)
{
	this.play_button = $('#play-button');
	this.next_button = $('#next-button');
	this.prev_button = $('#prev-button');
	this.ebola_chart = ebola_chart_object;

	this.play_button_class = function() {
		if (Infograph.animating) {
			return 'fa fa-pause fa-3x';
		}
		else {
			return 'fa fa-play fa-3x';
		}
	}

	this.play_button_padding = function() {
		if (Infograph.animating) {
			return '10px ' + (50 - 1.365) + 'px'
		}
		else {
			return '10px 50px'
		}
	}

	this.toggle_play = function() {
		this.toggle_animation_state();

		Infograph.animating = !Infograph.animating;
		d3.select('#play_pause_image')
			.attr('class', this.play_button_class());
		d3.select('#play-button')
			.style('padding', this.play_button_padding);
		this.play_button.blur();
	}

	this.toggle_animation_state = function() {
		if (Infograph.intervalId == null) {
			this.ebola_chart.animate_map();
		}
		else {
			clearInterval(Infograph.intervalId);
			Infograph.intervalId = null;
		}
	}

	this.pause_animation = function() {
		if (Infograph.animating) {
			clearInterval(Infograph.intervalId);
			Infograph.intervalId = null;
			Infograph.animating = false;

			d3.select('#play_pause_image')
				.attr('class', this.play_button_class());
			d3.select('#play-button')
				.style('padding', this.play_button_padding);
			this.play_button.blur();		
		}
	}

	this.next_step = function() {
		this.increment_step(Infograph.animating ? 0 : 1);
		this.pause_animation();
	}

	this.prev_step = function() {
		this.increment_step(Infograph.animating ? -2 : -1);
		this.pause_animation();
	}

	this.increment_step = function(increment) {
		this.ebola_chart.increment_current_date(increment);
		this.ebola_chart.update_map(Infograph.current_date_index);
	}

	this.play_button.click(function() { Infograph.animation_controls.toggle_play(); });
	this.next_button.click(function() { Infograph.animation_controls.next_step(); });
	this.prev_button.click(function() { Infograph.animation_controls.prev_step(); });
}