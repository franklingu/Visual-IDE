$(document).ready(function(){
    var objStr = $.cookie("obj");
    $.removeCookie('obj');
    if (objStr) {
        console.log(JSON.parse(objStr));
    }
});

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

    $('#save-title').on('click', function () {
        var obj = getSequenceJson();
        title = $('#saveTitleName').val();
        if (title === null) {
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
        request.fail(function () {
            $.cookie("obj", JSON.stringify(obj));
        });

        return false;
    });

    $('.load-title').on('click', function () {
        var obj = {'title': $(this).prop('data-value')};
        var request = $.ajax({url: '/load/', type: 'GET', data: obj, dataType: 'json'});
        var request = $.ajax({url: '/load/?project_title='+obj.title, type: 'GET', data: obj, dataType: 'json'});
        request.done(function (res) {
            console.log(res['status']);
            console.log(res['project_title']);
            console.log(res['project_content']);
        });
    });
});
