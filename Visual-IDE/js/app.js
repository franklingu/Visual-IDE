$(document).ready(function() {
    var objStr = $.cookie("obj");

    loadFromJSON(objStr);
    $.removeCookie('obj');
});

$(function() {
    $("#sortable1").find("li").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20
    });

    $(".connected-sortable").sortable({
        receive: function(e, ui) {
            copyHelper = null;
            var obj = getSequenceJson();
            $.cookie("obj", JSON.stringify(obj));
        },

        update: function(e, ui) {
            $(ui.item).find(".remove-command").on('click', function() {
                $(this).parent().remove();
            });
            var obj = getSequenceJson();
            $.cookie("obj", JSON.stringify(obj));
        }
    });

    $('#getJson').on('click', function() {
        var obj = getSequenceJson();
        $('#feedback-area').html(JSON.stringify(obj));
    });

    var getSequenceJson = function() {
        var commands = $('#sortable2').find("li");
        var json = [];
        commands.each(function(index) {
            var command = {};
            command['title'] = $(this).find(".title").html();

            var params = $(this).find(".param");
            params.each(function() {
                command[$(this).prop('name')] = $(this).val();
            });
            json.push(command);
        });
        var obj = {};
        obj['data'] = json;
        return obj;
    }

    $('.save-title').on('click', function () {
        var obj = getSequenceJson();
        title = $('#saveTitleName').val();
        if (!title) {
            alert("Please provide a name for the program to be saved");
            return false;
        }

        obj['title'] = title;
        var request = $.ajax({url: '/save/', type: 'POST', data: obj, dataType: 'json'});
        request.done(function (res) {

            console.log(res['status']);
            if (res['status'] === 'Please login first') {
                $.cookie("obj", JSON.stringify(obj));
            }
        });
        request.fail(function() {
            $.cookie("obj", JSON.stringify(obj));
        });

        return false;
    });

    $('.load-title').on('click', function () {
        var obj = {'project_title': $(this).attr('data-value')};
        var request = $.ajax({url: '/load/', type: 'GET', data: obj, dataType: 'json'});
        request.done(function (res) {
            console.log(res['status']);
            loadFromJSON(JSON.stringify(res));
        });
    });
});

function loadFromJSON(objStr){
    if (objStr) {
        $('#sortable2').empty();
        objStr = JSON.parse(objStr);

        function loadJSONData(obj) {
            $.each(obj, function(index) {
                var listElement = $('<li>').addClass('ui-state-default');

                $.each(obj[index], function(k, v) {
                    if (k == "title") {
                        var command = $('<div>').addClass('command');
                        var commandName = $('<div>').addClass(k).text(v);
                        command.append(commandName);
                        listElement.append(command);
                    } else {
                        var param = $('<input>').attr('type', 'text')
                            .addClass('param').attr('name', k)
                            .attr('value', v);
                        listElement.append(param);
                    }

                });

                $('#sortable2').append(listElement);
            });
        }

        loadJSONData(objStr.data);
    }
}
