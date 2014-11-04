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

		sweden: [
			{date: '2014-08-31', description: 'A man returning from West Africa is hospitalized'},
			{date: '2014-10-19', description: 'An airline passenger is hospitalized in Stockholm'}
		],

		mexico: [
			{date: '2014-08-06', description: 'A student in Mexico City is suspected of ebola'},
		],

		us_policy: [
			{date: '2014-10-24', description: 'New York/New Jersey institute quarantine'}, // http://www.forbes.com/sites/dandiamond/2014/10/24/ebola-in-nyc-governor-orders-all-ebola-aid-workers-into-quarantine/
			{date: '2014-10-25', description: 'Nurse Kaci Hickox complains of quarantine'}, // http://nypost.com/2014/10/25/ebola-nurse-quarantined-in-newark-airport-blasts-treatment/
			{date: '2014-10-26', description: 'New York relaxes quarantine policy'}, // http://www.nytimes.com/2014/10/27/nyregion/ebola-quarantine.html
			{date: '2014-10-27', description: 'Federal government issues its own guidelines'}, // http://www.nytimes.com/2014/10/28/us/new-rules-coming-for-health-care-workers-returning-from-west-africa.html
			{date: '2014-10-28', description: 'Nurse Kaci Hickox released to self-quarantine'}, // http://www.nj.com/politics/index.ssf/2014/10/ebola_nurse_quarantined_in_nj_must_isolate_herself_maine_officials_say.html
			{date: '2014-10-30', description: 'Nurse Kaci Hickox violates quarantine order'}, // http://www.bostonglobe.com/metro/2014/10/30/maine-officials-seeking-court-order-detain-nurse/V1i90HJ3CjD8mqUi4vnDLM/story.html
			{date: '2014-10-31', description: 'Judge rejects Kaci Hickox quarantine order'} // http://www.bostonglobe.com/metro/2014/10/31/maine-asking-court-limit-movements-nurse-kaci-hickox/9tGSogqyPYlu3Vq7WjG84L/story.html
		],

		australia: [
			{date: '2014-09-11', description: 'An Australian man is tested for ebola'},
			{date: '2014-09-28', description: 'No health care workers in West Africa'},
			{date: '2014-10-09', description: 'An Australian nurse is tested for ebola'},
			{date: '2014-10-28', description: 'Visa ban against West African nations'},
		],

		cuba: [
			{date: '2014-10-03', description: 'The Cuban health care team arrives in West Africa'}, // http://www.washingtonpost.com/blogs/worldviews/wp/2014/10/04/in-the-medical-response-to-ebola-cuba-is-punching-far-above-its-weight/
		],

		nigeria: [
			{date: '2014-07-25', description: 'A Liberian man dies of ebola in Lagos, Nigeria'}, // http://news.yahoo.com/liberian-ebola-symptoms-dies-nigeria-official-132822550.html
			// {date: '2014-08-04', description: 'A Nigerian doctor is confirmed to have ebola'}, // http://www.theguardian.com/world/2014/aug/04/doctor-nigeria-ebola-victim-lagos
			{date: '2014-08-04', description: 'Nigeria confirms more ebola infections'}, // Local media coverage explodes. http://time.com/3089072/ebola-outbreak-nigeria-lagos/
			{date: '2014-10-01', description: 'Nigerian president gives ebola victory speech'}, // http://bigstory.ap.org/article/10e060e241ad45fbb3a0f8b4804e1957/nigeria-leader-hails-victories-ebola-militants
			// http://www.cdc.gov/mmwr/preview/mmwrhtml/mm6339a5.htm
			// http://blogs.cdc.gov/publichealthmatters/2014/08/on-the-ground-in-nigeria-ebola-response/
			{date: '2014-10-20', description: 'WHO declares Nigeria officially ebola-free'}, // http://www.who.int/mediacentre/news/statements/2014/nigeria-ends-ebola/en/
		],

		brazil_paraguay: [
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
