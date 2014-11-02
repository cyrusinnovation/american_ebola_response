var Event = {};
Event.events = {
	event_list : {
		us_infection : [
			{date: '2014-09-30', description: 'Thomas Duncan is confirmed to have ebola'},
			{date: '2014-10-08', description: 'Thomas Duncan dies'},
			{date: '2014-10-11', description: 'Nurse Nina Pham tests positive for ebola'},
			{date: '2014-10-15', description: 'Nurse Amber Vinson tests positive for ebola'},
			{date: '2014-10-23', description: 'Doctor Craig Spencer tests positive for ebola'}
		],

		us_imported: [
			{date: '2014-08-02', description: 'Aid worker and missionary arrive for treatment'},
			{date: '2014-09-05', description: 'A doctor arrives for ebola treatment'},
			{date: '2014-09-09', description: 'Second doctor arrives for ebola treatment'},
			// {date: '2014-10-06', description: 'An NBC cameraman arrives for ebola treatment'}
		],

		brazil: [
			{date: '2014-10-10', description: 'A West African man is tested for ebola in Brazil'}
		],		
	},

	get_events: function(event_names) {
		if (!event_names) { return []; }

		var found = [];
		var all_events = this.event_list;
		event_names.forEach(function(d) {
			listed_events = all_events[d];
			if (listed_events) { 
				found = found.concat(listed_events); 
			}
			else { console.error('Unable to find events named ' + d); }
		});

		return found;
	}
};
