if (!window.FAOSTATSearch) {

    window.FAOSTATSearch = {

        DEBUG: true,

        SEARCH_SCORE_THRESHOLD: 0.60,
        SEARCH_SCORE_MAX_RESULTS: 25,
        SEARCH_SCORE_MAX_RESULTS_TOTAL: 80,


        prefix: 'http://localhost:8080/faostat-search-js/',
        //prefix: 'http://faostat3.fao.org/modules/faostat-search-js/',
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

        singleResultBaseURL: 'search-single-result.html',
        singleResultUI: '',

        // group and domains are not used, it's just to be compliant with gateway
        init : function( word, lang ) {

            var _this = this;

            require(['fuse', 'lunr', 'fuzzyset'], function (Fuse, Lunr, Fuzzyset) {
                FAOSTATSearch.Fuse = Fuse;
                FAOSTATSearch.Lunr = Lunr;
                FAOSTATSearch.Fuzzyset = Fuzzyset;

                /**
                 * Language: as parameter or from the URL
                 */
                if (lang != null && lang.length > 0) {
                    FAOSTATSearch.lang = lang;
                }

                $.getJSON(FAOSTATSearch.prefix + 'config/faostat-search-configuration.json', function (data) {
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
                        case 'F' :
                            I18NLang = 'fr';
                            break;
                        case 'S' :
                            I18NLang = 'es';
                            break;
                        default:
                            I18NLang = 'en';
                            break;
                    }
                    $.i18n.properties({
                        name: 'I18N',
                        path: FAOSTATSearch.I18N_URL,
                        mode: 'both',
                        language: I18NLang,
                        callback: function () {

                            // modify languages
                            $('#container').load(FAOSTATSearch.prefix + 'search-ui.html', function () {
                                FAOSTATSearch.initUI(word);
                            });
                        }
                    });
                });

                // GET Single Search HTML
                $.ajax({
                    type: "GET",
                    url: FAOSTATSearch.prefix + FAOSTATSearch.singleResultBaseURL,
                    success: function (data) {
                        /** TODO: remove innerHTML **/
                            //                       FAOSTATSearch.singleResultUI = data.activeElement.innerHTML;
                        FAOSTATSearch.singleResultUI = data;
                    }
                });
            });
        },

        initUI : function(word) {

            // create lunrIndex
            this.createLunrIndex();


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

            // add export
            $("#search-button").bind('click', function() {
                FAOSTATSearch.searchValue();
            });

            // focus on searchbox
            $("#searchbox").focus()

            $("#searchbox").on( "autocompleteselect", function( event, ui ) {
                FAOSTATSearch.searchValue();
            });

            // list of the items and elements
            var list = [];
            FAOSTATSearch.codes = {};

            // getting the items list
            $.ajax({
                type: 'GET',
                url: 'http://'+ FAOSTATSearch.baseurlcodes +'/bletchley/rest/codes/all/items/'+ FAOSTATSearch.datasource +'/null/'+ FAOSTATSearch.lang,
                dataType: 'json',
                success : function(response) {
                    var j = 0;
                    FAOSTATSearch.codes = response;

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
                            FAOSTATSearch.codes = FAOSTATSearch.codes.concat(response);

                            var current = '';
                            for (var i = 0 ; i < response.length; i++) {
                                // this is used as blacklist
                                if ( current != response[i].label) {
                                    list.push(response[i].label);
                                    current = response[i].label;
                                }
                            }

                            // TODO: remove it from here the search
                            if ( word != null && word != '' && word != '*') {
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
                FAOSTATSearch.searchBy(FAOSTATSearch.items, 'items', 'elements', FAOSTATSearch.word);
            });
            $("#search-elements").bind('click', function() {
                // TODO: change style to element
                FAOSTATSearch.searchBy(FAOSTATSearch.elements, 'elements', 'items', FAOSTATSearch.word);
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

            $('#search-filter-areas-showhide').click(function () {
                $('#search-filter-areas-container').slideToggle();
            });

            $('#search-filter-years-showhide').click(function () {
                $('#search-filter-years-container').slideToggle();
            });

            $('#search-tree-showhide').click(function () {
                $('#search-tree-container').slideToggle();
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

        /**
         * this method checks if there are items or elements retrieved by the search
         */
        searchValue : function(word) {

            FAOSTATSearch.valuesResults = [];


            FAOSTATSearch.word = '';
            if ( word != null )
                FAOSTATSearch.word = word;
            else
                FAOSTATSearch.word = $("#searchbox").val();

            // Google Analytics STATS
            if ( !FAOSTATSearch.DEBUG ) {
                FAOSTATSEARCH_STATS.search(FAOSTATSearch.word);
            }

            $("#search-title-type").empty();
            $("#search-title-type").append("Results for <b>" + FAOSTATSearch.word + "</b>");


            // check to handle just text that is more than 3 characters
            // TODO: refactor, split the code and make it nicer
            if ( FAOSTATSearch.word.length <= 2) {
                alert("The word to search is too short");
            }
            if ( FAOSTATSearch.word.length > 2 ) {
                // TODO: change here


                // close the autocomplete
                $( "#searchbox" ).autocomplete( "close" );

                // search word with Fuse
                //var results = this.searchWordWithFuse(FAOSTATSearch.codes, FAOSTATSearch.word);
                //var results = this.searchWordWithLunr(FAOSTATSearch.codes, FAOSTATSearch.word);
                var results = this.searchWordWithLunrFull(FAOSTATSearch.word);
                //var results = this.searchWordWithFuzzyset(FAOSTATSearch.codes, FAOSTATSearch.word);

                console.log(results);

                var objs = [];
                $.each(results, function(k, v) {
                    if (v.score <= FAOSTATSearch.SEARCH_SCORE_THRESHOLD && objs.length < FAOSTATSearch.SEARCH_SCORE_MAX_RESULTS_TOTAL) {
                        objs.push(v.item);
                    }
                });

                // this is used to pass the items to the search
                FAOSTATSearch.items = FAOSTATSearch.searchCheckCategories(objs, 'items');

                // this is used to pass the elemtens to the search
                FAOSTATSearch.elements = FAOSTATSearch.searchCheckCategories(objs, 'elements');

                // display categories search bar
                if (  FAOSTATSearch.items != '' &&  FAOSTATSearch.items !=null) {
                    $('#search-items').css('display', 'inline-block');
                }
                else {
                    $('#search-items').css('display', 'none');
                }

                if ( FAOSTATSearch.elements != '' && FAOSTATSearch.elements != null )           {
                    $('#search-elements').css('display', 'inline-block');
                }
                else {
                    $('#search-elements').css('display', 'none');
                }

                // getting all the items
                if ( FAOSTATSearch.items != '' ) {
                    $('#search-content').css('display', 'inline');
                    $('#search-no-values').css('display', 'none');
                    FAOSTATSearch.searchBy(FAOSTATSearch.items, 'items', 'elements', FAOSTATSearch.word);
                }
                else if ( FAOSTATSearch.elements != '') {
                    $('#search-content').css('display', 'inline');
                    $('#search-no-values').css('display', 'none');
                    FAOSTATSearch.searchBy(FAOSTATSearch.elements, 'elements', 'items', FAOSTATSearch.word);
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
            var results = '';
            for ( var i = 0; i < obj.length; i++ ) {
                if ( obj[i].type  == filter) {
                    results += obj[i].code + ",";
                }
            }
            results = results.slice(0, -1);
            return results;
        },

        searchBy: function(codes, type, deselectType, word) {
            $('#search-' + type).addClass('search-categories-label-selected');
            $('#search-' + deselectType ).removeClass('search-categories-label-selected');
            var _this = this;
            $.ajax({
                type: 'GET',
                url: 'http://' + FAOSTATSearch.baseurlcodes + '/bletchley/rest/codes/search/' + codes + '/' + type + '/' + FAOSTATSearch.datasource + '/' + FAOSTATSearch.lang,
                dataType: 'json',
                success: function (response) {
                    _this.buildSearchOutput(response, type, word);
                },
                error: function (err, b, c) {
                    alert(err.status + ", " + b + ", " + c);
                }
            });
        },

        buildFilters: function(response) {
            $("#search-years-range").rangeSlider({bounds:{min: 1961, max: 2050}}, {defaultValues: {min: 1961, max: 2014}}, {step: 1});
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
        buildSearchOutput : function(response, type, word) {

            // removing the old results
            $("#search-results").empty();

            // search word with Fuse
            var results = this.searchWordWithFuse(response, word);



            // TODO: why that loop?
            var values = [];
            for (var i = 0; i < results.length; i++) {
                // TODO: dirty limit to max results
                if (i < FAOSTATSearch.SEARCH_SCORE_MAX_RESULTS) {
                    this.buildSearchSingleBoxOutput(results[i].item, type);
                    values.push(results[i].item);
                }else {
                    break;
                }
            }

            // build lateral filters
            this.buildFilters(values);

            // force garbage collector
            results = null;
            values = null;
        },

        buildSearchSingleBoxOutput: function(values, type) {
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var id = randLetter + Date.now();
            $("#search-results").append("<div id='search-results_"+ id +"'><div>");
            var obj = new FAOSTATSearchSingleResult();
            obj.init(id, values, type);

            FAOSTATSearch.valuesResults.push(obj);
        },

        filterResultsByDomain: function(code){
            var boxes = FAOSTATSearch.valuesResults;
            for(var i=0; i < boxes.length; i++){
                var box = boxes[i];
                if (box.values.dc != code) {
                    $('#search-results_' + box.suffix).hide();
                }
                else {
                    $('#search-results_' + box.suffix).show();
                }
            }
        },

        filterResultsByGroup: function(code){
            $.each(FAOSTATSearch.valuesResults, function(index, value) {
                if ( value.values.gc != code) {
                    $('#search-results_' + value.suffix).hide();
                }
                else {
                    $('#search-results_' + value.suffix).show();
                }
            });
        },

        searchWordWithFuse: function(codes, word) {
            var options = {
                keys: ['label'],   // keys to search in
                includeScore: true,
                shouldSort: true,
                maxPatternLength: word.length
            }
            var f = new FAOSTATSearch.Fuse(codes, options);
            var results = f.search(word);
            f = null;
            console.log(results);
            return results;
        },

        searchWordWithLunr: function(codes, word) {

            var query = "SELECT D.GroupCode, D.GroupNameE, D.DomainCode, D.DomainNameE, I.ItemCode, I.ItemNameE, E.ElementCode, E.ElementNameE FROM domain D, DomainItem DI, item I, domainElement DE, Element E             WHERE DI.itemcode = I.itemcode            AND D.DomainCode = DI.DomainCode            AND D.DomainCode = DE.DomainCode            AND DI.DomainCode = DE.DomainCode            AND DE.ElementCode = E.ElementCode";
            var sql = {};
            sql.query = query;

            var data = {};
            data.datasource = FAOSTATSearch.datasource;
            data.json = JSON.stringify(sql);

            $.ajax({
                type : 'POST',
                url : 'http://' + FAOSTATSearch.baseurlwds + '/wds/rest/table/json',
                data : data,

                success : function(response) {
                    console.time("START");

                    var index = FAOSTATSearch.Lunr(function () {
                        this.field('itemname', {boost: 10});
                        this.field('elementname', {boost: 10});
                        this.field('groupname');
                        this.field('domainname');
                        this.ref('id')
                    });
                    console.timeEnd("START");

                    var store = {};
                    for(var i=0; i< response.length; i++) {
                        var value = {};
                        value.id = i;
                        value.itemname = response[i][5];
                        value.elementname = response[i][7];
                        value.domainname = response[i][3];
                        value.groupname = response[i][1];
                        index.add(value);
                        store[value.id] = value;
                    }


                    //index.add(codes);

                    //console.log(codes);
                    console.time("search");
                    var ids = index.search(word);
                    console.timeEnd("search");
                    console.log(ids);
                    var results = [];
                    for (var i=0; i< ids.length; i++) {
                        results.push(store[ids[i].ref]);
                    }

                    console.log(results);
                },
                error : function(err, b, c) {}
            });



            var index = FAOSTATSearch.Lunr(function () {
                this.field('label', {boost: 10})
                this.ref('id')
            });

            var store = {};
            for(var i=0; i < codes.length; i++) {
                codes[i].id = i;
                index.add(codes[i]);
                store[codes[i].id] = codes[i];
            }

            //index.add(codes);

            //console.log(codes);
            var ids = index.search(word)
            var results = [];
            for (var i=0; i< ids.length; i++) {
                results.push(store[ids[i].ref]);
            }
            console.log(results);
        },

        searchWordWithFuzzyset: function(codes, word) {
            var index = FuzzySet();

            for(var i=0; i < codes.length; i++) {
                index.add(codes[i].label);
            }

            //index.add(codes);

            //console.log(codes);
            var ids = index.get(word);
            console.log(ids);
        },

        createLunrIndex: function() {
            var query = "SELECT D.GroupCode, D.GroupNameE, D.DomainCode, D.DomainNameE, I.ItemCode, I.ItemNameE, E.ElementCode, E.ElementNameE FROM domain D, DomainItem DI, item I, domainElement DE, Element E             WHERE DI.itemcode = I.itemcode            AND D.DomainCode = DI.DomainCode            AND D.DomainCode = DE.DomainCode            AND DI.DomainCode = DE.DomainCode            AND DE.ElementCode = E.ElementCode";
            var sql = {};
            sql.query = query;

            var data = {};
            data.datasource = FAOSTATSearch.datasource;
            data.json = JSON.stringify(sql);
            $.ajax({
                type : 'POST',
                url : 'http://' + FAOSTATSearch.baseurlwds + '/wds/rest/table/json',
                data : data,

                success : function(response) {

                    // create
                    FAOSTATSearch.lunrIndex = FAOSTATSearch.Lunr(function () {
                        this.field('itemname', {boost: 10});
                        this.field('elementname', {boost: 10});
                        this.field('groupname');
                        this.field('domainname');
                        this.ref('id')
                    });

                    FAOSTATSearch.lunrStore = {};
                    for (var i = 0; i < response.length; i++) {
                        var value = {};
                        value.id = i;
                        value.itemname = response[i][5];
                        value.elementname = response[i][7];
                        value.domainname = response[i][3];
                        value.groupname = response[i][1];
                        FAOSTATSearch.lunrIndex.add(value);
                        FAOSTATSearch.lunrStore[value.id] = value;
                    }
                },
                error : function(err, b, c) {}
            });
        },

        searchWordWithLunrFull: function(word) {
            var ids = FAOSTATSearch.lunrIndex.search(word)
            var results = [];
            for (var i=0; i< ids.length; i++) {
                results.push(FAOSTATSearch.lunrStore[ids[i].ref]);
            }
            return results;
        }
    };

}
