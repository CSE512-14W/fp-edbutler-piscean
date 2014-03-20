
var vgrid = function() {
    'use strict';

    var self = {};

    var U = util;
    var V = vis;

    var size = {
        border: 10,
        cell_width: 7,
        concept_label_width: 120
    };

    var animation_duration = 1000;

    function flatten_matrix(mat) {
        return _.flatten(_.map(mat, function(row, ridx) {
            return _.map(row, function(item, cidx) {
                return {value:item, row:ridx, col:cidx};
            });
        }));
    }

    /*
        data: {
            concept_labels: [string]
            stage_labels: [string]
            instances: [[int]]
            linkset: linkset
            dataset_index: int
        }

        selection: [index of concept]
     */

    self.cell_table = function(data) {
        var self = {};

        var num_concepts = data.concept_labels.length;
        var num_stages = data.stage_labels.length;

        var cell_width = size.cell_width;
        var cell_height = 20;
        var grid_width = cell_width * num_stages;
        var grid_height = cell_height * num_concepts;
        var border = size.border;
        var vert_label_width = size.concept_label_width;
        var horz_label_height = 25;

        var xscl = d3.scale.linear()
            .domain([0,num_stages])
            .range([0,grid_width]);
        var yscl = d3.scale.linear()
            .domain([0,num_concepts])
            .range([0,grid_height]);

        var concept_labels;
        var cell;
        var svg;
        var svg_height = grid_height + horz_label_height + 2 * border;

        var fill_colors = ['#1f77b4', '#ff7f0e', '#d62728'];

        var widgit_id = 'grid-' + data.dataset_index;

        function color_scale(color_index) {
            var fill_color = fill_colors[color_index];
            var start_color = d3.interpolateRgb('white',fill_color)(.35);

            var color = _.map(data.instancesT, function(row) {
                return d3.scale.linear()
                    .domain([0,d3.max(row)])
                    .range([start_color, fill_color]);
            });

            return function(d) {
                return d.value <= 0 ? 'none' : color[d.col](d.value);
            };
        }

        self.initialize = function(svg_elem) {
            svg = d3.select(svg_elem)
                .attr('width', grid_width + vert_label_width + 2 * border)
                .attr('height', svg_height);

            var grid = svg.append('g')
                .attr('transform', U.translate(border + vert_label_width, border));

            var concept_labels_g = svg.append('g')
                .attr('transform', U.translate(border, border));

            var cell_color = color_scale(data.dataset_index);
            var select_color = color_scale(2);

            cell = grid.selectAll('rect')
                .data(flatten_matrix(data.instances))
            .enter().append('rect')
                .attr('width', cell_width)
                .attr('height', cell_height)
                .attr('x', function(d) { return xscl(d.row) + 0.5; })
                .attr('y', function(d) { return yscl(d.col) + 0.5; })
                .attr('class', 'cell')
                .style('fill', cell_color);

            var tickFmt = d3.format("  0");
            var xaxis = d3.svg.axis()
                .tickSize(4)
                .tickFormat(tickFmt)
                .scale(xscl)
                .orient('bottom');

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', U.translate(border + vert_label_width, grid_height + border + 5))
                .call(xaxis);

            var brush = d3.svg.brush()
                .x(xscl)
                .on('brush', function() {
                    var extent = d3.event.target.extent();
                    data.link.selection(_.map(data.stage_labels, function(d,i) {
                        return extent[0] <= i & i < extent[1];
                    }));
                });

            var g_brush = grid.append('g')
                .attr('class', 'brush')
                .call(brush);

            g_brush.selectAll('rect')
                .attr('y', 0)
                .attr('height', grid_height);

            data.linkset
                .add_brush(brush, g_brush, [data.link]);

            data.link
                .add_change_listener(function(sel) {
                    cell.style('fill', function(d) {
                        return sel[d.row] ? select_color(d) : cell_color(d);
                    });
                });

            concept_labels = concept_labels_g.selectAll('text')
                .data(data.concept_labels)
            .enter().append('text')
                .attr('class', 'vert-label')
                .attr('x', vert_label_width)
                .attr('dx', -5)
                .attr('y', U.appidx(yscl))
                .attr('dy', cell_height / 2.0)
                .text(_.identity);
        };

        self.set_ordering = function(mapping) {
            cell
                .transition().duration(animation_duration)
                .attr('y', function(d) { return yscl(mapping[d.col]) + 0.5; });
            concept_labels
                .transition().duration(animation_duration)
                .attr('y', function(d,i) { return yscl(mapping[i]); });
        };

        self.set_appear = function(do_show) {
            svg.transition().duration(animation_duration)
                .attr('height', do_show ? svg_height : 0);
        }

        return self;
    };

    self.bar_chart = function(data, full_data) {
        var self = {};

        var num_stages = data.stage_labels.length;
        var bar_width = size.cell_width;
        var max_bar_height = 100;
        var chart_width = bar_width * num_stages;
        var border = size.border;
        var margin = {top: 0, right: 20, bottom: 10, left: size.concept_label_width};
        var gap = 25;

        function total_width() { return num_stages * bar_width + margin.left + margin.right + 2 * border; }
        var single_group_height = max_bar_height + margin.top + margin.bottom;
        function total_height(num_charts) { return num_charts * single_group_height + (num_charts - 1) * gap + 2 * border; }

        var group;
        var svg;

        var xscl = d3.scale.linear()
            .domain([0, num_stages])
            .range([0, num_stages * bar_width]);

        var fill_class = 'cell fill-' + data.dataset_index;
        var g_brush;
        var rects = [];

        self.initialize = function(svg_elem) {
            svg = d3.select(svg_elem);
            group = svg.append('g')
                .attr('transform', U.translate(border, border));
            self.set_selection([]);

            var brush = d3.svg.brush()
                .x(xscl)
                .on('brush', function() {
                    var extent = d3.event.target.extent();
                    data.link.selection(_.map(data.stage_labels, function(d,i) {
                        return extent[0] <= i & i < extent[1];
                    }));
                });

            g_brush = svg.append('g')
                .attr('class', 'brush')
                .attr('transform', U.translate(border + margin.left, 0))
                .call(brush);

            data.linkset
                .add_brush(brush, g_brush, [data.link]);

            data.link
                .add_change_listener(function(sel) {
                    _.each(rects, function(rect) {
                        rect.classed('selected', function(d,i) {
                            return sel[i];
                        });
                    });
                });
        }

        function draw(g_elem, row, row_index, yscl, concept_index) {
            var g = d3.select(g_elem);
            var rect = g.append('g')
                .attr('transform', U.translate(margin.left, margin.top))
                .selectAll('rect')
                .data(row)
              .enter().append('rect')
                .attr('class', fill_class)
                .classed('selected', function(d,i) { return data.link.selection()[i]; })
                .attr('x', function(d, i) { return xscl(i); })
                .attr('y', function(d) { return yscl(d); })
                .attr('width', bar_width)
                .attr('height', function(d) { return max_bar_height - yscl(d); });

            var tickFmt = d3.format("  0");
            var xaxis = d3.svg.axis()
                .tickSize(4)
                .tickFormat(tickFmt)
                .scale(xscl)
                .orient('bottom');

            g.append('g')
                .attr('class', 'axis')
                .attr('transform', U.translate(margin.left, max_bar_height + margin.top))
                .call(xaxis);

             var yaxis = d3.svg.axis()
                .ticks(2)
                .tickSize(4)
                .tickFormat(tickFmt)
                .scale(yscl)
                .orient('right');

            g.append('g')
                .attr('class', 'axis')
                .attr('transform', U.translate(num_stages * bar_width + margin.left, margin.top))
                .call(yaxis)


            g.append('text')
                .attr('class', 'vert-label')
                .attr('x', margin.left - 10)
                .attr('y', margin.top + max_bar_height / 2)
                .text(data.concept_labels[concept_index]);

            return rect;
        }

        self.set_selection = function(concepts) {
            group.selectAll('g').remove();
            var new_height = concepts.length > 0 ? total_height(concepts.length) : 0
            svg
                .attr('width', total_width())
              .transition().duration(animation_duration)
                .attr('height', new_height);

            if (concepts.length == 0) return;

            g_brush.selectAll('rect')
                .attr('y', 0)
                .attr('height', new_height);

            var instances = _.map(concepts, function(d) { return data.instancesT[d]; });

            var subgroups = group.selectAll('g')
                .data(instances)
              .enter().append('g')
                .attr('transform', function(d,i) { return U.translate(0, (single_group_height + gap) * i); });

            var max_y = d3.max(full_data, function(item) {
                return d3.max(concepts, function(idx) { return d3.max(item.instancesT[idx]); });
            });

            var yscl = d3.scale.linear()
                .domain([0, max_y])
                .range([max_bar_height, 0]);

            rects = [];
            subgroups.each(function(d,i) {
                rects.push(draw(this, d, i, yscl, concepts[i]));
            });
        }

        return self;
    }

    self.projection_graph = function(data_list) {
        var self = {};

        function jitter() {
            return 0.03 * (Math.random() - 0.5);
        }

        var widgit_id = 'manifold_plot';

        self.initialize = function(svg_elem) {
            var plot_width = 500;
            var plot_height = plot_width;
            var border = 10;

            var scale = d3.scale.linear()
                .domain([0,1])
                .range([0,plot_width]);

            var svg = d3.select(svg_elem)
                .attr('width', plot_width + 2 * border)
                .attr('height', plot_height + 2 * border);

            var plot = svg.append('g')
                .attr('transform', U.translate(border, border));

            var line = d3.svg.line()
                .x(_.compose(scale, U.get(0)))
                .y(_.compose(scale, U.get(1)));

            var nodes = [];

            var brush = d3.svg.brush()
                .x(scale)
                .y(scale)
                .on('brush', function() {
                    var extent = d3.event.target.extent();
                    _.each(data_list, function(data, idx) {
                        data.link.selection(_.map(nodes[idx].data(), function(d) {
                            return extent[0][0] <= d[0] && d[0] < extent[1][0] && extent[0][1] <= d[1] && d[1] < extent[1][1];
                        }));
                    });
                });

            var g_brush = plot.append('g')
                .attr('class', 'brush')
                .call(brush);

            function add_graph(data, idx) {
                // jitter all the path positions
                _.each(data.path, function(d) {
                    d[0] += jitter();
                    d[1] += jitter();
                });

                plot.append('path')
                    .datum(data.path)
                    .attr('class', 'path stroke-' + idx)
                    .attr('d', line);

                var fill_class = 'fill-' + idx;

                var node = plot.selectAll('.' + fill_class)
                    .data(data.path)
                .enter().append('circle')
                    .attr('r', 6)
                    .attr('cx', _.compose(scale, U.get(0)))
                    .attr('cy', _.compose(scale, U.get(1)))
                    .attr('class', 'node ' + fill_class);

                node.append('title')
                    .text(function(d,i) { return 'Stage {0} of progression {1}'.format(i, data.name); });

                data.link
                    .add_change_listener(function(sel) {
                        node.classed('selected-node', function(d,i) {
                            return sel[i];
                        });
                    });

                nodes[idx] = node;
            }

            _.each(data_list, add_graph); 
            data_list[0].linkset.add_brush(brush, g_brush, _.map(data_list, U.get('link')));
        }

        return self;
    }

    return self;
}();

