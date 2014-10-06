$(document).ready(function() {
    var objStr = $.cookie("obj");
    if (objStr) {
        objStr = JSON.parse(objStr);

        $.each(objStr["data"], function(index) {
            var listElement = $('<li>').addClass('ui-state-default');


            $.each(objStr["data"][index], function(k, v) {
                if (k == "title") {
                    var command = $('<div>').addClass('command');
                    var commandName = $('<div>').addClass(k)
                        .text(v);
                    command.append(commandName);
                    listElement.append(command);

                } else {

                    var param = $('<input>').attr('type', 'text')
                        .addClass('param').attr('name', k)
                        .attr('value', v);
                    listElement.append(param);

                }

            });

            $('#sortable2').append(listElement)
        });


    }

    /*$.removeCookie('obj');
    if (objStr) {
        console.log(JSON.parse(objStr));
    }*/
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
        },

        update: function(e, ui) {
            $(ui.item).find(".remove-command").on('click', function() {
                $(this).parent().remove();
            });
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

    $('#saveJson').on('click', function() {
        var obj = getSequenceJson();
        obj['title'] = 'default-title';
        var request = $.ajax({
            url: '/save/',
            type: 'POST',
            data: obj,
            dataType: 'json'
        });
        request.done(function(res) {
            console.log(res['status']);
            if (res['status'] === 'Please login first') {
                $.cookie("obj", JSON.stringify(obj));
            }
        });
        request.fail(function() {
            $.cookie("obj", JSON.stringify(obj));
        });
    });

    $('#loadJson').on('click', function() {
        var obj = {
            'title': 'default-title'
        };
        var request = $.ajax({
            url: '/load/',
            type: 'GET',
            data: obj,
            dataType: 'json'
        });
        request.done(function(res) {
            console.log(res['status']);
            console.log(res['project_title']);
            console.log(res['project_content']);
        });
    });
});