var SPRITE_CENTER_X = 350;
var SPRITE_CENTER_Y = 175;
var SPRITE_MAX_X = 765;
var SPRITE_MAX_Y = 372;
var NUM_SOUNDS = 8;
var NUM_COSTUMES = 8;
var NUM_BACKGROUNDS = 6;
var VAR_NAMES = [
    "spriteX",
    "spriteY",
    "spriteAngle",
    "currentCostume",
    "canvasHeight",
    "canvasWidth",
    "currentBg",
    "mouseX",
    "mouseY"
];


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
var mousePosition = {
    x: 0,
    y: 0
};

$(function() {
    $('#feedbackArea').mousemove(function(event) {
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
        var preview = $('<li>').addClass('preview-element-container');
        var command = $('<div>').addClass('command');
        var title = $('<div>').addClass('title').attr('data-cmd-name', 'Bg').html('Bg ' + (i + 1));
        var thumbnail = $('<img>').addClass('thumbnail').attr('src', '/img/bg_' + (i + 1) % NUM_BACKGROUNDS + '.jpg');
        var removeCmd = $('<span>').addClass('glyphicon glyphicon-remove pull-right hide remove-command');
        var value = $('<input>').addClass('param').css('display', 'none').attr('name', 'id').val(i+1);
        
        command.append(title).append(thumbnail).append(removeCmd).append(value);
        preview.append(command);
        backgroundsContainer.append(preview);
    }

    for (var i = 0; i < NUM_COSTUMES; i++) {
        var preview = $('<li>').addClass('preview-element-container');
        var command = $('<div>').addClass('command');
        var title = $('<div>').addClass('title').attr('data-cmd-name', 'Costume').html('Costume ' + (i + 1));
        var thumbnail = $('<img>').addClass('thumbnail').attr('src', '/img/cat_' + (i + 1) % NUM_COSTUMES + '.png');
        var removeCmd = $('<span>').addClass('glyphicon glyphicon-remove pull-right hide remove-command');
        var value = $('<input>').addClass('param').css('display', 'none').attr('name', 'id').val(i+1);
        
        command.append(title).append(thumbnail).append(removeCmd).append(value);
        preview.append(command);
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

    $('#backgroundsReference > ul').find(".preview-element-container").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20,
        start: function(e, ui) {
            ui.helper.removeClass('template-command-container ui-draggable').addClass('command-container wide');
        }
    });

    $('#costumesReference > ul').find(".preview-element-container").draggable({
        connectToSortable: ".connected-sortable",
        forcePlaceholderSize: false,
        helper: "clone",
        distance: 20,
        start: function(e, ui) {
            ui.helper.removeClass('template-command-container ui-draggable').addClass('command-container wide');
        }
    });

    $('.preview-element-container').on('click', function(){
        var command = $(this).find('.title');
        var commandName = command.data('cmdName');
        var id = $(this).find('input').val();
        if(commandName === 'Bg'){
            var currBg = $('.bg-image');
            var imagePath = '/img/bg_' + (id % NUM_BACKGROUNDS) + '.jpg';
            currBg.css('display', 'hidden');
            currBg.attr('src', imagePath);
        }
        else{
            var sprite = $('.sprite');
            var imagePath = '/img/cat_' + (id % NUM_COSTUMES) + '.png';
            sprite.css('display', 'hidden');
            sprite.attr('src', imagePath);
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

    $('#programList').on('change', 'input', function() {
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

    $('#resetButton').on('click', function() {
        if ($('#playButton').hasClass('unclickable')) {
            return;
        }
        $('#programList').empty();
        var obj = getSequenceJson();
        $.cookie('cachedProject', JSON.stringify(obj));
    });

    $('body').on('click', '.remove-command', function() {
        $(this).closest('.command-container').remove();
        var obj = getSequenceJson();
        $.cookie('cachedProject', JSON.stringify(obj));
    });

    $("[rel='tooltip']").tooltip({
        html:true,
        placement: 'bottom',
        appendTo: 'body'
    });

});

var autocompleteOverride = function(event, ui) {
            var fullInput = ($(this).val());
            var words = fullInput.split(' ');
            var lastWord = words[words.length - 1];
            var partialInput = fullInput.substring(0, fullInput.length - lastWord.length);
            if (lastWord.length > 1) {
                for (var i = 0; i = ui.content.length; i++) {
                    ui.content.pop();
                }
                $.each(VAR_NAMES, function(index, value) {
                    if (value.indexOf(lastWord) == 0)
                        ui.content.push({
                            label: value,
                            value: partialInput + value
                        });
                });
            }
        };

var preprocessExpression = function(expression) {
    var currX = ($('.sprite').position().left - SPRITE_CENTER_X).toString();
    var currY = (SPRITE_CENTER_Y - $('.sprite').position().top).toString();
    var currAngle = (getRotationDegrees($('#feedbackArea .sprite'))).toString();
    var currSprite = $('#feedbackArea .sprite').attr('src').substr(9, 1);
    var currBg = $('#feedbackArea .bg-image').attr('src').substr(8, 1);
    var canvasHeight = SPRITE_MAX_Y.toString();
    var canvasWidth = SPRITE_MAX_X.toString();
    var mouseX = ((mousePosition.x - $('#feedbackArea').position().left) - SPRITE_CENTER_X).toString();
    var mouseY = (SPRITE_CENTER_Y - (mousePosition.y - $('#feedbackArea').position().top)).toString();
    return expression.replace('spriteX', currX).replace('spriteY', currY).replace('spriteAngle',
        currAngle).replace('currentCostume', currSprite).replace('canvasHeight', canvasHeight).replace('canvasWidth',
        canvasWidth).replace('currentBg', currBg).replace('mouseX', mouseX).replace('mouseY', mouseY);
};

function getRotationDegrees(elem) {
    var matrix = elem.css("-webkit-transform") || elem.css("-moz-transform") || elem.css("-ms-transform") ||
        elem.css("-o-transform") || elem.css("transform");
    var angle = 0;
    if (matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }
    return (angle < 0) ? angle += 360 : angle;
}

var isExpressionValid = function(expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        var evalResult = math.eval(processedExpression);
        return !isNaN(evalResult);
    } catch (err) {
        return false;
    }
};

var evalExpression = function(expression) {
    var processedExpression = preprocessExpression(expression);
    try {
        var evalResult = math.eval(processedExpression);
        return  evalResult;
    } catch (err) {
        return NaN;
    }
};


/*********************
 * Command execution *
 *********************/
var startCommandExecution = function(commands) {
    commands['executeNext'] = function(idx, removeChild) {
        removeChild = typeof removeChild !== 'undefined' ? removeChild : false;

        if (removeChild) {
            commands.splice(idx, 1);
        }

        if (idx < commands.length && !shouldStopExecution) {
            execute(commands[idx], commands['executeNext'], idx);
        } else if (commands.length === 0) {
            shouldStopExecution = false;
            $('#playButton').removeClass('unclickable');
            console.log('Done with execution');
            return;
        } else {
            shouldStopExecution = false;
            $('#playButton').removeClass('unclickable');
            console.log('Done with execution');
            return;
        }
    };
    if (commands.length > 0) {
        execute(commands[0], commands['executeNext'], 0);
    }
};

var execute = function(command, nextCommandFn, idx) {
    if (!command) {
        return ;
    }
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
        commandExecutor(command, nextCommandFn, idx);
    } else {
        console.log('Not implemented');
    }

    function setX(command, nextCommandFn, idx) {
        var value = evalExpression(command['value']) | 0;
        var x = SPRITE_CENTER_X + value;
        x = x > SPRITE_MAX_X ? SPRITE_MAX_X : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            left: x
        }, function() {
            nextCommandFn(idx + 1);
        });
    }


    function setY(command, nextCommandFn, idx) {
        var value = evalExpression(command['value']) | 0;
        var x = SPRITE_CENTER_Y - value;
        x = x > SPRITE_MAX_Y ? SPRITE_MAX_Y : x;
        x = x < 0 ? 0 : x;

        $(".sprite").animate({
            top: x
        }, function() {
            nextCommandFn(idx + 1);
        });
    }

    function show(command, nextCommandFn, idx) {
        $(".sprite").fadeTo("fast", 1, function() {
            nextCommandFn(idx + 1);
        });
    }

    function hide(command, nextCommandFn, idx) {
        $(".sprite").fadeTo("fast", 0, function() {
            nextCommandFn(idx + 1);
        });
    }

    function move(command, nextCommandFn, idx) {
        var currX = $('#feedbackArea .sprite').position().left;
        var currY = $('#feedbackArea .sprite').position().top;
        var moveAmt = evalExpression(command['amount']) | 0;
        var currAngle = 0 - getRotationDegrees($('#feedbackArea .sprite'));
        var moveXAmt = (math.eval('cos(' + currAngle + ' deg)') * moveAmt);
        var moveYAmt = 0 - (math.eval('sin(' + currAngle + ' deg)') * moveAmt);
        var nextX = currX + moveXAmt;
        var nextY = currY + moveYAmt;

        nextX = nextX > SPRITE_MAX_X ? SPRITE_MAX_X : nextX;
        nextX = nextX < 0 ? 0 : nextX;
        nextY = nextY > SPRITE_MAX_Y ? SPRITE_MAX_Y : nextY;
        nextY = nextY < 0 ? 0 : nextY;

        $(".sprite").animate({
            left: nextX,
            top: nextY
        }, function() {
            nextCommandFn(idx + 1);
        });
    }

    function changeCostume(command, nextCommandFn, idx) {
        var id = evalExpression(command['id']) | 0;
        id = ((id % NUM_COSTUMES) + NUM_COSTUMES) % NUM_COSTUMES;
        var imagePath = '/img/cat_' + id + '.png';

        var sprite = $('.sprite');
        sprite.css('display', 'hidden');
        sprite.attr('src', imagePath);
        sprite.fadeTo('fast', 1, function() {
            nextCommandFn(idx + 1);
        });
    }

    function changeBg(command, nextCommandFn, idx) {
        var id = (evalExpression(command['id']) | 0);
        id = ((id % NUM_BACKGROUNDS) + NUM_BACKGROUNDS) % NUM_BACKGROUNDS;
        var currBg = $('.bg-image');
        var imagePath = '/img/bg_' + id + '.jpg';
        currBg.css('display', 'hidden');
        currBg.attr('src', imagePath);
        currBg.fadeTo("fast", 1, function() {
            nextCommandFn(idx + 1);
        });
    }

    function repeat(command, nextCommandFn, idx) {
        var repeatTimes = evalExpression(command['iterations']) | 0;
        var repeatedTimesSoFar = 0;
        command['commands-1']['executeNext'] = function(repeatIdx, removeChild) {
            removeChild = typeof removeChild !== 'undefined' ? removeChild : false;

            if (removeChild) {
                command['commands-1'].splice(repeatIdx, 1);
            }

            if (shouldStopExecution) {
                shouldStopExecution = false;
                nextCommandFn(idx + 1);
                return;
            }
            if (command['commands-1'].length === 0) {
                nextCommandFn(idx, true);
            }
            if (repeatIdx < command['commands-1'].length) {
                execute(command['commands-1'][repeatIdx], command['commands-1']['executeNext'], repeatIdx);
            } else {
                repeatedTimesSoFar++;
                if (repeatedTimesSoFar < repeatTimes) {
                    execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
                } else {
                    repeatedTimesSoFar = 0;
                    nextCommandFn(idx + 1);
                }
            }
        };
        if (command['commands-1'].length > 0 && repeatTimes > 0) {
            execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
        } else {
            nextCommandFn(idx, true);
        }
    }

    function forever(command, nextCommandFn, idx) {
        command['commands-1']['executeNext'] = function(repeatIdx, removeChild) {
            removeChild = typeof removeChild !== 'undefined' ? removeChild : false;

            if (removeChild) {
                command['commands-1'].splice(repeatIdx, 1);
            }

            if (shouldStopExecution) {
                nextCommandFn(idx + 1);
                return;
            }
            if (command['commands-1'].length === 0) {
                nextCommandFn(idx, true);
            }
            if (repeatIdx < command['commands-1'].length) {
                execute(command['commands-1'][repeatIdx], command['commands-1']['executeNext'], repeatIdx);
            } else {
                execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
            }
        };
        if (command['commands-1'].length > 0) {
            execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
        } else {
            nextCommandFn(idx, true);
        }
    }

    function ifElse(command, nextCommandFn, idx) {
        var rawResult = evalExpression(command['condition']);
        var condition = (typeof rawResult === 'boolean' && rawResult) || false;
        var branchToTake = condition ? 'commands-1' : 'commands-2';
        command[branchToTake]['executeNext'] = function(ifElseIdx, removeChild) {
            removeChild = typeof removeChild !== 'undefined' ? removeChild : false;

            if (removeChild) {
                command['commands-1'].splice(ifElseIdx, 1);
            }

            if (command[branchToTake].length === 0) {
                nextCommandFn(idx, true);
            }
            if (ifElseIdx < command[branchToTake].length && !shouldStopExecution) {
                execute(command[branchToTake][ifElseIdx], command[branchToTake]['executeNext'], ifElseIdx);
            } else {
                nextCommandFn(idx + 1);
            }
        };
        if (command[branchToTake].length > 0) {
            execute(command[branchToTake][0], command[branchToTake]['executeNext'], 0);
        } else {
            nextCommandFn(idx, true);
        }
    }

    function playSound(command, nextCommandFn, idx) {
        var soundIdx = evalExpression(command['id']) || 0;
        soundIdx = ((soundIdx + NUM_SOUNDS) % NUM_SOUNDS);
        var soundToPlay = soundFactory[soundIdx];
        $(soundToPlay).on('ended', function() {
            $(soundToPlay).unbind('ended');
            nextCommandFn(idx + 1);
        });
        soundToPlay.play();
    }

    function rotate(command, nextCommandFn, idx) {
        var rotateDegree = parseFloat(command['id']) + getRotationDegrees($('#feedbackArea .sprite'));
        var rotateStr = 'rotate(' + rotateDegree + 'deg)';
        $('.sprite').css('-webkit-transform', rotateStr).css('-moz-transform', rotateStr).css('-ms-transform',
            rotateStr).css('-o-transform', rotateStr).css('transform', rotateStr);
        $('.sprite').fadeTo('fast', 1, function() {
            nextCommandFn(idx + 1);
        });
    }

    function setAngle(command, nextCommandFn, idx) {
        var rotateDegree = parseFloat(command['id']);
        var rotateStr = 'rotate(' + rotateDegree + 'deg)';
        $('.sprite').css('-webkit-transform', rotateStr).css('-moz-transform', rotateStr).css('-ms-transform',
            rotateStr).css('-o-transform', rotateStr).css('transform', rotateStr);
        $('.sprite').fadeTo('fast', 1, function() {
            nextCommandFn(idx + 1);
        });
    }

    function whileHandle(command, nextCommandFn, idx) {
        var rawResult = evalExpression(command['condition']);
        var condition = (typeof rawResult === 'boolean' && rawResult) || false;
        command['commands-1']['executeNext'] = function (repeatIdx, removeChild) {
            removeChild = typeof removeChild !== 'undefined' ? removeChild : false;

            if (removeChild) {
                command['commands-1'].splice(repeatIdx, 1);
            }

            if (shouldStopExecution) {
                nextCommandFn(idx + 1);
                return ;
            }
            if (command['commands-1'].length === 0) {
                nextCommandFn(idx, true);
            }
            rawResult = evalExpression(command['condition']);
            condition = (typeof rawResult === 'boolean' && rawResult) || false;
            if (repeatIdx < command['commands-1'].length) {
                execute(command['commands-1'][repeatIdx], command['commands-1']['executeNext'], repeatIdx);
            } else if (condition) {
                execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
            } else {
                nextCommandFn(idx + 1);
            }
        };
        if (command['commands-1'].length > 0 && condition) {
            execute(command['commands-1'][0], command['commands-1']['executeNext'], 0);
        } else {
            nextCommandFn(idx, true);
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
            $('#programList').empty();
            var commands = JSON.parse(objStr);
            var container = $('#programList');
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
                    // if this param does not start with 'commands', 'id' or 'title'
                    if (k.indexOf('commands') != 0 && k.indexOf('id') != 0 && k.indexOf('title') != 0) {
                        var paramElem = $('<input>').attr('type', 'text').addClass('param').attr('name', k).attr('value', v);

                        paramElem.autocomplete({
                            source: VAR_NAMES,
                            autoFocus: 'true',
                            response: autocompleteOverride
                        });
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

        // add the nested blocks if they exist
        for (var i = 1; ; i++) {
            if ($(elem).children('.command').children('.title-'+i).html()) {
                command['title-'+i] = $(elem).children('.command').children('.title-'+i).html();
                command['commands-'+i] = [];
                var subCommands = $(elem).children('.command').children('.sub-list-'+i).children('.connected-sortable').children('li');
                for (var j = 0; j < subCommands.length; j++) {
                    insertCommand(subCommands[j], command['commands-'+i]);
                }
            } else {
                break;
            }
        }
        obj.push(command);
    }
    var commands = $('#programList').children("li");
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
    $(ui.item).removeClass('template-command-container').removeClass('wide').addClass('command-container').attr('style', '')
        .find(".remove-command").removeClass('hide');

    $(ui.item).find('.repeat-list').removeClass('hide');
    $(ui.item).find('.connected-sortable').sortable({
        receive: sortableReceiveHandle,
        update: sortableUpdateHandle
    });

    if($(ui.item).hasClass('preview-element-container')){
          $(ui.item).find('input').show();
          $(ui.item).find('img').remove();
          var titleElement = $(ui.item).find('.title');
          titleElement.html(titleElement.data('cmdName'));
          $(ui.item).removeClass('preview-element-container');
    }

    $(ui.item).find('input').autocomplete({
        source: VAR_NAMES,
        autoFocus: 'true',
        response: autocompleteOverride
    });

    var obj = getSequenceJson();
    $.cookie('cachedProject', JSON.stringify(obj));
};
