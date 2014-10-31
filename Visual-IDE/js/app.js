var SPRITE_CENTER_X = 350;
var SPRITE_CENTER_Y = 175;
var SPRITE_MAX_X = 765;
var SPRITE_MAX_Y = 372;
var NUM_SOUNDS = 8;
var NUM_COSTUMES = 8;
var NUM_BACKGROUNDS = 6;


var shouldStopExecution = false;
var soundFactory = {
    0: new Audio('sound/woosh.wav'),
    1: new Audio('sound/banana_slap.wav'),
    2: new Audio('sound/blop.wav'),
    3: new Audio('sound/bullet_whizzing_by.wav'),
    4: new Audio('sound/pin_dropping.wav'),
    5: new Audio('sound/realistic.wav'),
    6: new Audio('sound/shells_falls.wav'),
    7: new Audio('sound/tick.wav'),
};
var mousePosition = {x: 0, y: 0};

$(function () {
    $('#feedbackArea').mousemove(function (event) {
        mousePosition.x = event.pageX;
        mousePosition.y = event.pageY;
    });
});

/****************************************************
 *** adding previews for backgrounds and costumes ***
 ****************************************************/

$(function() {

    var costumesContainer = $('#costumesReference > ul');
    var backgroundsContainer = $('#backgroundsReference > ul');

    // add background images
    for (var i = 0; i < NUM_BACKGROUNDS; i++) {
        var preview = $('<li>');
        var title = $('<div>').addClass('title').html('Bg ' + (i + 1));
        var thumbnail = $('<img>').addClass('thumbnail').attr('src', '/img/bg_' + (i + 1) % NUM_BACKGROUNDS + '.jpg');
        var value = $('<input>').attr('type', 'hidden').attr('name', 'bgid').val(i);

        preview.append(title).append(thumbnail).append(value);
        backgroundsContainer.append(preview);
    }

    for (var i = 0; i < NUM_COSTUMES; i++) {
        var preview = $('<li>');
        var title = $('<div>').addClass('title').html('Costume ' + (i + 1));
        var thumbnail = $('<img>').addClass('thumbnail').attr('src', '/img/cat_' + (i + 1) % NUM_COSTUMES + '.png');
        var value = $('<input>').attr('type', 'hidden').attr('name', 'costumeid').val(i);

        preview.append(title).append(thumbnail).append(value);
        costumesContainer.append(preview);
    }
});


/****************************************************
 * attaching object types and events to DOM elements *
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
        if ($('#playButton').hasClass('unclickable')) {
            return;
        }
        var obj = getSequenceJson();
        $('#playButton').addClass('unclickable');
        startCommandExecution(obj.data);
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

var preprocessExpression = function (expression) {
    var currX = ($('#feedbackArea .sprite').position().left - SPRITE_CENTER_X).toString();
    var currY = (SPRITE_CENTER_Y - $('.sprite').position().top).toString();
    var currAngle = (getRotationDegrees($('#feedbackArea .sprite'))).toString();
    var currSprite = $('#feedbackArea .sprite').attr('src').substr(9, 1);
    var currBg = $('#feedbackArea .bg-image').attr('src').substr(8, 1);
    var canvasHeight = SPRITE_MAX_Y.toString();
    var canvasWidth = SPRITE_MAX_X.toString();
    var mouseX = ((mousePosition.x - $('#feedbackArea').position().left) - SPRITE_CENTER_X).toString();
    var mouseY = (SPRITE_CENTER_Y - (mousePosition.y - $('#feedbackArea').position().top)).toString();
    return expression.replace('spriteX', currX).replace('spriteY', currY).replace('spriteAngle',
        currAngle).replace('spriteNumber', currSprite).replace('canvasHeight', canvasHeight).replace('canvasWidth',
        canvasWidth).replace('canvasBg', currBg).replace('mouseX', mouseX).replace('mouseY', mouseY);
};

function getRotationDegrees(elem) {
    var matrix = elem.css("-webkit-transform") || elem.css("-moz-transform") || elem.css("-ms-transform") ||
        elem.css("-o-transform") || elem.css("transform");
    var angle = 0;
    if(matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
    }
    return (angle < 0) ? angle += 360 : angle;
}

var isExpressionValid = function (expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        var evalResult = math.eval(processedExpression);
        return !isNaN(evalResult);
    } catch(err) {
        return false;
    }
};

var evalExpression = function (expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        return math.eval(processedExpression) || 0;
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
            $('#playButton').removeClass('unclickable');
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
        'Sound': playSound,
        'Rotate': rotate,
        'SetAngle': setAngle,
        'While': whileHandle
    };

    var commandExecutor = commandFactory[commandName];
    if (commandExecutor) {
        commandExecutor(command, commands, idx);
    } else {
        console.log('Not implemented');
    }

    function setX(command, commands, idx) {
        var value = evalExpression(command['value']) | 0;
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
        var value = evalExpression(command['value']) | 0;
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
        var currX = $('#feedbackArea .sprite').position().left;
        var currY = $('#feedbackArea .sprite').position().top;
        var moveAmt = evalExpression(command['amount']) | 0;
        var currAngle = 0 - getRotationDegrees($('#feedbackArea .sprite'));
        var moveXAmt = (math.eval('cos(' + currAngle + ' deg)') * moveAmt);
        var moveYAmt = 0 - (math.eval('sin(' + currAngle + ' deg)') * moveAmt);
        var nextX = currX + moveXAmt + 27.1;  // a weird bug: suspect it is because of center of sprite
        var nextY = currY + moveYAmt;

        nextX = nextX > SPRITE_MAX_X ? SPRITE_MAX_X : nextX;
        nextX = nextX < 0 ? 0 : nextX;
        nextY = nextY > SPRITE_MAX_Y ? SPRITE_MAX_Y : nextY;
        nextY = nextY < 0 ? 0 : nextY;

        $(".sprite").animate({
            left: nextX,
            top: nextY
        }, function() {
            commands.executeNext(idx + 1);
        });
    }

    function changeCostume(command, commands, idx) {
        var id = evalExpression(command['id']) | 0;
        id = ((id % NUM_COSTUMES) +  NUM_COSTUMES) % NUM_COSTUMES;
        var imagePath = '/img/cat_' + id + '.png';

        var sprite = $('.sprite');
        sprite.css('display', 'hidden');
        sprite.attr('src', imagePath);
        sprite.fadeIn('fast', function() {
            commands.executeNext(idx + 1);
        });
    }

    function changeBg(command, commands, idx) {
        var id = (evalExpression(command['id']) | 0);
        id = ((id  % NUM_BACKGROUNDS) + NUM_BACKGROUNDS) % NUM_BACKGROUNDS;
        var currBg = $('.bg-image');       
        var imagePath = '/img/bg_' + id + '.jpg';
        currBg.css('display', 'hidden');
        currBg.attr('src', imagePath);
        $(".bg-image").fadeIn("fast", function() {
            commands.executeNext(idx + 1);
        });
        
    }

    function repeat(command, commands, idx) {
        var repeatTimes = evalExpression(command['iterations']) | 0;
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
                commands.executeNext(idx + 1);
                return;
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
        var branchToTake = condition ? 'commands' : 'commands-1';
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
        var soundIdx = evalExpression(command['id']) || 0;
        soundIdx = ((soundIdx + NUM_SOUNDS) % NUM_SOUNDS);
        var soundToPlay = soundFactory[soundIdx];
        $(soundToPlay).on('ended', function () {
            $(soundToPlay).unbind('ended');
            commands.executeNext(idx + 1);
        });
        soundToPlay.play();
    }

    function rotate(command, commands, idx) {
        var rotateDegree = parseFloat(command['id']) + getRotationDegrees($('#feedbackArea .sprite'));
        var rotateStr = 'rotate(' + rotateDegree + 'deg)';
        $('.sprite').css('-webkit-transform', rotateStr).css('-moz-transform', rotateStr).css('-ms-transform',
            rotateStr).css('-o-transform', rotateStr).css('transform', rotateStr);
        $('.sprite').fadeIn('fast', function () {
            commands.executeNext(idx + 1);
        });
    }

    function setAngle(command, commands, idx) {
        var rotateDegree = parseFloat(command['id']);
        var rotateStr = 'rotate(' + rotateDegree + 'deg)';
        $('.sprite').css('-webkit-transform', rotateStr).css('-moz-transform', rotateStr).css('-ms-transform',
            rotateStr).css('-o-transform', rotateStr).css('transform', rotateStr);
        $('.sprite').fadeIn('fast', function () {
            commands.executeNext(idx + 1);
        });
    }

    function whileHandle(command, commands, idx) {
        var rawResult = evalExpression(command['condition']);
        var condition = (typeof rawResult === 'boolean' && rawResult) || false;
        command['commands']['executeNext'] = function (repeatIdx) {
            if (shouldStopExecution) {
                shouldStopExecution = false;
                commands.executeNext(idx + 1);
                return ;
            }
            rawResult = evalExpression(command['condition']);
            condition = (typeof rawResult === 'boolean' && rawResult) || false;
            if (repeatIdx < command['commands'].length) {
                execute(command['commands'][repeatIdx], command['commands'], repeatIdx);
            } else if (condition) {
                execute(command['commands'][0], command['commands'], 0);
            } else {
                commands.executeNext(idx + 1);
            }
        };
        if (command['commands'].length > 0 && condition) {
            execute(command['commands'][0], command['commands'], 0);
        } else {
            commands.executeNext(idx + 1);
        }
    }
};


/*********************************************
 * Loading and Saving data using AJAX calls  *
 *********************************************/
$(function() {
    var loadFromJSON = function(objStr) {
        loadFromFactory = {
            'SetX': normalLoad,
            'SetY': normalLoad,
            'Show': normalLoad,
            'Hide': normalLoad,
            'Move': normalLoad,
            'Costume': normalLoad,
            'Bg': normalLoad,
            'Repeat': nestedLoad,
            'Forever': nestedLoad,
            'If': nestedLoad,
            'Sound': normalLoad,
            'Rotate': normalLoad,
            'SetAngle': normalLoad,
            'While' : nestedLoad
        };
        if (objStr) {
            $('#sortable2').empty();
            var commands = JSON.parse(objStr);
            var container = $('#sortable2');
            loadCommands(commands.data, container);

            function loadCommands(commands, container) {
                for (var i = 0; i < commands.length; i++) {
                    var listElem = $('<li>').addClass('ui-state-default command-container');
                    var commandElem = $('<div>').addClass('command');
                    loadFromFactory[commands[i]['title']](commands[i], commandElem)
                    listElem.append(commandElem);
                    container.append(listElem);
                };
            }

            function normalLoad(command, commandElem) {
                var removeCommand = $('<span>').addClass("glyphicon glyphicon-remove pull-right remove-command");
                commandElem.append(removeCommand);
                var commandName = $('<div>').addClass("title").text(command["title"]);
                commandElem.append(commandName);

                $.each(command, function(k, v) {
                    if (k != 'title') {
                        var paramElem = $('<input>').attr('type', 'text').addClass('param').attr('name', k).attr('value', v);
                        removeCommand.after(paramElem);
                    }
                });
            };

            function nestedLoad(command, commandElem) {
                var removeCommand = $('<span>').addClass("glyphicon glyphicon-remove pull-right remove-command");
                commandElem.append(removeCommand);

                for (var i = 1; ; i++) {
                    if (command['title-'+i]) {
                        var commandName = $('<div>').addClass('title title-'+i).text(command['title-'+i]);
                        commandElem.append(commandName);

                        // handle first-nested commands list
                        var repeatListElem = $('<div>').addClass('repeat-list sub-list-'+i);
                        var ulListElem = $('<ul>').addClass('connected-sortable ui-sortable');
                        ulListElem.sortable({
                            receive: sortableReceiveHandle,
                            update: sortableUpdateHandle
                        });
                        loadCommands(command['commands-'+i], ulListElem);
                        repeatListElem.append(ulListElem);
                        commandElem.append(repeatListElem);
                    } else {
                        break;
                    }
                }

                $.each(command, function(k, v) {
                    if (k.indexOf('commands') != 0 && k.indexOf('id') != 0 && k.indexOf('title') != 0) {
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
        command['title'] = $(elem).children('.command').children('.title').first().html();

        var params = $(elem).children('.command').children('.param');
        params.each(function() {
            command[$(this).attr('name')] = $(this).val();
        });
        if (command['title'] === 'Repeat' || command['title'] === 'Forever' || command['title'] === 'While') {
            command['title-1'] = command['title'];
            command['commands-1'] = [];
            var subCommands = $(elem).children('.command').children('.repeat-list').children('.connected-sortable').children('li');
            for (var i = 0; i < subCommands.length; i++) {
                insertCommand(subCommands[i], command['commands-1']);
            }
        } else if (command['title'] === 'If') {
            command['title-1'] = 'If';
            command['title-2'] = 'Else';
            command['commands-1'] = [];
            command['commands-2'] = [];
            var ifSubCommands = $(elem).find('.sub-list-1').children('.connected-sortable').children('li');
            var elseSubCommands = $(elem).find('.sub-list-2').children('.connected-sortable').children('li');

            for (var i = 0; i < ifSubCommands.length; i++) {
                insertCommand(ifSubCommands[i], command['commands-1']);
            }

            for (var i = 0; i < elseSubCommands.length; i++) {
                insertCommand(elseSubCommands[i], command['commands-2']);
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
