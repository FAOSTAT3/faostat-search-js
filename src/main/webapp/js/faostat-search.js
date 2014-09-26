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

        // result from last search
        itemsSearch : '',

        // result from last search
        elementSearch : '',

        limit : 25,


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
                        // GET Single Search HTML
                        $.ajax({
                            type: "GET",
                            url: FAOSTATSearch.prefix + FAOSTATSearch.singleResultBaseURL,
                            success: function(data){
                                FAOSTATSearch.singleResultUI = data;
                                // modify languages
                                $('#container').load(FAOSTATSearch.prefix + 'search-ui2.html', function() {
                                    FAOSTATSearch.initUI(word);
                                });
                            }
                        });
                    }

                });
            });
        },

        initUI : function(word) {

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
                FAOSTATSearch.show("items");
            });
            $("#search-elements").bind('click', function() {
                FAOSTATSearch.show("elements");
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

            // search for the word passed
            if ( word != null && word != '') {
                FAOSTATSearch.searchValue(word);
                $("#searchbox").val(word);

            }
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
                FAOSTATSearch.searchBy(text);
            }
        },

        searchBy: function(text) {

            $( "#searchbox" ).autocomplete( "close" );
            //FAOSTATSearch.getAreas(text)
//            FAOSTATSearch.searchByItem(text);
//            FAOSTATSearch.searchByElement(text);

            $('#search-content').css('display', 'none');
            $('#search-no-values').css('display', 'none');



            var url = "http://localhost:8090/wds/rest/search/text/element/" + FAOSTATSearch.datasource + "/DomainVar/"+ text +"/" + FAOSTATSearch.lang +"/" + FAOSTATSearch.limit
            var _this = this;
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                success : function(response) {
                    var url = "http://localhost:8090/wds/rest/search/text/item/" + FAOSTATSearch.datasource + "/DomainVar/"+ text +"/" + FAOSTATSearch.lang +"/" + FAOSTATSearch.limit
                    var elements = (typeof response == 'string')? $.parseJSON(response) : response;
                    $.ajax({
                        type: 'GET',
                        url: url,
                        dataType: 'json',
                        success : function(response) {
                            var items = (typeof response == 'string')? $.parseJSON(response) : response;
                            FAOSTATSearch.elementsSearch = elements;
                            FAOSTATSearch.itemsSearch = items;
                            _this.showResults(items, elements)
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
        },

        showResults: function(items, elements) {
            // display none of the items/elements results
            $("#search-results-items").css('display', 'none');
            $("#search-results-elements" ).css('display', 'none');
            $('#search-items').css('display', 'none');
            $('#search-elements').css('display', 'none');
            $("#search-results-items").empty()
            $("#search-results-elements").empty()


            if ( items.length <= 0 && elements.length  <= 0 ) {
                $('#search-no-values').css('display', 'inline');
                $('#search-no-values').html("asdiujaosdij")
            }
            else {
                $('#search-no-values').css('display', 'none');
                $('#search-content').css('display', 'inline');

                if ( items.length > 0 ) {
                    $('#search-items').css('display', 'inline-block');
                    for(var i=0; i < items.length; i++) {
                        this.buildSearchSingleBoxOutput(items[i], 'items');
                    }
                }
                if ( elements.length > 0) {
                    $('#search-elements').css('display', 'inline-block');
                    for(var i=0; i < elements.length; i++) {
                        this.buildSearchSingleBoxOutput(elements[i], 'elements');
                    }
                }

                // display
                if ( items.length > 0 ) {
                    $('#search-items').addClass('search-categories-label-selected');
                    $('#search-elements').removeClass('search-categories-label-selected');
                    $("#search-results-items").css('display', 'inline');

                    // filter results domain
                    FAOSTATSearch.buildFilters(items);

                }
                else if ( elements.length > 0 ) {
                    $('#search-elements').addClass('search-categories-label-selected');
                    $('#search-items').removeClass('search-categories-label-selected');
                    $("#search-results-elements").css('display', 'inline');

                    // filter results domain
                    FAOSTATSearch.buildFilters(elements);
                }
            }
        },


        show: function(type) {
            switch (type) {
                case "items" :
                    $('#search-items').addClass('search-categories-label-selected');
                    $('#search-elements').removeClass('search-categories-label-selected');
                    $("#search-results-elements").css('display', 'none');
                    $("#search-results-items").css('display', 'inline');

                    FAOSTATSearch.buildFilters(FAOSTATSearch.itemsSearch);
                    break;
                case "elements" :
                    $('#search-elements').addClass('search-categories-label-selected');
                    $('#search-items').removeClass('search-categories-label-selected');
                    $("#search-results-items").css('display', 'none');
                    $("#search-results-elements").css('display', 'inline');
                    FAOSTATSearch.buildFilters(FAOSTATSearch.elementsSearch);
                    break;
            }
            for(var i=0; i < FAOSTATSearch.valuesResults.length; i++) {
                var value = FAOSTATSearch.valuesResults[i];
                $('#search-results_' + value.suffix).show();
            }
        },



        getAreas: function(value) {
            var url = 'http://localhost:8090/wds/rest/search/areas/'+ FAOSTATSearch.datasource +'/area/'+ value +"/"+ FAOSTATSearch.lang;
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response) : response

                    var dropdowndID = "search-areas-dropdown"
                    $('#search-areas').empty();


                    var html = '<select multiple id="'+ dropdowndID+'" style="width:200px;" data-placeholder="'+ $.i18n.prop('_select') +'" class="">';
                    html += '<option value=""></option>';

                    for(var i=0; i < response.length; i++) {
                        if ( response[i][3]) {
                            html += '<option selected value="' + response[i][0] + '">' + response[i][1] + '</option>';
                        }
                        else
                            html += '<option value="' + response[i][0] + '">' + response[i][1] + '</option>';

                    }
                    html += '</select>';

                    $('#search-areas').append(html);
                    $('#' + dropdowndID).chosen(
                        {disable_search_threshold:6,
                        width: '100%'}
                    );
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
            $('#search-tree').show()

            var dict = {};
            for (var i = 0; i < response.length; i++) {
                if ( !dict[response[i][1]] ) {
                    dict[response[i][1]] = {}
                }
                if ( !dict[response[i][1]][response[i][3]] ) {
                    dict[response[i][1]][response[i][3]] = {}
                }
                dict[response[i][1]][response[i][3]] = response[i]
            }

            var sortedKeys = Object.keys(dict).sort();
            var source = []
            for (var i=0; i < sortedKeys.length; i++) {
                var obj = {}
                obj.items = []
                var keys = Object.keys(dict[sortedKeys[i]]);
                for (var j=0; j < keys.length; j++) {
                    var value = dict[sortedKeys[i]][keys[j]];
                    if ( j == 0 ) {
                        // group
                        obj.value = value[0]
                        obj.label = value[1]
                    }
                    // domain
                    var leaf = {
                        "value" : value[2],
                        "label" : value[3]
                    }
                    obj.items.push(leaf)
                }
                source.push(obj)
            }
            $('#search-tree').jqxTree({ source: source});
            $('#search-tree').jqxTree('selectItem', null);
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
            var gc = '';
            var v = [];
            var sum = 0;
            v.push(values[0]);
            gc = values[0].gc;
            for(var i = 1; i < values.length; i++ ) {
                if ( gc != values[i].gc ) {
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
            }
            this.buildSearchSingleOutput(v, type);
            sum++;
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
            }
            this.buildSearchSingleBoxOutput(v, type);
            sum++;
        },

        buildSearchSingleBoxOutput: function(values, type) {
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var id = randLetter + Date.now();
            $("#search-results-" + type).append("<div id='search-results_"+ id +"'><div>");
            var obj = new FAOSTATSearchSingleResult();
            obj.init(id, values, type);

            FAOSTATSearch.valuesResults.push(obj);
        },
        filterResultsByDomain: function(code){
            for(var i=0; i < FAOSTATSearch.valuesResults.length; i++) {
                var value = FAOSTATSearch.valuesResults[i];
                if ( value.values[2] != code) {
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
                if ( value.values[0] != code) {
                    $('#search-results_' + value.suffix).hide();
                }
                else {
                    $('#search-results_' + value.suffix).show();
                }
            });
        }



    };

}