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
    this.placedShips = ko.observable(0);
    this.placedShips.increment = function() {
        // avoid registering dependency by using peek
        this(this.peek()+1);
    };

    this.ships = [];
    for(i = 0; i < SHIPS.length; i++)
        this.ships.push({ship: SHIPS[i], placed: ko.observable(false)});
    this.ships.pendingSizes = ko.utils.arrayMap(this.ships, function(el) {
        return el.ship.shipSize;
    });
    this.rangeLength = ko.observable(0);

    boats = [];
    boats[11] = true;
    
    this.play = function() {
        // remove hover handler and rebind the click handler
        $("div#container").off().on("click", "span.cell", clickHandlerPlay);
        // hide ships
        $("div#container").find("span.cell").removeClass("hit miss");
    };

}
my = {viewModel: new AppViewModel()};

ko.bindingHandlers.strike = {
    update: function(element, valueAccessor) {
        if (valueAccessor()) {
            $(element).addClass("strikeout");
            ko.contextFor(element).$root.placedShips.increment();
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
    click: function() {
        var self = this;
        $("div#container").on("mouseenter mouseleave", "span.cell", self.hover());
        return function(event) {
            self.start = self.start ? null : this.id;
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
                var range = getCellRange(+self.start, +this.id);
                my.viewModel.rangeLength(range.length);
                
                var id, validRangeLength;
                validRangeLength = my.viewModel.ships.pendingSizes.indexOf(range.length) !== -1;
                
                $("span.cell").removeClass("miss valid");
                for (var i = 0; i < range.length; i++) {
                    id = range[i].toString();
                    if (id.length < 2)
                        id = 0+id;
                    $("span.cell#"+id).addClass(validRangeLength ? "valid" : "miss");
                }
            } else {
                my.viewModel.rangeLength(0);
                $("span.cell").removeClass("miss valid");
            }
        };
    } 
};

clickHandlerPlay = function(event) {
    var id = this.id;

    // change color
    $(this).addClass(boats[id] ? "hit" : "miss");
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