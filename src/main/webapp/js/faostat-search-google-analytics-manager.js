if (!window.FAOSTATSEARCH_STATS) {
	
	window.FAOSTATSEARCH_STATS = {
		
		track : function(category, action, label) {
			_gaq.push(['_trackEvent', category, action, label]);
		},
		
		search : function(text) {
			FAOSTATSEARCH_STATS.track('SEARCH', 'Search', text);
		},
		
		showPreview : function(text) {
			FAOSTATSEARCH_STATS.track('SEARCH', 'Show Preview', text);
		},
		
		downloadData : function(text) {
			FAOSTATSEARCH_STATS.track('SEARCH', 'Download Data', text);
		},

        goToDownload : function(text) {
            FAOSTATSEARCH_STATS.track('SEARCH', 'Go to Download', text);
        }
	
	};
	
}