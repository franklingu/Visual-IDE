$(function () {
    $( "#sortable1" ).find("li").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20
    });

    $(".connected-sortable").sortable({
        receive: function (e,ui) {
            copyHelper= null;
        },

        update: function (e, ui) {
            $(ui.item).find(".remove-command").on('click', function() {
                $(this).parent().remove();
            });

            console.log("changed");
        }
    });

    $('#getJson').on('click', function () {
        var obj = getSequenceJson();
        $('#feedback-area').html(JSON.stringify(obj));
    });

    var getSequenceJson = function () {
        var commands = $('#sortable2').find("li");
        var json = [];
        commands.each(function(index) {
            var command = {};
            command['title'] = $(this).find(".title").html();

            var params = $(this).find(".param");
            params.each(function(){
                command[$(this).prop('name')] = $(this).val();
            });
            json.push(command);
        });
        var obj = {};
        obj['data'] = json;
        return obj;
    }

    $('#saveJson').on('click', function () {
        var obj = getSequenceJson();
        obj['title'] = 'default-title';
        var request = $.ajax({url: '/save/', type: 'POST', data: obj, dataType: 'json'});
        request.done(function (res) {
            console.log(res['status']);
        });
    })
});

