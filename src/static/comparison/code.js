
(function() {
    'use strict';

    var U = util;
    var V = vis;

    function sort_concepts(data, sort_type) {
        var mapping;
        var cl = data[0].concept_labels;

        function get_intro(dataset) {
            var intro_stages = _.map(dataset.instancesT, function(row,i) {
                var idx = _.findIndex(row, function(d) { return d > 0; });
                // if smoething never shows up, it should be last
                return idx < 0 ? row.length : idx;
            });
            var c2p = _.sortBy(_.range(0,cl.length), function(d,i) { return intro_stages[i]; });
            return _.map(cl, function(d,i) { return c2p.indexOf(i); });
        }

        switch (sort_type) {
        case 'default':
            mapping = _.range(0, cl.length);
            break;
        case 'alpha':
            mapping = _.map(cl.slice().sort(), function(c) { return cl.indexOf(c); })
            break;
        case 'intro0':
            mapping = get_intro(data[0]);
            break;
        case 'intro1':
            mapping = get_intro(data[1]);
            break;
        case 'cluster':
            alert("NOT IMPLEMENTED!");
            break;
        }

        return mapping;
    }

    function go(plan1, plan2, prj) {
        var raws = [plan1, plan2];
        var linkset = V.linkset();

        var data = _.map(raws, function(d,i) {
            var rv = d.data;
            rv.name = d.name;
            rv.concept_labels = prj.concept_labels;
            rv.instances = prj.projections[i].instances;
            rv.instancesT = d3.transpose(rv.instances);
            rv.path = prj.projections[i].path;
            rv.link = linkset.create_link();
            rv.linkset = linkset;
            rv.dataset_index = i;
            return rv;
        });

        _.each(data, function(d,i) { $('#title-' + i).text(d.name); });

        var grids = _.map(data, function(d) { return vgrid.cell_table(d); });
        _.each(grids, function(g,i) { g.initialize($('#grid-' + i)[0]); });
        var bars = _.map(data, function(d) { return vgrid.bar_chart(d, data); });
        _.each(bars, function(g,i) { g.initialize($('#bar-' + i)[0]); });
        var plot = vgrid.projection_graph(data);
        plot.initialize($('#plot')[0]);

        var sortfn = $('#sort-fn');
        sortfn.val('default');
        sortfn.change(function() {
            var mapping = sort_concepts(data, sortfn.val());
            _.each(grids, function(g) { g.set_ordering(mapping); });
        });

        var selectfn = $('#select-fn');
        function onchange() {
            var selected = _.map(selectfn[0].selectedOptions, function(d) { return parseInt(d.value); });
            _.each(grids, function(g) { g.set_appear(selected.length == 0); });
            _.each(bars, function(g) { g.set_selection(selected); });
        }

        $('#clear-select-button').click(function() {
            $('#select-fn').val(null);
            onchange();
        });

        d3.select('#select-fn')
            .attr('size', prj.concept_labels.length)
          .selectAll('option')
            .data(prj.concept_labels)
          .enter().append('option')
            .attr('value', function(d,i){return i;})
            .text(_.identity);

        selectfn.change(onchange);
    }

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    }

    function query_datafile(datalist, url, callback) {
        var select = d3.select('body').append('select');
        select.append('option')
            .text('-- SELECT A DATASET --');
        // don't actually want a selection, so put a made up element here
        select.selectAll('foo')
            .data(datalist.files)
        .enter().append('option')
            .attr('value', _.identity)
            .text(_.identity);

        select.on('change', function() {
            var v = this.options[this.selectedIndex].value;
            select.remove();
            d3.json(url + v, function(error, result) {
                callback(error, {name:v, data:result});
            });
        });
    }

    $(function() {
        var url = '/data/plan/',
            a_param = getURLParameter("a"),
            b_param = getURLParameter("b");
        if (a_param && b_param) {
            d3.json(url + a_param, function(error, d1r) {
                var d1 = {name:a_param, data:d1r};
                d3.json(url + b_param, function(error, d2r) {
                        var d2 = {name:b_param, data:d2r};
                        d3.json('/data/project?func=mds&files=' + JSON.stringify([d1.name, d2.name]), function(error, prj) {
                            go(d1, d2, prj);
                        })
                })
            });
         } else {
            d3.json('/data/', function(data) {
                query_datafile(data, url, function(error, d1) {
                    query_datafile(data, url, function(error, d2) {
                        d3.json('/data/project?func=mds&files=' + JSON.stringify([d1.name, d2.name]), function(error, prj) {
                            go(d1, d2, prj);
                        });
                    });
                });
            });
        }
    });
}());

