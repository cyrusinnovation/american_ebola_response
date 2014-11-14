function AnimationControls(ebola_chart_object)
{
	this.play_button = $('#play-button');
	this.chart_window = $('#ebola_chart');
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

	this.play_button_visibility = function() {
		if (Infograph.animating) {
			return 'hidden';
		}
		else {
			return 'visible';
		}
	}

	this.set_play_visibility = function() {
		d3.select('#play-button').
			style('visibility', this.play_button_visibility());		
	}

	this.toggle_play = function() {
		this.toggle_animation_state();

		Infograph.animating = !Infograph.animating;
		// d3.select('#play_pause_image')
		// 	.attr('class', this.play_button_class());
		// d3.select('#play-button')
		// 	.style('padding', this.play_button_padding);
		// this.play_button.blur();
		this.set_play_visibility();
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

			// d3.select('#play_pause_image')
			// 	.attr('class', this.play_button_class());
			// d3.select('#play-button')
			// 	.style('padding', this.play_button_padding);
			// this.play_button.blur();
			this.set_play_visibility();
		}
	}

	this.increment_step = function(increment) {
		this.ebola_chart.increment_current_date(increment);
		this.ebola_chart.update_map(Infograph.current_date_index);
	}

	this.center_button = function() {
		var W = this.chart_window.width();
		var H = this.chart_window.height();
		var button = this.play_button;
		var BtnW = button.outerWidth(true);
		var BtnH = button.outerHeight(true);
		console.log(button);
		console.log(BtnW);
		console.log(BtnH);
		var LeftOff = (W / 2) - (BtnW / 2);
		var TopOff = (H / 2) - (BtnH /2);
		d3.select('#play-button').style('left', LeftOff + 'px');
		d3.select('#play-button').style('top', TopOff + 'px');
	};

	var self = this;
	this.chart_window.click(function() { Infograph.animation_controls.toggle_play(); });
	d3.select(window).on('resize.animation-controls', function(d) { self.center_button(); });
	this.center_button();
	// d3.select(window).on('load.animation-controls', this.center_button);
}