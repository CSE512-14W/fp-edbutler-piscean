
vis = function(){
    "use strict";

    var U = util;

    /**
     * Manages sets of related brushes and links.
     */
    var linkset = function() {

        var brushes = [];
        var links = [];

        var self = {};

        /* Brush clearing semantics:
         *  When a new brush start occurs, look at all other brushes on the same link.
         *  If any of these brushes are non-empty, clear ALL links associated with that brush,
         *  and also clear the brush itself.
         */
        function onbrushstart(curbrush) {
            return function() {
                _.each(brushes, function(d) {
                    if (curbrush.brush !== d.brush && _.intersection(d.links,curbrush.links).length > 0 && !d.brush.empty()) {
                        d.brush.clear();
                        d.brush(d.vis);
                        _.each(d.links, function(link_index) {
                            links[link_index].selection([]);
                        });
                    }
                });
            };
        }

        /** Creates a new link. */
        self.create_link = function() {

            var selection = [];
            var listeners = [];

            var link = {
                id: links.length
            };
            links.push(link);

            link.selection = function(newsel) {
                if (typeof newsel === 'undefined') {
                    return selection;
                } else {
                    selection = newsel;
                    _.each(listeners, function(x) { x(newsel); });
                }
            };

            link.add_change_listener = function(fn) {
                listeners.push(fn);
                return link;
            };

            return link;
        }

        /**
         * Adds a brush to the registered set of brushes.
         * @brush The d3 brush object
         * @vis The d3 selection to call brush on.
         */
        self.add_brush = function(brush, vis, links) {
            var b = {brush:brush, vis:vis, links:_.map(links, U.get('id'))};
            brushes.push(b);
            brush.on('brushstart.linkset', onbrushstart(b));
            return self;
        }

        return self;
    }


    var self = {};

    self.linkset = linkset;

    return self;
}();

