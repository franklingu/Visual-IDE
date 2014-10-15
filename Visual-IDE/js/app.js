$(document).ready(function() {
    var objStr = $.cookie("obj");
    loadFromJSON(objStr);
});

$(function() {
    $("#sortable1").find("li").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20
    });

    $(".sprite").draggable({containment: "parent"});
    $(".feedback-area").droppable();

    $(".connected-sortable").sortable({
        receive: function(e, ui) {
            copyHelper = null;
            var obj = getSequenceJson();
            $.cookie("obj", JSON.stringify(obj));
        },
        update: function(e, ui) {
            $(ui.item).find(".remove-command").removeClass('hide').on('click', function() {
                $(this).closest('.command-container').remove();
                var obj = getSequenceJson();
                $.cookie("obj", JSON.stringify(obj));
            });
            var obj = getSequenceJson();
            $.cookie("obj", JSON.stringify(obj));
        }
    });

    // this is only for debugging purposes
    $('#getJson').on('click', function() {
        var obj = getSequenceJson();

        $.each(obj.data, function(index) {
            var commandName;
            var params = [];
            $.each(obj.data[index], function(k, v) {
                if (k == "title")
                    commandName = v;
                else
                    params.push(v);
            });

            updateSprite(commandName, params);
        });
    });

    $('.save-title').on('click', function() {
        var obj = {
            'project_content': JSON.stringify(getSequenceJson()['data'])
        };
        var title = $('#saveTitleName').val();
        if (!title) {
            alert("Please provide a name for the program to be saved");
            return false;
        }

        obj['project_title'] = title;
        var request = $.ajax({
            url: '/save/',
            type: 'POST',
            data: obj,
            dataType: 'json',
            beforeSend: function(xhr) {
                $('.save-title').attr('disabled', true);
            }
        });

        request.done(function(res) {
            syncTitlesList(res['titles_list']);
            if (res['status'] === 'Please login first') {
                $.cookie("obj", JSON.stringify(obj));
                $('.alert-danger').children('span').html('Please login before saving your work.');
                $('.alert-danger').slideDown(500).delay(2000).slideUp(500);
            } else {
                $('.alert-success').children('span').html('Your program has been saved!');
                $('.alert-success').slideDown(500).delay(2000).slideUp(500);
            }
            $('.save-title').attr('disabled', false);
        });
        request.fail(function() {
            $.cookie("obj", JSON.stringify(obj));
            $('.alert-danger').children('span').html('An internal error occurred. Please try again later.');
            $('.alert-danger').slideDown(500).delay(2000).slideUp(500);
            $('.save-title').attr('disabled', false);
        });

        return false;
    });

    $('#load-titles-list').on('click', '.load-project', function() {
        var obj = {
            'project_title': $(this).html()
        };
        var request = $.ajax({
            url: '/load/',
            type: 'GET',
            data: obj,
            dataType: 'json',
            beforeSend: function(xhr) {
                $('.load-title').attr('disabled', true);
            }
        });

        request.done(function(res) {
            loadFromJSON(JSON.stringify(res));
            $('#saveTitleName').val(res['title']);
            $('.alert-success').children('span').html('Your program has been loaded!');
            $('.alert-success').slideDown(500).delay(2000).slideUp(500);
            $('.load-title').attr('disabled', false);
        });

        request.fail(function() {
            $('.alert-danger').children('span').html('An internal error occurred. Please try again later.');
            $('.alert-danger').slideDown(500).delay(2000).slideUp(500);
            $('.load-title').attr('disabled', false);
        });
    });

    $('#load-titles-list').on('click', '.remove-project', function() {
        var project_title = $(this).prev().html();
        var obj = {
            'project_title': project_title
        };
        var request = $.ajax({
            url: '/delete/',
            type: 'POST',
            data: obj,
            dataType: 'json',
            beforeSend: function(xhr) {
                $('.remove-project').attr('disabled', true);
            }
        });

        request.done(function(res) {
            syncTitlesList(res['titles_list']);
            $('#saveTitleName').val('');
            $('.alert-success').children('span').html('Your program has been deleted!');
            $('.alert-success').slideDown(500).delay(2000).slideUp(500);
            $('.remove-project').attr('disabled', false);
        });

        request.fail(function() {
            $('.alert-danger').children('span').html('An internal error occurred. Please try again later.');
            $('.alert-danger').slideDown(500).delay(2000).slideUp(500);
            $('.remove-project').attr('disabled', false);
        });
    });

    $('body').on('click', '.remove-command', function() {
        $(this).closest('.command-container').remove();
        var obj = getSequenceJson();
        $.cookie("obj", JSON.stringify(obj));
    });
});

var updateSprite = function(commandName, params) {
    switch (commandName) {
        case "SetX":
            setX(params[0]);
            break;

        case "SetY":
        console.log("sety");
            setY(params[0]);
            break;

        case "Show":
            $(".sprite").fadeTo("fast", 1);
            break;

        case "Hide":
            $(".sprite").fadeTo("fast", 0);
            break;

        case "Move":
        console.log("move");
            move(params[0]);
            break;

            /* case "Bg" : changeBg(params[0]);
             break;*/
    }

    function setX(x) {
        x = 150 + parseInt(x);
        x = x > 310 ? 310 : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            left: x
        });
    }


    function setY(x) {
        x = 150 - parseInt(x);
        x = x > 290 ? 290 : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            top: x
        });
    }

    function move(x) {
        var curr = $('.sprite').position().left;
        var newPos = curr + parseInt(x);

        newPos = newPos > 310 ? 310 : newPos;
        newPos = newPos < 0 ? 0 : newPos;

        $(".sprite").animate({
            left: newPos
        });


    }

}
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
};

var loadFromJSON = function (objStr) {
    if (objStr) {
        $('#sortable2').empty();
        objStr = JSON.parse(objStr);

        function loadJSONData(obj) {
            $.each(obj, function(index) {
                var listElement = $('<li>').addClass('ui-state-default command-container');
                var command = $('<div>').addClass('command');
                $.each(obj[index], function(k, v) {
                    if (k == "title") {
                        var commandName = $('<div>').addClass(k).text(v);
                        var removeCommand = $('<span>').addClass("glyphicon glyphicon-remove pull-right remove-command");
                        command.append(commandName);
                        command.append(removeCommand);
                    } else {
                        var param = $('<input>').attr('type', 'text')
                            .addClass('param').attr('name', k)
                            .attr('value', v);
                        command.append(param);
                    }
                });

                listElement.append(command);
                $('#sortable2').append(listElement);
            });
        }

        loadJSONData(objStr.data);
    }
};

var syncTitlesList = function(titlesList) {
    $('#load-titles-list').empty();
    var listLength = titlesList.length;

    function createLoadTitleItem(title) {
        var elem = '<li role="presentation"><a href="#" tabindex="-1" class="link">' +
            '<span class="load-project">' + title + '</span>' +
            '<span class="glyphicon glyphicon-remove pull-right remove-project"></span>' +
            '</a></li>';
        return elem;
    }
    for (var i = 0; i < listLength; i++) {
        $('#load-titles-list').append(createLoadTitleItem(titlesList[i]));
    }
};
