GRID_SIZE = 9;

SHIPS = [
    {shipType: "Aircraft carrier", shipSize: 5},
    {shipType: "Battleship", shipSize: 4},
    {shipType: "Submarine", shipSize: 3},
    {shipType: "Destroyer", shipSize: 3},
    {shipType: "Patrol boat", shipSize: 2}
]


function AppViewModel() {
    this.instructions = ko.observable("Place ships:");
    this.mode = ko.observable("PLACE");
    this.placedShips = ko.observable(0);
    this.increment = function(observable) {
        // avoid registering dependency by using peek
        observable(observable.peek()+1);
    };

    this.ships = [];
    for(i = 0; i < SHIPS.length; i++)
        this.ships.push({ship: SHIPS[i], placed: ko.observable(false)});
    this.ships.pendingSizes = ko.utils.arrayMap(this.ships, function(el) {
        return el.ship.shipSize;
    });
    this.rangeLength = ko.observable(0);

    shipPos = [];
    shipPos.getNumOfCells = function() {
        // cached for better perf.
        var res = this.numOfCells || null;
        if (res) return res;
        this.numOfCells = ko.utils.arrayFilter(shipPos, function(el) {
            return el;
        }).length;
        return this.numOfCells;
    };
    
    this.play = function() {
        // remove hover handler and rebind the click handler
        $("div#container").off().on("click", "span.cell", clickHandlerPlay);
        // hide ships
        $("div#container").find("span.cell").removeClass("placed valid miss");
        this.instructions("PLAY!");
        this.mode("PLAY");
    };

    this.hits = ko.observable(0);
    this.shots = ko.observable(0);
    this.accuracy = ko.computed(function() {
        if (this.shots() < 1) return 0;
        return Math.floor(this.hits()/this.shots() * 100);
    }, this);

    this.playAgain = function() {
        // reset
        location.reload();
    }

}
my = {viewModel: new AppViewModel()};

ko.bindingHandlers.strike = {
    update: function(element, valueAccessor) {
        if (valueAccessor()) {
            $(element).addClass("strikeout");
            var rootContext = ko.contextFor(element).$root;
            rootContext.increment(rootContext.placedShips);
        }
    }
}


$(document).ready(function() {
    $("div#container").on("click", "span.cell", clickHandlerPlace.click());

    // Activate knockout.js
    ko.applyBindings(my.viewModel);
});

clickHandlerPlace = {
    start: null,
    current: null,
    range: [],
    click: function() {
        var self = this;
        $("div#container").on("mouseenter mouseleave", "span.cell", self.hover());
        return function(event) {
            self.start = self.start ? null : this.id;
            var rangeLen = my.viewModel.rangeLength.peek();
            if (!self.start && rangeIsValid(rangeLen)) {
                // player just placed ship
                
                // add ship position
                for (var i in self.range) {
                    shipPos[self.range[i]] = true;
                }
                
                // remove size from pendinding sizes
                var arr = my.viewModel.ships.pendingSizes;
                arr.splice(arr.indexOf(rangeLen), 1);

                // mark ship as placed
                for (var i = 0; i < my.viewModel.ships.length; i++) {
                    var ship = my.viewModel.ships[i];
                    if (ship.placed.peek()) continue;
                    if (ship.ship.shipSize == rangeLen) {
                        ship.placed(true);
                        rangeAddClass(self.range, "placed");
                        break;
                    }
                }

                // clean up
                self.range = [];
                my.viewModel.rangeLength(0);
            }
            $("span.cell").removeClass("miss valid hit");
        };
    },
    hover: function() {
        var self = this;
        return function(event) {
            if (!self.start) return;
            self.current = this.id;
            
            // check if cell is in the same row/column
            if (this.id[0].indexOf(self.start[0]) !== -1 || 
                this.id[1].indexOf(self.start[1]) !== -1) {
                // unary plus to convert str -> num
                self.range = getCellRange(+self.start, +this.id);

                var cssClass = rangeIsValid(self.range.length) ? "valid" : "miss";

                // check if new range doesnt collide
                // with already placed ships
                var collision = false;
                for (var i in self.range) {
                    if (shipPos[self.range[i]]) {
                        cssClass = "hit";
                        collision = true;
                        break;
                    }
                }

                my.viewModel.rangeLength(collision ? 0 : self.range.length);
                
                $("span.cell").removeClass("miss valid hit");
                rangeAddClass(self.range, cssClass);
            } else {
                self.range = [];
                my.viewModel.rangeLength(0);
                $("span.cell").removeClass("miss valid hit");
            }
        };
    } 
};

clickHandlerPlay = function(event) {
    if ($(this).hasClass("hit") || $(this).hasClass("miss"))
        return;
    
    var id = this.id;
    var hit = shipPos[+id];
    // inc hits and shots
    my.viewModel.increment(my.viewModel.shots);
    if (hit) {
        my.viewModel.increment(my.viewModel.hits);
        if (my.viewModel.hits() == shipPos.getNumOfCells()) {
            // game over!
            my.viewModel.instructions("You win! Such amaze! Wow!");
            my.viewModel.mode("FINISHED");
            $("div#container").off();
        }
    }

    // change color
    $(this).addClass(hit ? "hit" : "miss");
}

getCellRange = function(start, end) {
    // sort
    if (start > end) {
        var t = start;
        start = end;
        end = t;
    }
    var res = [];
    var diff = end - start;
    if (diff > GRID_SIZE-1) {
        // vertical range
        for (; start <= end;) {
            res.push(start);
            start += 10;
        }
        return res;
    }
    // otherwise horizontal range
    res = ko.utils.range(start, end);
    return res;
}

rangeIsValid = function(rangeLen) {
    return my.viewModel.ships.pendingSizes.indexOf(rangeLen) !== -1;
}

rangeAddClass = function(range, cssClass) {
    for (var i = 0; i < range.length; i++) {
        var id = range[i].toString();
        if (id.length < 2)
            id = 0+id;
        $("span.cell#"+id).addClass(cssClass);
    }
}