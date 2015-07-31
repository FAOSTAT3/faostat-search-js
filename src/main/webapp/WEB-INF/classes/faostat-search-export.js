if (!window.FAOSTATExport) {

    window.FAOSTATExport = {
        json : {},
        cssFilename : '',
        thousandSeparator : ',',
        decimalSeparator : '.',
        decimalNumbers : '2',
        showFlags : false,
        showCodes : false,
        showUnits : false,
        showNullValues : false,
        valueColumnIndex : -1,
        summary_countries_map : new Array(),
        summary_elements_map : new Array(),
        summary_items_map : new Array(),
        summary_years_map : new Array(),
        limit : true,
        tablelimit: 10,
        values: '',
        type: '',
        showPreview: function(values, suffix, type) {
            this.limit = 10;
            this.values = values;
            this.type = type;
            this.startProcedure(suffix, 'preview');
        },
        exportXLS: function(values, suffix, type) {
            this.limit = false;
            this.values = values;
            this.type = type;
            this.startProcedure(suffix, 'export');
        },
        startProcedure: function(suffix, type) {

            // TODO: make it nicer (check if it's a trade matrix domain)
            var domain = this.domains();
            if ( domain == 'FT'|| domain == 'TM') {
                this.createJSONTradeMatrix();
            }
            else {
                this.createJSONStandard();
            }

            this.createTable(suffix, type);
        },
        createTable : function(suffix, type) {
            var data = {};
            data.datasource = FAOSTATSearch.datasource;
            data.thousandSeparator = FAOSTATExport.thousandSeparator;
            data.decimalSeparator = FAOSTATExport.decimalSeparator;
            data.decimalNumbers = FAOSTATExport.decimalNumbers;
            data.json = JSON.stringify(FAOSTATExport.json);
            data.cssFilename = FAOSTATExport.cssFilename;
            data.valueIndex = FAOSTATExport.valueColumnIndex;

            var outputType = 'html';
            if ( type == 'export' ) {
                // Google Analytics STATS
                FAOSTATSEARCH_STATS.search('EXPORT DATA');
                outputType = 'excel';
            }
            else{
                // Google Analytics STATS
                FAOSTATSEARCH_STATS.search('SHOW DATA');
                $('#search-table_' + suffix).empty();
                $('#search-table_' + suffix).show();
                // fix the loading image
                $('#search-table_' + suffix).append('<div class="loading"></div>');
            }

            // Preview the table
            if (type == 'preview' ) {
                $.ajax({
                    type : 'POST',
                    url : 'http://'+ FAOSTATSearch.baseurlwds +'/wds/rest/table/' + outputType,
                    data : data,
                    success : function(response) {
                        $('#search-table_' + suffix).empty();
                        $('#search-table_' + suffix).hide();
                        $('#search-table_' + suffix).append(response);

                        $('#search-table_' + suffix).slideDown();

                        $('#search-table_hide_' + suffix).css('display', 'block');
                        $('#search-table_hide_' + suffix).bind('click', function() {

                            $('#search-table_hide_' + suffix).slideUp();
                            $('#search-table_' + suffix).slideUp();
                        });
                    },
                    error : function(err, b, c) {
                        //console.log(err.status + ", " + b + ", " + c);
                    }
                });
            }
            /** Export the data. Stream the Excel through the hidden form */
            else {
                /** Stream the Excel through the hidden form */
                $('#datasource_WQ').val(FAOSTATSearch.datasource);
                $('#thousandSeparator_WQ').val(FAOSTATExport.thousandSeparator);
                $('#decimalSeparator_WQ').val(FAOSTATExport.decimalSeparator);
                $('#decimalNumbers_WQ').val(FAOSTATExport.decimalNumbers);
                $('#json_WQ').val(JSON.stringify(FAOSTATExport.json));
                $('#cssFilename_WQ').val('');
                $('#valueIndex_WQ').val(null);
                $('#quote_WQ').val('');
                $('#title_WQ').val('');
                $('#subtitle_WQ').val('');
                document.excelFormWithQuotes.submit();
            }

        },
        createJSONTradeMatrix : function() {

            /**
             * Include domain name
             */
            FAOSTATExport.json["selects"] = [{"aggregation":null, "column":"DOM.DomainName" + FAOSTATSearch.lang, "alias":"Domain"}];

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"A1.AreaName" + FAOSTATSearch.lang, "alias":"Reporter_Area"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.ReporterAreaCode", "alias":"Reporter_Area_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"A2.AreaName" + FAOSTATSearch.lang, "alias":"Partner_Area"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.PartnerAreaCode", "alias":"Partner_Area_Code"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.ItemCode", "alias":"Item_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"I.ItemName" + FAOSTATSearch.lang, "alias":"Item"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.ElementCode", "alias":"Element_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"E.ElementName" + FAOSTATSearch.lang, "alias":"Element"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Year", "alias":"Year"};

            if (FAOSTATExport.showUnits)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"E.UnitName" + FAOSTATSearch.lang, "alias":"Unit"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Value", "alias":"Value"};

            if (FAOSTATExport.showFlags)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Flag", "alias":"Flag"};

            FAOSTATExport.valueColumnIndex = FAOSTATExport.getValueColumnIndex(FAOSTATExport.json);

            FAOSTATExport.json["froms"] = [{"column":"TradeMatrix", "alias":"D"},
                {"column":"Item", "alias":"I"},
                {"column":"Element", "alias":"E"},
                {"column":"Area", "alias":"A1"},
                {"column":"Area", "alias":"A2"},
                {"column":"Domain", "alias":"DOM"}];

            var domain = this.domains();
            var elements = this.elemens();
            var items = this.items();
            var countries = null;
            var years =	this.years();

            FAOSTATExport.json["wheres"] = [{"datatype":"TEXT","column":"D.DomainCode","operator":"=","value":domain,"ins":[]},
                {"datatype":"TEXT","column":"DOM.DomainCode","operator":"=","value":domain,"ins":[]},
                {"datatype":"DATE","column":"D.PartnerAreaCode","operator":"=","value":"A2.AreaCode","ins":[]},
                {"datatype":"DATE","column":"D.ReporterAreaCode","operator":"=","value":"A1.AreaCode","ins":[]},
                {"datatype":"DATE","column":"D.DomainCode","operator":"=","value":"DOM.DomainCode","ins":[]},
                {"datatype":"DATE","column":"D.ItemCode","operator":"=","value":"I.ItemCode","ins":[]},
//			                    {"datatype":"DATE","column":"D.ElementListCode","operator":"=","value":"E.ElementListCode","ins":[]},
                {"datatype":"DATE","column":"D.ElementCode","operator":"=","value":"E.ElementCode","ins":[]}];

            if (elements != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.ElementCode","operator":"IN","value":"E.ElementCode","ins": elements};
            if (countries != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.ReporterAreaCode","operator":"IN","value":"A1.AreaCode","ins": countries};
            if (items != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.ItemCode","operator":"IN","value":"I.ItemCode","ins": items};
            if (years != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.Year","operator":"IN","value":"D.Year","ins": years};

            FAOSTATExport.json["orderBys"] = [{"column":"D.Year", "direction":"DESC"},
                {"column":"A1.AreaName" + FAOSTATSearch.lang, "direction":"ASC"},
                {"column":"I.ItemName" + FAOSTATSearch.lang, "direction":"ASC"},
                {"column":"E.ElementName" + FAOSTATSearch.lang, "direction":"ASC"}];

            if (FAOSTATExport.limit) {
                FAOSTATExport.json["limit"] = FAOSTATExport.tablelimit;
            } else {
                FAOSTATExport.json["limit"] = null;
            }
            FAOSTATExport.json["query"] = null;
            FAOSTATExport.json["frequency"] = null;
            FAOSTATExport.getValueColumnIndex(FAOSTATExport.json);
        },

        createJSONStandard : function() {

            /**
             * Include the Domain name
             */
            FAOSTATExport.json["selects"] = [{"aggregation":null, "column":"DOM.DomainName"+ FAOSTATSearch.lang, "alias":"Domain"}];
            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"A.AreaName" + FAOSTATSearch.lang, "alias":"Country"};
            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.AreaCode", "alias":"Country_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"I.ItemName" + FAOSTATSearch.lang, "alias":"Item"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.ItemCode", "alias":"Item_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"E.ElementName" + FAOSTATSearch.lang, "alias":"Element"};

            if (FAOSTATExport.showCodes)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.ElementCode", "alias":"Element_Code"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Year", "alias":"Year"};

            if (FAOSTATExport.showUnits)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"E.UnitName" + FAOSTATSearch.lang, "alias":"Unit"};

            FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Value", "alias":"Value"};

            if (FAOSTATExport.showFlags)
                FAOSTATExport.json["selects"][FAOSTATExport.json["selects"].length] = {"aggregation":null, "column":"D.Flag", "alias":"Flag"};

            FAOSTATExport.valueColumnIndex = FAOSTATExport.getValueColumnIndex(FAOSTATExport.json);

            FAOSTATExport.json["froms"] = [{"column":"Data", "alias":"D"},
                {"column":"Item", "alias":"I"},
                {"column":"Element", "alias":"E"},
                {"column":"Area", "alias":"A"},
                {"column":"Domain", "alias":"DOM"}];


            var domain = this.domains();
            var elements = this.elemens();
            var items = this.items();
            var countries = null;
            var years = this.years();

            FAOSTATExport.json["wheres"] = [{"datatype":"TEXT","column":"D.DomainCode","operator":"=","value":domain,"ins":[]},
                {"datatype":"TEXT","column":"DOM.DomainCode","operator":"=","value":domain,"ins":[]},
                {"datatype":"DATE","column":"D.AreaCode","operator":"=","value":"A.AreaCode","ins":[]},
                {"datatype":"DATE","column":"D.DomainCode","operator":"=","value":"DOM.DomainCode","ins":[]},
                {"datatype":"DATE","column":"D.ItemCode","operator":"=","value":"I.ItemCode","ins":[]},
//			                    {"datatype":"DATE","column":"D.ElementListCode","operator":"=","value":"E.ElementListCode","ins":[]}];
                {"datatype":"DATE","column":"D.ElementCode","operator":"=","value":"E.ElementCode","ins":[]}];

            if (elements != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.ElementCode","operator":"IN","value":"E.ElementCode","ins": elements};
            if (countries != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.AreaCode","operator":"IN","value":"A.AreaCode","ins": countries};
            if (items != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.ItemCode","operator":"IN","value":"I.ItemCode","ins": items};
            if (years != null)
                FAOSTATExport.json["wheres"][FAOSTATExport.json["wheres"].length] = {"datatype":"TEXT","column":"D.Year","operator":"IN","value":"D.Year","ins": years};

            FAOSTATExport.json["orderBys"] = [{"column":"D.Year", "direction":"DESC"},
                {"column":"A.AreaName" + FAOSTATSearch.lang, "direction":"ASC"},
                {"column":"I.ItemName" + FAOSTATSearch.lang, "direction":"ASC"},
                {"column":"E.ElementName" + FAOSTATSearch.lang, "direction":"ASC"}];

            if (FAOSTATExport.limit) {
                FAOSTATExport.json["limit"] = FAOSTATExport.tablelimit;
            } else {
                FAOSTATExport.json["limit"] = null;
            }

            FAOSTATExport.json["query"] = null;
            FAOSTATExport.json["frequency"] = null;
            FAOSTATExport.getValueColumnIndex(FAOSTATExport.json);


        },

        getValueColumnIndex : function(json) {
            for (var i = 0 ; i < json.selects.length ; i++)
                if (json.selects[i].column == 'D.Value')
                    return i;
        },
        items: function(){
            var ins = new Array;
            switch(FAOSTATExport.type) {
                case 'items':
                    try {
                        ins.push(this.values[0].code);
                        return ins;
                    } catch (e) { return null; }
                    return null;
                    break;
                default:return null;
            }

        },
        elemens: function(){
            var ins = new Array;
            switch(FAOSTATExport.type) {
                case 'items':
                    /*try {
                     for(var i = 0; i < this.values.length; i++ ) {
                     ins.push(this.values[i].ec);
                     }
                     return ins;
                     } catch (e) { return null; }
                     return null;*/
                    break;
                case 'elements':
                    try {
                        ins.push(this.values[0].code);
                        return ins;
                    } catch (e) { return null; }
                    return null;
                    break;

                default:return null;
            }


        },
        domains: function(){
            return this.values[0].dc;
        },
        years: function() {
            var ins = new Array;
            var values = $("#search-years-range").rangeSlider("values");
            for(var i = values.min; i <= values.max; i++ ) {
                ins.push(i);
            }
            return ins;
        }


    };

}