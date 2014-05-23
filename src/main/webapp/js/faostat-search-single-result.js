var FAOSTATSearchSingleResult = function() {
	
	var result = {
			values: '',
			suffix: '',
			type: '',
			
			init: function(suffix, values, type) {
				this.values = values;
				this.suffix = suffix;
				this.type = type;

				/**
				 * Load the interface HTML and replace the ID's
				 */

                $('#search-results_' + suffix).append(FAOSTATSearch.singleResultUI);
                this.replaceIDs(suffix);
			},
			
			replaceIDs: function(suffix) {
				/**
				 * Change ID's suffix with the user's one
				 */
				var ids = $('[id$="_REPLACE"]');
				for (var i = 0 ; i < ids.length ; i++) {
					var old = ids[i].id;
					var id = old.substring(0, old.indexOf('_REPLACE')) + '_' + suffix;
					$('#' + ids[i].id).attr('id', id);
				}			
				/**
				 * Initiate the widgets
				 */
				this.initUI(suffix);

			},

			initUI: function(suffix) {

                $('#single-result-export_' + suffix).powerTip({placement: 'e'});
                $('#single-result-preview_' + suffix).powerTip({placement: 'e'});
                $('#single-result-preview_' + suffix).powerTip({placement: 'e'});


                // changing title TODO: pass code and title?
	            var _this = this;
				var code = this.values[0].code;
				var label = this.values[0].label;
				var groupname = this.values[0].gn;
				var domainname = this.values[0].dn;
				var domaincode = this.values[0].dc;
				
				$("#single-result-title_" + suffix).append(label);
				$("#single-result-code_" + suffix).append(code);
				$("#single-result-group_" + suffix).append(groupname + " - ");
				
				$("#single-result-domain_" + suffix).append(domainname);
				
				// go to the download page
				// TODO: get current url
				//alert( window.location.href );
				//http://fenixapps.fao.org/faostat-download-js/index.html
				$("#single-result-domain_" + suffix).bind('click', function() {
                    FAOSTATSEARCH_STATS.goToDownload(domaincode);
					window.open('http://'+ FAOSTATSearch.gatewayURL + '/faostat-gateway/go/to/download/'+ _this.values[0].gc +'/'+ _this.values[0].dc +'/' + FAOSTATSearch.lang);
		        });

              /*  $("#single-result-group_" + suffix).bind('click', function() {
                    window.open('http://'+ FAOSTATSearch.gatewayURL + '/faostat-gateway/go/to/browse/'+ _this.values[0].gc +'/'+ _this.values[0].dc +'/' + FAOSTATSearch.lang);
                });*/
				
				for (var i = 0; i < this.values.length; i++) {
					$("#single-result-elements_" + suffix).append(this.values[i].en);
					if ( i < this.values.length -1)
						$("#single-result-elements_" + suffix).append(" | ");
				}
				
				// add export
	            $("#single-result-export_" + suffix).bind('click', function() {
	            	FAOSTATExport.exportXLS(_this.values, suffix, _this.type);
	            });
				$("#single-result-export_" + suffix).powerTip({placement: 's'});

	            
	            // add preview
	            $("#single-result-preview_" + suffix).bind('click', function() {
	            	FAOSTATExport.showPreview(_this.values, suffix, _this.type);
	            });	            
				$("#single-result-preview_" + suffix).powerTip({placement: 's'});

			}	
		};
	
	return result;
};