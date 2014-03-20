
// functional programming helpers

var util = function(){
    "use strict";

    // modify all strings to have a format function
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, index) {
                return typeof args[index] !== 'undefined' ? args[index] : match;
            });
        };

        /// EX: "foo{x}".dictformat({x: "bar"}) ---> "foobar"
        String.prototype.dictformat = function(args) {
            return this.replace(/{([^}]+)}/g, function(match, name) { 
                return typeof args[name] !== 'undefined' ? args[name] : match;
            });
        };

        String.prototype.strip = function() {
            return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        };
    }

    var self = {};

    // linear interpolation
    self.lerp = function(x, min, max) {
        return x * (max - min) + min;
    }

    // USEFUL D3 COMBINATORS

    // returns a function that, given an object, will query for the given key
    self.get = function(key) {
        return function(obj) { return obj[key]; };
    }

    // returns a function that returns it's second argument (the index in D3)
    self.idx = function(d, i) {
        return i;
    }

    // Given funcion f, returns a function (elem, idx) => f(idx)
    self.appidx = function(f) {
        return function(d,i) { return f(i); };
    }

    // equivalent to compose(f, get(key))
    self.appget = function(f, key) {
        return function(obj) { return f(obj[key]); };
    }

    self.translate = function(x, y) {
        return "translate({0},{1})".format(x, y);
    }

    self.apptranslate = function(fx, fy) {
        // check if fx/fy are constants, if so, replace them with constant functions
        var cx, cy;
        if (typeof fx === 'number') {
            cx = fx;
            fx = function(d,i) { return cx; }
        }
        if (typeof fy === 'number') {
            cy = fy;
            fy = function(d,i) { return cy; }
        }

        return function(d,i) {
            return "translate({0},{1})".format(fx(d,i), fy(d,i));
        }
    }

    return self;
}();

