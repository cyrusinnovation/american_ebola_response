var Event = {};
Event.events = {
	event_list : {
		us_infection : [
			{date: '2014-09-30', description: 'Thomas Eric Duncan tests positive for ebola'},
			{date: '2014-10-08', description: 'Thomas Eric Duncan dies'},
			{date: '2014-10-11', description: 'Nurse Nina Pham tests positive for ebola'},
			{date: '2014-10-15', description: 'Nurse Amber Vinson tests positive for ebola'},
			{date: '2014-10-23', description: 'Doctor Craig Spencer tests positive for ebola'}
		],

		us_imported: [
			{date: '2014-08-02', description: 'Aid worker and missionary arrive for treatment'},
			{date: '2014-09-05', description: 'A doctor arrives in US for ebola treatment'},
			{date: '2014-09-09', description: 'Second doctor arrives for ebola treatment'},
			// {date: '2014-10-06', description: 'An NBC cameraman arrives for ebola treatment'}
		],

		taylor_swift: [
			{date: '2014-10-27', description: "Taylor Swift album '1989' is released"},
			{date: '2014-10-31', description: "Halloween"}
		],

		spain: [
			{date: '2014-08-06', description: 'Spain prepares to treat a returning missionary'},
			{date: '2014-10-06', description: 'A Spanish nurse contracts ebola'},
			{date: '2014-10-16', description: 'Several patients suspected of ebola in Spain'}
		],

		chile: [
			{date: '2014-10-12', description: 'A suspected ebola case at a Chilean hospital'},
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
