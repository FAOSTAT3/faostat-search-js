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

				this.$container = $('#search-results_' + suffix);

				//console.log(FAOSTATSearch.singleResultUI);
				//console.log(this.replaceAll(FAOSTATSearch.singleResultUI, 'REPLACE', suffix));

				this.$container.html(this.replaceAll(FAOSTATSearch.singleResultUI, 'REPLACE', suffix));
				//console.log(this.$container);
                //this.replaceIDs(suffix);

				//console.log(this.$container.find("#single-result-title_" + suffix));

				this.initUI(suffix);
			},

			replaceAll: function(string, find, replace) {
				return string.replace(new RegExp(find, 'g'), replace);
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

				//this.$container.find('#single-result-export_' + suffix).powerTip({placement: 'e'});
				//this.$container.find('#single-result-preview_' + suffix).powerTip({placement: 'e'});
				//this.$container.find('#single-result-preview_' + suffix).powerTip({placement: 'e'});

                // changing title TODO: pass code and title?
				var code = this.values.code;
				var label = this.values.label;
                var groupcode = this.values.gc;
				var groupname = this.values.gn;
				var domainname = this.values.dn;
				var domaincode = this.values.dc;

				this.$container.find("#single-result-title_" + suffix).html(label);
				this.$container.find("#single-result-code_" + suffix).html(code);
				this.$container.find("#single-result-group_" + suffix).html(groupname + " - ");
				this.$container.find("#single-result-domain_" + suffix).html(domainname);

				this.$container.find("#single-result-table-title_" + suffix).html($.i18n.prop('_maxRowDisplayed'));
				this.$container.find("#preview-text_" + suffix).html($.i18n.prop('_preview'));

				this.$container.find("#single-result-preview_" + suffix).prop('title', $.i18n.prop('_previewTooltip'));
				this.$container.find('#single-result-preview_' + suffix).powerTip({placement: 's'});

				this.$container.find('#export-text_' + suffix).html($.i18n.prop('_export'));
				this.$container.find('#single-result-export' + suffix).prop('title',$.i18n.prop('_exportTooltip'));
				this.$container.find('#single-result-export_' + suffix).powerTip({placement: 's'});

				this.$container.find('#single-result-table-showhide_' + suffix).prop('title', $.i18n.prop('_showHideTable'));
				this.$container.find('#single-result-table-showhide_' + suffix).powerTip({placement: 's'});


				this.$container.find('#go-to-download-text_' + suffix).html = $.i18n.prop('_goToDownload')
				this.$container.find('#single-result-go-to-download_' + suffix).prop('title' ,$.i18n.prop('_goToDownload'));
				this.$container.find('#single-result-go-to-download_' + suffix).powerTip({placement: 's'});

				var _this = this;
				// go to the download page
				// TODO: get current url
				this.$container.find("#single-result-domain_" + suffix).bind('click', function() {
                    FAOSTATSEARCH_STATS.goToDownload(domaincode);
					window.open('http://'+ FAOSTATSearch.gatewayURL + '/faostat-gateway/go/to/download/'+ groupcode +'/'+ domaincode +'/' + FAOSTATSearch.lang,'_self',false)
		        });

				this.$container.find("#single-result-go-to-download_" + suffix).bind('click', function() {
                    FAOSTATSEARCH_STATS.goToDownload(domaincode);
                    window.open('http://'+ FAOSTATSearch.gatewayURL + '/faostat-gateway/go/to/download/'+ groupcode +'/'+domaincode +'/' + FAOSTATSearch.lang,'_self',false)
                });

				for (var i = 0; i < this.values.length; i++) {
					this.$container.find("#single-result-elements_" + suffix).append(this.values[i].en);
					if ( i < this.values.length -1) {
						this.$container.find("#single-result-elements_" + suffix).append(" | ");
					}
				}

				// add export
				this.$container.find("#single-result-export_" + suffix).bind('click', function() {
	            	FAOSTATExport.exportXLS(_this.values, suffix, _this.type);
	            });
				this.$container.find("#single-result-export_" + suffix).powerTip({placement: 's'});


	            // add preview
				this.$container.find("#single-result-preview_" + suffix).bind('click', function() {
	            	FAOSTATExport.showPreview(_this.values, suffix, _this.type);
	            });
				//this.$container.find("#single-result-preview_" + suffix).powerTip({placement: 's'});
			},

			dispose: function() {
				this.$container.find("#single-result-domain_" + suffix).unbind('click');
				this.$container.find("#single-result-go-to-download_" + suffix).unbind('click');
				this.$container.find("#single-result-export_" + suffix).unbind('click');
				this.$container.find("#single-result-preview_" + suffix).unbind('click');
			}
		};
	
	return result;
};