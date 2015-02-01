GRID_SIZE = 9;
NUM_OF_BOATS = 5;

SHIPS = [
    {shipType: "Aircraft carrier", shipSize: 5},
    {shipType: "Battleship", shipSize: 4},
    {shipType: "Submarine", shipSize: 3},
    {shipType: "Destroyer", shipSize: 3},
    {shipType: "Patrol boat", shipSize: 2}
]


function AppViewModel() {
    this.instructions = ko.observable("Place ships:");

    this.ships = [];
    for(i = 0; i < SHIPS.length; i++)
        this.ships.push({ship: SHIPS[i], placed: ko.observable(false)});

}
my = {viewModel: new AppViewModel()};

ko.bindingHandlers.strikeShip = {
    update: function(element, valueAccessor) {
        if (valueAccessor())
            $(element).addClass("strikeout");
    }
}

$(document).ready(function() {
    $("input#play").prop("disabled", true);
    $("div#container").on("click", "span.cell", buttonClickHandler);
    boats = getRandBoatPos();

    // Activate knockout.js
    ko.applyBindings(my.viewModel);
});

var buttonClickHandler = function(event) {
    var id = this.id;

    // change color
    $(this).addClass(boats[id] ? "hit" : "miss");

    // update text field
    $("input#displayID").val(id);
}

var getRandBoatPos = function() {
    var boats = [];
    for(i = 0; i < NUM_OF_BOATS; i++) {
        a = (Math.floor(Math.random() * GRID_SIZE));
        b = (Math.floor(Math.random() * GRID_SIZE));
        boats[''+a+b] = true;
    }
    return boats;
}