GRID_SIZE = 9;
NUM_OF_BOATS = 5;

$(document).ready(function() {
    $("div#container").on("click", "span.cell", buttonClickHandler);
    boats = getRandBoatPos();
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