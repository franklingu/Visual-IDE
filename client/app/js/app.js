
$(function() {
	$( "#sortable1" ).find("li").draggable({
	    connectToSortable: ".connectedSortable",
	    forcePlaceholderSize: false,
      helper: "clone",
      distance: 20
	});
    $(".connectedSortable").sortable({
        receive: function(e,ui) {
            copyHelper= null;
        },

        update: function(e, ui){
          $(ui.item).find(".remove-command").on('click', function() {
            $(this).parent().remove();
          });
        }
    });
});