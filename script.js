GRID_SIZE = 9;

SHIPS = [
    {shipType: "Aircraft carrier", shipSize: 5},
    {shipType: "Battleship", shipSize: 4},
    {shipType: "Submarine", shipSize: 3},
    {shipType: "Destroyer", shipSize: 3},
    {shipType: "Patrol boat", shipSize: 2}
]

// Knockout.js stuff
var AppViewModel = function() {
    // Observables
    this.instructions = ko.observable("Place ships:");
    this.mode = ko.observable("PLACE");
    this.placedShips = ko.observable(0);
    this.hits = ko.observable(0);
    this.shots = ko.observable(0);
    this.range = ko.observableArray([]);
    this.rangeLength = ko.computed(function() {
        return this.range().length;
    }, this);
    this.accuracy = ko.computed(function() {
        if (this.shots() < 1) return 0;
        return Math.floor(this.hits()/this.shots() * 100);
    }, this);

    // Other variables
    this.ships = [];
    this.shipPos = [];

    for(i = 0; i < SHIPS.length; i++)
        this.ships.push({ship: SHIPS[i], placed: ko.observable(false)});
    this.ships.pendingSizes = ko.utils.arrayMap(this.ships, function(el) {
        return el.ship.shipSize;
    });

    // Click functions
    this.play = function() {
        // remove hover handler and rebind the click handler
        $("div#container").off().on("click", "span.cell", eventHandlers.play);
        // hide ships
        $("div#container").find("span.cell").removeClass("placed valid miss");
        // enter play mode
        this.instructions("PLAY!");
        this.mode("PLAY");
    };

    this.playAgain = function() {
        // reset
        location.reload();
    };

    // Custom binding handlers
    ko.bindingHandlers.strike = {
        update: function(element, valueAccessor) {
            if (valueAccessor()) {
                $(element).addClass("strikeout");
                var rootContext = ko.contextFor(element).$root;
                rootContext.increment(rootContext.placedShips);
            }
        }
    };

    // Helper functions
    this.increment = function(observable) {
        // avoid registering dependency by using peek
        observable(observable.peek()+1);
    };

    this.shipPos.getNumOfCells = function() {
        // cached for better perf.
        var res = this.getNumOfCells.cache || null;
        if (res) return res;
        this.getNumOfCells.cache = ko.utils.arrayFilter(this, function(el) {
            return el;
        }).length;
        return this.getNumOfCells.cache;
    };   
}
// create globally accessible ref to the view model
viewModel = new AppViewModel();

// Click/hover handlers
var eventHandlers = {
    place: {
        start: null,
        range: viewModel.range,
        click: function() {
            var self = this;
            $("div#container").on("mouseenter mouseleave", "span.cell", self.hover());
            return function(event) {
                // set starting cell or reset on subsequent click
                self.start = self.start ? null : this.id;
                var rangeLen = viewModel.rangeLength.peek();
                if (!self.start && rangeUtils.isValid(rangeLen)) {
                    // Player just placed ship
                    
                    // add ship position
                    for (var i in self.range()) {
                        viewModel.shipPos[self.range()[i]] = true;
                    }
                    // remove range length from pendinding sizes
                    var ps = viewModel.ships.pendingSizes;
                    ps.splice(ps.indexOf(rangeLen), 1);
                    // mark next ship with fitting size as placed
                    for (var i in viewModel.ships) {
                        var ship = viewModel.ships[i];
                        if (ship.placed.peek()) continue;
                        if (ship.ship.shipSize == rangeLen) {
                            ship.placed(true);
                            rangeUtils.addClass(self.range(), "placed");
                            break;
                        }
                    }
                    // clean up
                    self.range.removeAll();
                }
                // always clear 'temp' styles on click
                $("span.cell").removeClass("miss valid hit");
            };
        },
        hover: function() {
            var self = this;
            return function(event) {
                // don't do anything if start cell hasn't been chosen
                if (!self.start) return;
                // check if cell is in the same row/column
                if (this.id[0].indexOf(self.start[0]) !== -1 || 
                    this.id[1].indexOf(self.start[1]) !== -1) {
                    // unary plus to convert str -> num
                    self.range(rangeUtils.getCellRange(+self.start, +this.id));
                    // check if range corresponds to a yet-to-be-placed ship
                    var cssClass = rangeUtils.isValid(self.range().length) ? "valid" : "miss";
                    // check if new range doesnt collide with already placed ships
                    var collision = false;
                    for (var i in self.range()) {
                        if (viewModel.shipPos[self.range()[i]]) {
                            cssClass = "hit";
                            collision = true;
                            break;
                        }
                    }
                    // reset cell coloring
                    $("span.cell").removeClass("miss valid hit");
                    rangeUtils.addClass(self.range(), cssClass);
                    // disallow placing ship if it collides with another
                    if (collision)
                        self.range([]);
                } else {
                    self.range.removeAll();
                    $("span.cell").removeClass("miss valid hit");
                }
            };
        } 
    },

    play: function(event) {
        // don't coutn already clicked cells
        if ($(this).hasClass("hit") || $(this).hasClass("miss"))
            return;        
        var id = this.id;
        var hit = viewModel.shipPos[+id];
        // increment hits and shots
        viewModel.increment(viewModel.shots);
        if (hit) {
            viewModel.increment(viewModel.hits);
            if (viewModel.hits() == viewModel.shipPos.getNumOfCells()) {
                // game over!
                viewModel.instructions("You win! Such amaze! Wow!");
                viewModel.mode("FINISHED");
                // unbind event handlers
                $("div#container").off();
            }
        }
        // change color of the cell
        $(this).addClass(hit ? "hit" : "miss");
    }
}

// Range utils
var rangeUtils = {
    getCellRange: function(start, end) {
        // swap if start > end
        if (start > end) {
            var t = start;
            start = end;
            end = t;
        }
        var res = [];
        if (end - start > GRID_SIZE-1) {
            // vertical range
            for (; start <= end;) {
                res.push(start);
                start += 10;
            }
            return res;
        }
        // otherwise horizontal range
        return ko.utils.range(start, end);
    },

    isValid: function(rangeLen) {
        return viewModel.ships.pendingSizes.indexOf(rangeLen) !== -1;
    },

    addClass: function(range, cssClass) {
        for (var i = 0; i < range.length; i++) {
            var id = range[i].toString();
            // add padding zero if necessary
            if (id.length < 2)
                id = 0+id;
            $("span.cell#"+id).addClass(cssClass);
        }
    }
}


$(document).ready(function() {
    // activate click handler
    $("div#container").on("click", "span.cell", eventHandlers.place.click());

    // activate knockout.js
    ko.applyBindings(viewModel);
});