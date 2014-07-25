if (!window.FAOSTATSearch) {

    window.FAOSTATSearch = {

        prefix: 'http://168.202.28.214:8080/faostat-search-js/',
        gatewayURL: '',
        list: '',
        codes: '',
        baseurlcodes: '',
        baseurlwds: '',
        datasource: '',
        lang: 'E',
        valuesResults: '',
        items: '',
        elements: '',
        theme : "faostat",

        singleResultBaseURL: 'search-single-result2.html',
        singleResultUI: '',

        // group and domains are not used, it's just to be compliant with gateway
        init : function( word, lang ) {

            /**
             * Language: as parameter or from the URL
             */
            if (lang != null && lang.length > 0) {
                FAOSTATSearch.lang = lang;
            }

            $.getJSON(FAOSTATSearch.prefix + 'config/faostat-search-configuration.json', function(data) {
                FAOSTATSearch.baseurlcodes = data.baseurlcodes;
                FAOSTATSearch.baseurlwds = data.baseurlwds;
                FAOSTATSearch.datasource = data.datasource;
                FAOSTATSearch.gatewayURL = data.gatewayURL;
                FAOSTATSearch.I18N_URL = data.I18N_URL;

                /**
                 * Initiate multi-language
                 */
                var I18NLang = '';
                switch (FAOSTATSearch.lang) {
                    case 'F' : I18NLang = 'fr'; break;
                    case 'S' : I18NLang = 'es'; break;
                    default: I18NLang = 'en'; break;
                }
                $.i18n.properties({
                    name: 'I18N',
                    path: FAOSTATSearch.I18N_URL,
                    mode: 'both',
                    language: I18NLang,
                    callback: function () {

                        // modify languages
                        $('#container').load(FAOSTATSearch.prefix + 'search-ui2.html', function() {
                            FAOSTATSearch.initUI(word);
                        });
                    }

                });
            });

            // GET Single Search HTML
            $.ajax({
                type: "GET",
                url: FAOSTATSearch.prefix + FAOSTATSearch.singleResultBaseURL,
                success: function(data){
                    /** TODO: remove innerHTML **/
//                       FAOSTATSearch.singleResultUI = data.activeElement.innerHTML;
                    FAOSTATSearch.singleResultUI = data;
                }
            });



        },

        initUI : function(word) {


            /** Multilanguage **/
//			document.getElementById('search-example').innerHTML = $.i18n.prop('_search_example');

            /** Tooltip **/
            $('#search-button').powerTip({placement: 'e'});
            $('#search-filter-areas-showhide').powerTip({placement: 'e'});


            // listening the key to check if enter is pressed
            $("#searchbox").keypress(function(event) {
                if ( event.which == 13 ) {
                    FAOSTATSearch.searchValue();
                }
            });

            // focus on searchbox
            $("#searchbox").focus()

            // add export
            $("#search-button").bind('click', function() {
                FAOSTATSearch.searchValue();
            });

            $("#searchbox").on( "autocompleteselect", function( event, ui ) {
                FAOSTATSearch.searchValue();
            });

            // list of the items and elements
            list = new Array();
            codes = {};

            // getting the items list
            $.ajax({
                type: 'GET',
                url: 'http://'+ FAOSTATSearch.baseurlcodes +'/bletchley/rest/codes/all/items/'+ FAOSTATSearch.datasource +'/null/'+ FAOSTATSearch.lang,
                dataType: 'json',
                success : function(response) {
                    var j = 0;
                    codes = response;

                    var current = '';
                    for (var i = 0 ; i < response.length; i++) {
                        // this is used as blacklist
                        // TODO: make a configurable blacklist file
                        // TODO: remove trade matrix etc
                        if ( current != response[i].label) {
                            list.push(response[i].label);
                            current = response[i].label;
                        }

                    }

                    // getting the elements list
                    $.ajax({
                        type: 'GET',
                        url: 'http://'+ FAOSTATSearch.baseurlcodes +'/bletchley/rest/codes/all/elements/'+ FAOSTATSearch.datasource +'/null/'+ FAOSTATSearch.lang,
                        dataType: 'json',
                        success : function(response) {
                            codes = codes.concat(response);

                            var current = '';
                            for (var i = 0 ; i < response.length; i++) {
                                // this is used as blacklist
                                if ( current != response[i].label) {
                                    list.push(response[i].label);
                                    current = response[i].label;
                                }
                            }

                             // TODO: remove it from here the search
                            if ( word != null && word != '') {
                                FAOSTATSearch.searchValue(word);
                                $("#searchbox").val(word);

                            }
                        },
                        error : function(err,b,c) {
                            alert(err.status + ", " + b + ", " + c);
                        }
                    });
                },
                error : function(err,b,c) {
                    alert(err.status + ", " + b + ", " + c);
                }
            });

            $( "#searchbox" ).autocomplete({
                source: list
            });

            // add export
            $("#search-items").bind('click', function() {
                // TODO: change style to item
                FAOSTATSearch.searchByItem();
            });
            $("#search-elements").bind('click', function() {
                // TODO: change style to element
                FAOSTATSearch.searchByElement();
            });

            $(".search-areas-tab").jqxTabs({
                width: 300,
                height: 200,
                position: 'top',
                animationType: 'fade',
                selectionTracker: 'checked',
                theme: FAOSTATSearch.theme
            });

            $(".search-download-button").jqxButton({
                width: '75',
                height: '25'
            });
            /** TODO: which domain?? **/
            //FAOSTATSearch.populateGrid("countries", "gridCountries", "QC");


            $('#search-filter-areas-showhide').click(function () {
                $('#search-filter-areas-container').slideToggle();
            });

            $('#search-filter-years-showhide').click(function () {
                $('#search-filter-years-container').slideToggle();
//                $('#search-filter-years-showhide').toggleClass('search-filter-title-closed');
            });

            $('#search-tree-showhide').click(function () {
                $('#search-tree-container').slideToggle();
//                $('#search-tree-showhide').toggleClass('search-filter-title-closed');
            });


            // filter the results based on the selection on the tree
            $('#search-tree').bind('select', function (event) {
                var args = event.args;
                var item = $('#search-tree').jqxTree('getItem', args.element);
                // focus on top
                $(window).scrollTop($('#searchbox').offset().top);
                // filter results
                if (item.parentElement != null && item.hasItems == false) {
                    FAOSTATSearch.filterResultsByDomain(item.value);
                }
                else {
                    FAOSTATSearch.filterResultsByGroup(item.value);
                }
            });

            // show all results
            $('#search-tree-select-all').click(function (event) {
                $.each(FAOSTATSearch.valuesResults, function(index, value) {
                    $('#search-results_' + value.suffix).css('display', 'block');
                });
            });
        },
        populateGrid : function(codingSystem, gridCode, domainCode) {
            $.ajax({
                type: 'GET',
                url: 'http://' + FAOSTATSearch.baseurlcodes + '/bletchley/rest/codes/' + codingSystem + '/' + FAOSTATSearch.datasource + '/' + domainCode + '/' + FAOSTATSearch.language,
                dataType: 'json',
                success : function(response) {

                    var data = new Array();
                    for (var i = 0 ; i < response.length ; i++) {
                        var row = {};
                        row["label"] = response[i].label;
                        row["code"] = response[i].code;
                        data[i] = row;
                    }
                    var source = {
                        localdata: data,
                        datatype: "array"
                    };
                    var dataAdapter = new $.jqx.dataAdapter(source);
                    $("#" + gridCode).jqxGrid({
                        width: 299,
                        height: 165,
                        source: dataAdapter,
                        columnsresize: true,
                        showheader: false,
                        selectionmode: 'multiplerowsextended',
                        columns: [{text: 'Label', datafield: 'label'}],
                        theme: FAOSTATSearch.theme
                    });
                },

                error : function(err,b,c) {
//					alert(err.status + ", " + b + ", " + c);
                }
            });
        },

        /**
         * this method checks if there are items or elements retrieved by the search
         */
        searchValue : function(word) {

            FAOSTATSearch.valuesResults = new Array();


            var text = '';
            if ( word != null )
                text = word;
            else
                text = $("#searchbox").val();

            // Google Analytics STATS
            FAOSTATSEARCH_STATS.search(text);

            $("#search-title-type").empty();
            $("#search-title-type").append("Results for <b>" + text + "</b>");


            // check to handle just text that is more than 3 characters
            // TODO: refactor, split the code and make it nicer
            if ( text.length <= 2) {
                alert("The word to search is too short");
            }
            if ( text.length > 2 ) {
                // close the autocomplete
                $( "#searchbox" ).autocomplete( "close" );
                var obj = new Array();
                $.each(codes, function(k, v) {
                    /** this is with the contains **/
                    if (v.label.toLowerCase().indexOf(text.toLowerCase()) !=-1) {
                        obj.push(v);
                    }
                });
                // TODO: if it's 0 try to get the results of different words.
                // this could be make more precise with another algorithm that concatenate the words as well
                if (obj.length == 0 ) {
                    var texts = new Array();
                    var s = text.match(/\w+/g);
                    for( i = 0; i < s.length; i++) {
                        if ( s[i].length > 3 ) {
                            texts.push(s[i]);
                        }
                    }
                    $.each(codes, function(k, v) {
                        for (i=0; i< texts.length; i++) {
                            if (v.label.toLowerCase().indexOf(texts[i].toLowerCase()) !=-1) {
                                obj.push(v);
                            }
                        }
                    });
                }

                // this is used to pass the items to the search
                items = FAOSTATSearch.searchCheckCategories(obj, 'items');

                // this is used to pass the elemtens to the search
                elements = FAOSTATSearch.searchCheckCategories(obj, 'elements');

/*                console.log(items)
                console.log(elements)*/

                // display categories search bar
                if ( items != '' && items !=null)
                    $('#search-items').css('display', 'inline-block');
                else
                    $('#search-items').css('display', 'none');

                if ( elements != '' && elements != null )           {
                    $('#search-elements').css('display', 'inline-block');
                }
                else
                    $('#search-elements').css('display', 'none');


                // getting all the items
                if ( items != '' ) {
                    $('#search-content').css('display', 'inline');
                    $('#search-no-values').css('display', 'none');
                    FAOSTATSearch.searchByItem();
                }
                else if ( elements != '') {
                    $('#search-content').css('display', 'inline');
                    $('#search-no-values').css('display', 'none');
                    FAOSTATSearch.searchByElement();
                }
                else {
                    document.getElementById('search-no-values').innerHTML = $.i18n.prop('_no_results_available');
                    $('#search-content').css('display', 'none');
                    $('#search-no-values').css('display', 'block');
                }


            }

        },
        searchCheckCategories: function(obj, filter) {
            // this is used to pass the items to the search
            results = '';
            for ( var i = 0; i < obj.length; i++ ) {
                if ( obj[i].type  == filter) {
                    results += obj[i].code + ",";
                }
            }
            results = results.slice(0, -1);
            return results;
        },
        searchByItem: function() {
            $('#search-items').addClass('search-categories-label-selected');
            $('#search-elements').removeClass('search-categories-label-selected');
            var _this = this;
            $.ajax({
                type: 'GET',
                url: 'http://'+ FAOSTATSearch.baseurlcodes +'/bletchley/rest/codes/search/'+ items +'/items/'+ FAOSTATSearch.datasource +'/'+ FAOSTATSearch.lang,
                dataType: 'json',
                success : function(response) {

                    // build tree
                    _this.buildFilters(response);
                    _this.buildSearchOutput(response, 'items');

                },
                error : function(err,b,c) {
                    alert(err.status + ", " + b + ", " + c);
                }
            });
        },
        searchByElement: function() {
            $('#search-elements').addClass('search-categories-label-selected');
            $('#search-items').removeClass('search-categories-label-selected');
            var _this = this;
            $.ajax({
                type: 'GET',
                url: 'http://'+ FAOSTATSearch.baseurlcodes +'/bletchley/rest/codes/search/'+ elements +'/elements/'+ FAOSTATSearch.datasource +'/'+ FAOSTATSearch.lang,
                dataType: 'json',
                success : function(response) {

                    // build tree
                    _this.buildFilters(response);
                    _this.buildSearchOutput(response, 'elements');

                },
                error : function(err,b,c) {
                    alert(err.status + ", " + b + ", " + c);
                }
            });
        },

        buildFilters: function(response) {

            $("#search-years-range").rangeSlider({bounds:{min: 1961, max: 2050}}, {defaultValues: {min: 1961, max: 2011}}, {step: 1});

            FAOSTATSearch.buildTree(response);
        },

        buildTree: function(response) {

            var gc = '';
            var dc = '';
            var gcID = 0;
            var dcID = 100;
            var data = '[';
            // this is the first level to show everything

            for (var i = 0; i < response.length; i++) {
                if ( gc != response[i].gc ) {
                    gcID++;
                    data += '{';
                    data += '"id": "' + response[i].gc +'",';
                    data += '"value": "' + response[i].gc +'",';
                    data += '"text": "' + CORE.breakLabel(response[i].gn) +'",';
                    data += '"parentid": "-1"';
                    data += '}';
                    data += ',';
                    gc = response[i].gc;
                    //console.log(gc);
                }
                if ( dc != response[i].dc ) {
                    dcID++;
                    data += '{';
                    data += '"id": "' + response[i].dc +'-dc",';
                    data += '"value": "' + response[i].dc +'",';
                    data += '"text": "' +  CORE.breakLabel(response[i].dn) +'",';
                    data += '"parentid": "' + response[i].gc +'"';
                    data += '}';
                    data += ',';
                    dc = response[i].dc;
                    //console.log(dc);
                }
            }
            data = data.slice(0, -1);
            data += ']';

            var source = {
                datatype: "json",
                datafields: [
                    { name: 'id' },
                    { name: 'parentid' },
                    { name: 'value' },
                    { name: 'text' }
                ],
                id: 'id',
                localdata: data
            };
            var theme = '';
            // create data adapter.
            var dataAdapter = new $.jqx.dataAdapter(source);
            // perform Data Binding.
            dataAdapter.dataBind();
            // get the tree items. The first parameter is the item's id. The second parameter is the parent item's id. The 'items' parameter represents 
            // the sub items collection name. Each jqxTree item has a 'label' property, but in the JSON data, we have a 'text' field. The last parameter 
            // specifies the mapping between the 'text' and 'label' fields.  
            var records = dataAdapter.getRecordsHierarchy('id', 'parentid', 'items', [{ name: 'text', map: 'label'}]);
            $('#search-tree').jqxTree({ source: records, theme: theme });
            $('#search-tree').jqxTree('expandAll');

        },
        // first function to create the output view (per single
        buildSearchOutput : function(response, type) {

            // removing the old results
            $("#search-results").empty();

            var values = [];
            var code = '';
            var sum = 0;
            values.push(response[0]);
            code = response[0].code;
            for (var i = 1; i < response.length; i++) {
                if ( code != response[i].code ) {
                    this.buildSearchValueOutput(values, type);
                    code = response[i].code ;
                    values = [];
                    values.push(response[i]);
                    sum++;
                    //console.log("values: " + values);
                }
                else {
                    if ( i != 0 ) {
                        values.push(response[i]);
                    }
                }
            }
            // and the last one
            this.buildSearchValueOutput(values, type);
            sum++;


        },

        // this builds the item/element view
        buildSearchValueOutput: function(values, type) {
//			console.log("--------:" + values[0].code + " | " + values.length);
//			for(var i = 0; i < values.length; i++ ) {
//				console.log("1]" + values[i].label + " | " + values[i].code + " | " + values[i].gn + " | " + values[i].dc + " | " + values[i].dn + " | " + values[i].ec + " | " + values[i].en);
//			}
            var gc = '';
            var v = [];
            var sum = 0;
            v.push(values[0]);
            gc = values[0].gc;
            for(var i = 1; i < values.length; i++ ) {
                if ( gc != values[i].gc ) {
//					console.log("1-> " +values[i].label + " | " + values[i].code + " | " + values[i].gn + " | " + values[i].dc + " | " + values[i].dn);
                    this.buildSearchSingleOutput(v, type);
                    gc = values[i].gc;
                    v = [];
                    v.push(values[i]);
                    sum++;
                }
                else {
                    if ( i != 0 ) {
                        v.push(values[i]);
                    }
                }
                //console.log("values: " + values[i].code + " | " + values[i].label);
            }
            this.buildSearchSingleOutput(v, type);
            sum++;
//			console.log("GC SUM: " + sum + " | for: " );
        },

        // this build the single group/domain view of the item
        buildSearchSingleOutput: function(values, type) {
//			console.log("buildSearchSingleOutput: " + values.length);
//			for(var i = 0; i < values.length; i++ ) {
//				console.log("2]"+values[i].label + " | " + values[i].code + " | " + values[i].gn + " | " + values[i].dc + " | " + values[i].dn + " | " + values[i].ec + " | " + values[i].en);
//			}

            var dc = '';
            var v = [];
            var sum = 0;
            v.push(values[0]);
            dc = values[0].dc;
            //console.log(dc + " | " + v[0].dc + " | " + v[0].ec + " | " + v[0].en);
            for(var i = 1; i < values.length; i++ ) {
//				console.log(dc + " | " + values[i].dc + " | " + values[i].ec + " | " + values[i].en);
                if ( dc != values[i].dc ) {

                    this.buildSearchSingleBoxOutput(v, type);

                    dc = values[i].dc;
                    v = [];
                    v.push(values[i]);
                    sum++;
                }
                else {
                    if ( i != 0 ) {
                        v.push(values[i]);
                    }
                }
                //console.log("values: " + values[i].code + " | " + values[i].label);
            }
            this.buildSearchSingleBoxOutput(v, type);
            sum++;
            //console.log("DC SUM: " + sum);

        },

        buildSearchSingleBoxOutput: function(values, type) {
//			for(var i = 0; i < values.length; i++ ) {
//				console.log("3]" + values[i].label + " | " + values[i].code + " | " + values[i].gn + " | " + values[i].dc + " | " + values[i].dn + " | " + values[i].ec + " | " + values[i].en);
//			}
//			console.log("BUILD OUTPUT");
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var id = randLetter + Date.now();
            $("#search-results").append("<div id='search-results_"+ id +"'><div>");
            var obj = new FAOSTATSearchSingleResult();
            obj.init(id, values, type);

            FAOSTATSearch.valuesResults.push(obj);
        },
        filterResultsByDomain: function(code){
/*            console.log(FAOSTATSearch.valuesResults);
            console.log(FAOSTATSearch.valuesResults.length);*/
            for(var i=0; i < FAOSTATSearch.valuesResults.length; i++){
                var value = FAOSTATSearch.valuesResults[i];
                if ( value.values[0].dc != code) {
                    $('#search-results_' + value.suffix).hide();
//                    $('#search-results_' + value.suffix).append('remove ');
                }
                else {
                    $('#search-results_' + value.suffix).show();
//                    $('#search-results_' + value.suffix).append('add ');

                }
            }
        },
        filterResultsByGroup: function(code){
            $.each(FAOSTATSearch.valuesResults, function(index, value) {
                if ( value.values[0].gc != code) {
                    $('#search-results_' + value.suffix).hide();
                }
                else {
                    $('#search-results_' + value.suffix).show();
                }
            });
        }

    };

}