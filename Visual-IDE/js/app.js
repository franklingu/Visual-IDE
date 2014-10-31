var SPRITE_CENTER_X = 350;
var SPRITE_CENTER_Y = 175;
var SPRITE_MAX_X = 765;
var SPRITE_MAX_Y = 372;

var shouldStopExecution = false;
var soundFactory = {
    1: new Audio('sound/banana_slap.mp3'),
    2: new Audio('sound/blop.mp3'),
    3: new Audio('sound/bullet_whizzing_by.mp3'),
    4: new Audio('sound/pin_dropping.mp3'),
    5: new Audio('sound/realistic.mp3'),
    6: new Audio('sound/shells_falls.mp3'),
    7: new Audio('sound/tick.mp3'),
    8: new Audio('sound/woosh.mp3')
};


/****************************************************
 * attching object types and events to DOM elements *
 ****************************************************/
$(function() {
    $(".commandsContainer").find("li").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20,
        start: function(e, ui) {
            ui.helper.removeClass('template-command-container ui-draggable').addClass('command-container wide');
        }
    });

    $(".sprite").draggable({
        containment: "parent"
    });

    $(".connected-sortable").sortable({
        receive: sortableReceiveHandle,
        update: sortableUpdateHandle
    });

    $("#feedbackArea").droppable();


    $('#sortable2').on('change', 'input', function() {
        if (!isExpressionValid($(this).val())) {
            // TODO: change to tooltip or also with help of red highlighting
            console.log('invalid input');
            $(this).val('1');
        } else {
            var obj = getSequenceJson();
            $.cookie('cachedProject', JSON.stringify(obj));
        }
    });

    $('#playButton').on('click', function() {
        var obj = getSequenceJson();
        $('#playButton').prop('disabled', true);
        startCommandExecution(obj.data);
        $('#playButton').prop('disabled', false);
    });

    $('#stopButton').on('click', function() {
        shouldStopExecution = true;
    });

    $('body').on('click', '.remove-command', function() {
        $(this).closest('.command-container').remove();
        var obj = getSequenceJson();
        $.cookie('cachedProject', JSON.stringify(obj));
    });

});

// TODO: finish this function
var preprocessExpression = function (expression) {
    var currX = $('.sprite').position().left;
    var currY = $('.sprite').position().top;
    return expression.replace('x', currX).replace('y', currY);
};

var isExpressionValid = function (expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        math.eval(processedExpression);
        return true;
    } catch(err) {
        return false;
    }
};

var evalExpression = function (expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        return math.eval(processedExpression);
    } catch(err) {
        return NaN;
    }
};


/*********************
 * Command execution *
 *********************/
var startCommandExecution = function(commands) {
    commands['executeNext'] = function (idx) {
        if (idx < commands.length && !shouldStopExecution) {
            execute(commands[idx], commands, idx);
        } else {
            shouldStopExecution = false;
            console.log('Done with execution');
            return ;
        }
    };
    if (commands.length > 0) {
        execute(commands[0], commands, 0);
    }
};

var execute = function(command, commands, idx) {
    var commandName = command['title'];
    var commandFactory = {
        'SetX': setX,
        'SetY': setY,
        'Show': show,
        'Hide': hide,
        'Move': move,
        'Costume': changeCostume,
        'Bg': changeBg,
        'Repeat': repeat,
        'Forever': forever,
        'If': ifElse,
        'Sound': playSound
    };

    var commandExecutor = commandFactory[commandName];
    if (commandExecutor) {
        commandExecutor(command, commands, idx);
    } else {
        console.log('Not implemented');
    }

    function setX(command, commands, idx) {
        var value = evalExpression(command['value']) || 0;
        var x = SPRITE_CENTER_X + value;
        x = x > SPRITE_MAX_X ? SPRITE_MAX_X : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            left: x
        }, function() {
            commands.executeNext(idx + 1);
        });
    }


    function setY(command, commands, idx) {
        var value = parseInt(command['value']) || 0;
        var x = SPRITE_CENTER_Y - value;
        x = x > SPRITE_MAX_Y ? SPRITE_MAX_Y : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            top: x
        }, function() {
            commands.executeNext(idx + 1);
        });
    }

    function show(command, commands, idx) {
        $(".sprite").fadeTo("fast", 1, function() {
            commands.executeNext(idx + 1);
        });
    }

    function hide(command, commands, idx) {
        $(".sprite").fadeTo("fast", 0, function() {
            commands.executeNext(idx + 1);
        });
    }

    function move(command, commands, idx) {
        var currX = $('.sprite').position().left;
        var moveXAmt = evalExpression(command['amount']) || 0;
        var newPos = currX + moveXAmt;

        newPos = newPos > SPRITE_MAX_X ? SPRITE_MAX_X : newPos;
        newPos = newPos < 0 ? 0 : newPos;

        $(".sprite").animate({
            left: newPos
        }, function() {
            commands.executeNext(idx + 1);
        });
    }

    function changeCostume(command, commands, idx) {
        var id = command['id'];
        var imagePath = '/img/cat_' + id + '.png';

        var sprite = $('.sprite');
        sprite.css('display', 'hidden');
        sprite.attr('src', imagePath);
        sprite.fadeIn('fast', function() {
            commands.executeNext(idx + 1);
        });
    }

    function changeBg(command, commands, idx) {
        var id = command['id'];
        var currBg = $('.bg-image');
        if (id == 0) {
            currBg.fadeOut("fast", function() {
                commands.executeNext(idx + 1);
            });
        } else {
            var imagePath = '/img/bg_' + id + '.jpg';
            currBg.css('display', 'hidden');
            currBg.attr('src', imagePath);
            $(".bg-image").fadeIn("fast", function() {
                commands.executeNext(idx + 1);
            });
        }
    }

    function repeat(command, commands, idx) {
        var repeatTimes = evalExpression(command['iterations']) || 0;
        var repeatedTimesSoFar = 0;
        command['commands']['executeNext'] = function (repeatIdx) {
            if (repeatIdx < command['commands'].length && !shouldStopExecution) {
                execute(command['commands'][repeatIdx], command['commands'], repeatIdx);
            } else {
                repeatedTimesSoFar++;
                if (repeatedTimesSoFar < repeatTimes && !shouldStopExecution) {
                    execute(command['commands'][0], command['commands'], 0);
                } else {
                    repeatedTimesSoFar=0;
                    commands.executeNext(idx + 1);
                }
            }
        };
        if (command['commands'].length > 0 && repeatTimes > 0) {
            execute(command['commands'][0], command['commands'], 0);
        } else {
            commands.executeNext(idx + 1);
        }
    }

    function forever(command, commands, idx) {
        command['commands']['executeNext'] = function (repeatIdx) {
            if (shouldStopExecution) {
                shouldStopExecution = false;
                return ;
            }
            if (repeatIdx < command['commands'].length) {
                execute(command['commands'][repeatIdx], command['commands'], repeatIdx);
            } else {
                execute(command['commands'][0], command['commands'], 0);
            }
        };
        if (command['commands'].length > 0) {
            execute(command['commands'][0], command['commands'], 0);
        } else {
            commands.executeNext(idx + 1);
        }
    }

    function ifElse(command, commands, idx) {
        var rawResult = evalExpression(command['condition']);
        var condition = (typeof rawResult === 'boolean' && rawResult) || false;
        var branchToTake = condition ? 'commands1' : 'commands2';
        command[branchToTake]['executeNext'] = function (ifElseIdx) {
            if (ifElseIdx < command[branchToTake].length && !shouldStopExecution) {
                execute(command[branchToTake][ifElseIdx], command[branchToTake], ifElseIdx);
            } else {
                commands.executeNext(idx + 1);
            }
        };
        if (command[branchToTake].length > 0) {
            execute(command[branchToTake][0], command[branchToTake], 0);
        } else {
            commands.executeNext(idx + 1);
        }
    }

    function playSound(command, commands, idx) {
        var soundIdx = command['id'];
        var soundToPlay = soundFactory[soundIdx];
        $(soundToPlay).on('ended', function () {
            $(soundToPlay).unbind('ended');
            commands.executeNext(idx + 1);
        });
        soundToPlay.play();
    }
};


/*********************************************
 * Loading and Saving data using AJAX calls  *
 *********************************************/
$(function() {
    var loadFromJSON = function(objStr) {
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
                var removeCommand = $('<span>').addClass("glyphicon glyphicon-remove pull-right remove-command");
                commandElem.append(removeCommand);
                var commandName = $('<div>').addClass("title").text(command["title"]);
                commandElem.append(commandName);

                if (command['title'] === 'If') {
                    // handle if-branch commands list
                    var repeatListElem = $('<div>').addClass('repeat-list').attr('id', 'ifExec');
                    var ulListElem = $('<ul>').addClass('connected-sortable ui-sortable');
                    ulListElem.sortable({
                        receive: sortableReceiveHandle,
                        update: sortableUpdateHandle
                    });
                    loadCommands(command['commands1'], ulListElem);
                    repeatListElem.append(ulListElem);
                    commandElem.append(repeatListElem);

                    // write down Else
                    var secondTitle = $('<div>').addClass('title-2').html('Else');
                    commandElem.append(secondTitle);

                    // handle else-branch commands list
                    repeatListElem = $('<div>').addClass('repeat-list').attr('id', 'elseExec');
                    ulListElem = $('<ul>').addClass('connected-sortable ui-sortable');
                    ulListElem.sortable({
                        receive: sortableReceiveHandle,
                        update: sortableUpdateHandle
                    });
                    loadCommands(command['commands2'], ulListElem);
                    repeatListElem.append(ulListElem);
                    commandElem.append(repeatListElem);
                }
                $.each(command, function(k, v) {
                    if (k === 'title' || k === 'commands1' || k === 'commands2') {
                        // skip as they handled separately
                    } else if (k === 'commands') {
                        var repeatListElem = $('<div>').addClass('repeat-list');
                        var ulListElem = $('<ul>').addClass('connected-sortable ui-sortable');
                        ulListElem.sortable({
                            receive: sortableReceiveHandle,
                            update: sortableUpdateHandle
                        });
                        loadCommands(v, ulListElem);
                        repeatListElem.append(ulListElem);
                        commandElem.append(repeatListElem);
                    } else {
                        var paramElem = $('<input>').attr('type', 'text').addClass('param').attr('name', k).attr('value', v);
                        removeCommand.after(paramElem);
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

    var showUIFeedback = function(className, message) {
        $(className).children('span').html(message);
        $(className).slideDown(500).delay(2000).slideUp(500);
    };

    var objStr = $.cookie('cachedProject');
    loadFromJSON(objStr);

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
                showUIFeedback('.alert-danger', 'Please login before saving your work.');
            } else {
                showUIFeedback('.alert-success', 'Your program has been saved!');
            }
            $('.save-title').attr('disabled', false);
        });
        request.fail(function() {
            $.cookie('cachedProject', JSON.stringify(obj));
            showUIFeedback('.alert-danger', 'An internal error occurred. Please try again later.');
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
            showUIFeedback('.alert-success', 'Your program has been loaded!');
            $('.load-title').attr('disabled', false);
        });
        request.fail(function() {
            showUIFeedback('.alert-danger', 'An internal error occurred. Please try again later.');
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
            showUIFeedback('.alert-success', 'our program has been deleted!');
            $('.remove-project').attr('disabled', false);
        });
        request.fail(function() {
            showUIFeedback('.alert-danger', 'An internal error occurred. Please try again later.');
            $('.remove-project').attr('disabled', false);
        });
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
            }
        } else if (command['title'] === 'If') {
            command['commands1'] = [];
            command['commands2'] = [];
            var ifSubCommands = $(elem).find('#ifExec').children('.connected-sortable').children('li');
            var elseSubCommands = $(elem).find('#elseExec').children('.connected-sortable').children('li');

            for (var i = 0; i < ifSubCommands.length; i++) {
                insertCommand(ifSubCommands[i], command['commands1']);
            }

            for (var i = 0; i < elseSubCommands.length; i++) {
                insertCommand(elseSubCommands[i], command['commands2']);
            }
        } else if (command['title'] === 'Forever') {
            command['commands'] = [];
            var subCommands = $(elem).children('.command').children('.repeat-list').children('.connected-sortable').children('li');
            for (var i = 0; i < subCommands.length; i++) {
                insertCommand(subCommands[i], command['commands']);
            }
        }
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

var sortableReceiveHandle = function(e, ui) {
    copyHelper = null;
};

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
