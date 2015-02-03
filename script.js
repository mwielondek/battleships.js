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
    
    this.play = function() {
        console.log("STARTING THE GAME");
    }

}
my = {viewModel: new AppViewModel()};

ko.bindingHandlers.strikeShip = {
    update: function(element, valueAccessor) {
        if (valueAccessor()) {
            $(element).addClass("strikeout");
            ko.contextFor(element).$root.placedShips.increment();
        }
    }
}


$(document).ready(function() {
    $("div#container").on("click", "span.cell", buttonClickHandler);

    // Activate knockout.js
    ko.applyBindings(my.viewModel);
});

var buttonClickHandler = function(event) {
    var id = this.id;

    // change color
    $(this).addClass(boats[id] ? "hit" : "miss");
}