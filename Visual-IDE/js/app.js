$(document).ready(function() {
    var objStr = $.cookie('cachedProject');
    loadFromJSON(objStr);
});

$(function() {
    var sortableUpdateHandle = function(e, ui) {
        $(ui.item).removeClass('template-command-container').addClass('command-container').attr('style', '')
                  .find(".remove-command").removeClass('hide');

        $(ui.item).find('.repeat-list').removeClass('hide');
        $(ui.item).find('.connected-sortable').sortable({
            receive: sortableReceiveHandle,
            update: sortableUpdateHandle
        });
        var obj = getSequenceJson();
        $.cookie('cachedProject', JSON.stringify(obj));
    };

    var sortableReceiveHandle = function(e, ui) {
        copyHelper = null;
    };

    $("#sortable1").find("li").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20,
        start: function (e, ui) {
            ui.helper.removeClass('template-command-container ui-draggable').addClass('command-container wide');
        }
    });

    $(".connected-sortable").sortable({
        receive: sortableReceiveHandle,
        update: sortableUpdateHandle
    });

    $(".sprite").draggable({containment: "parent"});
    $("#feedbackArea").droppable();

    $('#playButton').on('click', function() {
        var obj = getSequenceJson();
        $('#playButton').prop('disabled', true);
        executeCommands(obj.data);
        $('#playButton').prop('disabled', false);
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
                $.cookie('cachedProject', JSON.stringify(obj));
                $('.alert-danger').children('span').html('Please login before saving your work.');
                $('.alert-danger').slideDown(500).delay(2000).slideUp(500);
            } else {
                $('.alert-success').children('span').html('Your program has been saved!');
                $('.alert-success').slideDown(500).delay(2000).slideUp(500);
            }
            $('.save-title').attr('disabled', false);
        });
        request.fail(function() {
            $.cookie('cachedProject', JSON.stringify(obj));
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
        $.cookie('cachedProject', JSON.stringify(obj));
    });
});

var getSequenceJson = function() {
    function insertCommand(elem, obj) {
        var command = {};
        command['title'] = $(elem).children('.command').children(".title").html();

        var params = $(elem).children('.command').children('.param');
        params.each(function() {
            command[$(this).attr('name')] = $(this).val();
        });
        if (command['title'] === 'Repeat') {
            command['commands'] = [];
            var subCommands = $(elem).children('.command').children('.repeat-list').children('.connected-sortable').children('li');
            for (var i = 0; i < subCommands.length; i++) {
                insertCommand(subCommands[i], command['commands']);
            };
        };
        obj.push(command);
    }
    var commands = $('#sortable2').children("li");
    var json = [];
    for (var i = 0; i < commands.length; i++) {
        insertCommand(commands[i], json);
    };
    var obj = {};
    obj['data'] = json;
    return obj;
};

var executeCommands = function(commands) {
    $.each(commands, function(index) {
        executeSingleCommand(commands[index]);
    });
}

var executeSingleCommand = function(command) {
    var commandName = command['title'];
    switch (commandName) {
        case "SetX":
            setX(command);
            break;
        case "SetY":
            setY(command);
            break;
        case "Show":
            show(command);
            break;
        case "Hide":
            hide(command);
            break;
        case "Move":
            move(command);
            break;
        case "Repeat":
            repeat(command);
            break;
        default:
            console.log("Not implemented");
            break;
    }

    function setX(command) {
        x = 150 + parseInt(command['value']);
        x = x > 310 ? 310 : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            left: x
        });
    }


    function setY(command) {
        x = 150 - parseInt(command['value']);
        x = x > 290 ? 290 : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            top: x
        });
    }

    function show(command) {
        $(".sprite").fadeTo("fast", 1);
    }

    function hide(command) {
        $(".sprite").fadeTo("fast", 0);
    }

    function move(command) {
        var curr = $('.sprite').position().left;
        var newPos = curr + parseInt(command['amount']);

        newPos = newPos > 310 ? 310 : newPos;
        newPos = newPos < 0 ? 0 : newPos;

        $(".sprite").animate({
            left: newPos
        });
    }

    function repeat(command) {
        var repeatTimes = parseInt(command['iterations']);
        for (var i = 0; i < repeatTimes; i++) {
            executeCommands(command['commands']);
        };
    }
}

var loadFromJSON = function (objStr) {
    if (objStr) {
        $('#sortable2').empty();
        var commands = JSON.parse(objStr);
        var container = $('#sortable2');
        loadCommands(commands.data, container);

        function loadCommands(commands, container) {
            for (var i = 0; i < commands.length; i++) {
                var listElem = $('<li>').addClass('ui-state-default command-container');
                var commandElem = $('<div>').addClass('command');
                recoverCommandNode(commands[i], commandElem);
                listElem.append(commandElem);
                container.append(listElem);
            };
        }

        function recoverCommandNode(command, commandElem) {
            $.each(command, function(k, v) {
                if (k === 'title') {
                    var commandName = $('<div>').addClass(k).text(v);
                    var removeCommand = $('<span>').addClass("glyphicon glyphicon-remove pull-right remove-command");
                    commandElem.append(commandName);
                    commandElem.append(removeCommand);
                } else if (k === 'commands') {
                    var repeatListElem = $('<div>').addClass('repeat-list');
                    var ulListElem = $('<ul>').addClass('connected-sortable ui-sortable');
                    loadCommands(v, ulListElem);
                    repeatListElem.append(ulListElem);
                    commandElem.append(repeatListElem);
                } else {
                    var paramElem = $('<input>').attr('type', 'text').addClass('param').attr('name', k).attr('value', v);
                    commandElem.append(paramElem);
                }
            });
        }
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
